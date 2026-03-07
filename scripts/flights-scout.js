#!/usr/bin/env node
/**
 * Google Flights Scout Server
 *
 * Persistent Puppeteer server on port 3099 for checking real flight prices.
 * Claude sends HTTP requests with Google Flights URLs and gets back
 * structured flight results.
 *
 * Start:  node scripts/flights-scout.js
 * Stop:   curl http://localhost:3099/shutdown  (or Ctrl+C)
 *
 * Endpoints:
 *   POST /search   { url }           — open a Google Flights URL, extract results
 *   POST /goto     { url }           — navigate to any URL
 *   GET  /html     — return current page HTML
 *   GET  /status   — health check
 *   GET  /shutdown — close browser and stop server
 */

const http = require("http");
const puppeteer = require("puppeteer");

const PORT = 3099;
const HEADLESS = process.env.HEADLESS !== "false";
let browser = null;
let page = null;

async function ensureBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });
    // Block images/fonts for speed
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    console.log(`[flights-scout] Browser launched (headless=${HEADLESS})`);
  }
  return page;
}

// ─── Extractor ──────────────────────────────────────────────────────────────

async function extractFlights(p) {
  return p.evaluate(() => {
    const flights = [];

    // Google Flights renders results in list items
    // Each flight result is in a `li` with role="listitem" or similar containers
    const resultItems = document.querySelectorAll("li");

    for (const item of resultItems) {
      const text = item.innerText || "";
      // Skip items that don't look like flight results
      if (!text.includes("€") && !text.includes("$") && !text.includes("£")) continue;
      if (text.length < 30) continue;
      // Skip if it's a header or label
      if (text.includes("Tracking prices") || text.includes("Track prices")) continue;

      // Try to parse the flight info from the text
      // Format is usually like:
      // "23:50 – 15:00+1\nCondor\n21 h 10 min\nBKK–MUC\n1 stop\n7 h 20 min FRA\n..."
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

      // Find price (look for €, $, £ followed by number)
      const priceLine = lines.find((l) => /[€$£]\s*[\d,]+/.test(l) || /[\d,]+\s*[€$£]/.test(l));
      const priceMatch = priceLine?.match(/([\d,.\s]+)\s*[€$£]|[€$£]\s*([\d,.\s]+)/);
      const price = priceMatch
        ? (priceMatch[1] || priceMatch[2]).replace(/\s/g, "").replace(",", "")
        : null;

      // Find time pattern (HH:MM – HH:MM)
      const timeLine = lines.find((l) => /\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}/.test(l));

      // Find airline
      const durationLine = lines.find((l) => /\d+\s*h\s*\d*\s*min/.test(l));
      const airlineIdx = timeLine ? lines.indexOf(timeLine) + 1 : -1;
      const airline = airlineIdx > 0 && airlineIdx < lines.length ? lines[airlineIdx] : null;

      // Find route (XXX–YYY)
      const routeLine = lines.find((l) => /[A-Z]{3}\s*[–—-]\s*[A-Z]{3}/.test(l));

      // Find stops
      const stopLine = lines.find((l) => /stop|escale|sans escale|nonstop/i.test(l));

      // Find duration
      const durationMatch = durationLine?.match(/(\d+)\s*h\s*(\d*)\s*min/);
      const duration = durationMatch
        ? `${durationMatch[1]}h${durationMatch[2] ? " " + durationMatch[2] + "m" : ""}`
        : null;

      if (price || routeLine) {
        flights.push({
          time: timeLine || null,
          airline: airline || null,
          duration: duration || durationLine || null,
          route: routeLine || null,
          stops: stopLine || null,
          price: price ? `€${price}` : priceLine || null,
          raw: text.slice(0, 300),
        });
      }
    }

    // Also grab the "cheapest" hint if present
    const cheapHint = document.querySelector('[class*="cheapest"], [class*="Cheapest"]');
    const pageTitle = document.title;

    // Get any "depart on X for €Y" suggestion
    const suggestions = [];
    const allText = document.body.innerText;
    const suggestMatch = allText.match(/(\d+\s+\w+)\s+(?:for|pour)\s+(\d[\d\s,.]*)\s*€/gi);
    if (suggestMatch) {
      for (const s of suggestMatch) suggestions.push(s);
    }

    return {
      pageTitle,
      flightCount: flights.length,
      flights: flights.slice(0, 15),
      suggestions,
      cheapestHint: cheapHint?.innerText?.slice(0, 200) || null,
    };
  });
}

// ─── HTTP Server ────────────────────────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    // ── GET /status ──
    if (path === "/status") {
      sendJSON(res, { ok: true, hasBrowser: !!browser });
    }

    // ── POST /search ──
    else if (path === "/search" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.url) {
        sendJSON(res, { error: "Missing 'url' parameter" }, 400);
        return;
      }
      const p = await ensureBrowser();

      console.log(`[search] ${body.url}`);
      await p.goto(body.url, { waitUntil: "networkidle2", timeout: 45000 });
      // Wait for flight results to render
      await new Promise((r) => setTimeout(r, 4000));

      // Scroll to load more results
      await p.evaluate(() => window.scrollBy(0, 1500));
      await new Promise((r) => setTimeout(r, 2000));

      const results = await extractFlights(p);
      console.log(`[search] Found ${results.flightCount} flights`);
      sendJSON(res, { url: body.url, ...results });
    }

    // ── POST /goto ──
    else if (path === "/goto" && req.method === "POST") {
      const body = await parseBody(req);
      const p = await ensureBrowser();
      await p.goto(body.url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      sendJSON(res, { ok: true, url: body.url, title: await p.title() });
    }

    // ── GET /html ──
    else if (path === "/html") {
      const p = await ensureBrowser();
      const html = await p.content();
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    }

    // ── GET /shutdown ──
    else if (path === "/shutdown") {
      sendJSON(res, { ok: true, message: "Shutting down" });
      if (browser) await browser.close();
      server.close();
      process.exit(0);
    }

    // ── 404 ──
    else {
      sendJSON(res, { error: "Not found", endpoints: ["/search", "/goto", "/html", "/status", "/shutdown"] }, 404);
    }
  } catch (err) {
    console.error(`[error] ${path}:`, err.message);
    sendJSON(res, { error: err.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`[flights-scout] Listening on http://localhost:${PORT}`);
  console.log(`[flights-scout] POST /search { url: "https://www.google.com/travel/flights/search?tfs=..." }`);
});
