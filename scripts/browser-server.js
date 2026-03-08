/**
 * Browser Server — headless Puppeteer instance exposed over HTTP on port 3099.
 *
 * Endpoints:
 *   POST /goto              { url }           — navigate to URL, wait for networkidle2
 *   GET  /html              — return current page HTML
 *   GET  /cookies           — return current page cookies as JSON
 *   GET  /har/peek          — return last N XHR/fetch requests without clearing
 *   GET  /har               — return full HAR log, then reset counter
 *   GET  /status            — health check
 *
 * Usage:
 *   node scripts/browser-server.js [--port 3099] [--headless true]
 */

const express = require('express');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteerExtra.use(StealthPlugin());

const PORT = (() => {
  const idx = process.argv.indexOf('--port');
  return idx !== -1 ? parseInt(process.argv[idx + 1]) : 3099;
})();

const HEADLESS = (() => {
  const idx = process.argv.indexOf('--headless');
  return idx !== -1 ? process.argv[idx + 1] !== 'false' : true;
})();

let browser = null;
let page = null;
const harLog = [];

async function launchBrowser() {
  browser = await puppeteerExtra.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' });

  page.on('request', (req) => {
    if (['xhr', 'fetch'].includes(req.resourceType())) {
      harLog.push({
        timestamp: new Date().toISOString(),
        type: req.resourceType(),
        method: req.method(),
        url: req.url(),
        headers: req.headers(),
        postData: req.postData() || null,
      });
    }
  });

  page.on('response', async (res) => {
    const entry = harLog.find(e => e.url === res.url() && !e.responseStatus);
    if (entry) {
      entry.responseStatus = res.status();
      entry.responseHeaders = res.headers();
      try {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('json')) {
          entry.responseBody = await res.text().catch(() => null);
        }
      } catch (_) {}
    }
  });

  console.log(`[browser-server] Browser launched (headless=${HEADLESS})`);
}

const app = express();
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({ ok: true, hasBrowser: !!browser, headless: HEADLESS, harEntries: harLog.length });
});

app.get('/shutdown', async (req, res) => {
  res.json({ ok: true, message: 'shutting down' });
  if (browser) await browser.close();
  process.exit(0);
});

app.post('/goto', async (req, res) => {
  const { url, waitUntil = 'networkidle2', timeout = 30000 } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const response = await page.goto(url, { waitUntil, timeout });
    res.json({ ok: true, status: response.status(), url: page.url() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/html', async (req, res) => {
  try {
    const html = await page.content();
    res.type('text/html').send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cookies', async (req, res) => {
  try {
    const cookies = await page.cookies();
    res.json(cookies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/eval', async (req, res) => {
  const { script } = req.body;
  if (!script) return res.status(400).json({ error: 'script required' });
  try {
    const result = await page.evaluate(new Function(`return (async () => { ${script} })()`));
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/type', async (req, res) => {
  const { selector, text, delay = 50 } = req.body;
  if (!selector || text === undefined) return res.status(400).json({ error: 'selector and text required' });
  try {
    await page.click(selector);
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    await page.type(selector, text, { delay });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/click', async (req, res) => {
  const { selector, text } = req.body;
  try {
    if (text) {
      // Click element containing specific text
      const el = await page.evaluateHandle((sel, txt) => {
        const els = document.querySelectorAll(sel);
        for (const e of els) {
          if (e.textContent.includes(txt)) return e;
        }
        return null;
      }, selector || '*', text);
      if (el.asElement()) {
        await el.asElement().click();
        res.json({ ok: true });
      } else {
        res.status(404).json({ error: `No element with text "${text}"` });
      }
    } else {
      await page.click(selector);
      res.json({ ok: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/keyboard', async (req, res) => {
  const { key } = req.body;
  try {
    await page.keyboard.press(key);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/screenshot', async (req, res) => {
  try {
    const path = '/tmp/browser-screenshot.png';
    await page.screenshot({ path, fullPage: false });
    res.sendFile(path);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/har/peek', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ count: harLog.length, recent: harLog.slice(-limit) });
});

app.get('/har', (req, res) => {
  const snapshot = [...harLog];
  harLog.length = 0;
  res.json({ count: snapshot.length, entries: snapshot });
});

(async () => {
  await launchBrowser();
  app.listen(PORT, () => {
    console.log(`[browser-server] Listening on http://localhost:${PORT}`);
  });
})();
