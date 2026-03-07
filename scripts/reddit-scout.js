#!/usr/bin/env node
/**
 * Reddit Scout Server
 *
 * Persistent Puppeteer server on port 3098 for Reddit thread discovery.
 * Claude sends HTTP requests to search Reddit, read threads, and find
 * comments where we can helpfully reply with route advice.
 *
 * Start:  node scripts/reddit-scout.js
 * Stop:   curl http://localhost:3098/shutdown  (or Ctrl+C)
 *
 * Endpoints:
 *   POST /search      { query, subreddit?, sort?, time? }  — search Reddit
 *   POST /thread      { url }                               — extract all comments from a thread
 *   POST /goto        { url }                               — navigate to any URL
 *   GET  /html        — return current page HTML
 *   GET  /status      — health check
 *   GET  /shutdown    — close browser and stop server
 */

const http = require("http");
const puppeteer = require("puppeteer");

const PORT = 3098;
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
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    console.log(`[reddit-scout] Browser launched (headless=${HEADLESS})`);
  }
  return page;
}

// ─── Extractors ─────────────────────────────────────────────────────────────

async function extractSearchResults(p) {
  return p.evaluate(() => {
    const posts = [];
    // Reddit search results — try multiple selectors for old/new Reddit
    const links = document.querySelectorAll('a[href*="/comments/"]');
    const seen = new Set();
    for (const link of links) {
      const href = link.getAttribute("href");
      const text = link.textContent?.trim();
      if (!href || !text || text.length < 10 || seen.has(href)) continue;
      // Skip user profile links, wiki links, etc.
      if (href.includes("/user/") || href.includes("/wiki/")) continue;
      seen.add(href);

      // Try to find subreddit from href
      const subMatch = href.match(/\/r\/([^/]+)\//);
      const sub = subMatch ? subMatch[1] : "unknown";

      posts.push({
        title: text.slice(0, 200),
        url: href.startsWith("http") ? href : `https://www.reddit.com${href}`,
        subreddit: sub,
      });
    }
    return posts;
  });
}

async function extractThread(p) {
  return p.evaluate(() => {
    const result = {
      title: "",
      postBody: "",
      score: 0,
      commentCount: 0,
      subreddit: "",
      comments: [],
    };

    // Post title
    const titleEl = document.querySelector("shreddit-title");
    result.title = titleEl?.getAttribute("title") || document.title || "";

    // Post body
    const bodyEl = document.querySelector(
      '[slot="text-body"] [dir="auto"], .post-content, .expando .md'
    );
    result.postBody = bodyEl?.innerText?.trim()?.slice(0, 2000) || "";

    // Score
    const scoreEl = document.querySelector('[score]');
    result.score = parseInt(scoreEl?.getAttribute("score") || "0");

    // Comment count
    const commentEl = document.querySelector("[total-comments]");
    result.commentCount = parseInt(
      commentEl?.getAttribute("total-comments") || "0"
    );

    // Subreddit
    const subEl = document.querySelector(
      '[subreddit-prefixed-name]'
    );
    result.subreddit =
      subEl?.getAttribute("subreddit-prefixed-name") || "";

    // Comments — extract from the rendered page
    const commentDivs = document.querySelectorAll(
      '[id$="-comment-rtjson-content"]'
    );
    for (const div of commentDivs) {
      const id = div.id.replace("-comment-rtjson-content", "").replace("-post-rtjson-content", "");
      const textEl = div.querySelector('[dir="auto"]');
      const text = textEl?.innerText?.trim() || "";
      if (!text) continue;

      // Find author — look for the closest author link
      let author = "unknown";
      // Walk up to find the comment container, then find author link
      const commentContainer = div.closest("shreddit-comment");
      if (commentContainer) {
        author = commentContainer.getAttribute("author") || "unknown";
      } else {
        // Fallback: search nearby for author link
        const authorLink = document.querySelector(
          `[thing-id="${id}"] a[href*="/user/"]`
        );
        if (authorLink) {
          const match = authorLink
            .getAttribute("href")
            ?.match(/\/user\/([^/]+)/);
          if (match) author = match[1];
        }
      }

      // Check if mod or OP
      const modIcon = document.querySelector(
        `[thing-id="${id}"][distinguished-as="MODERATOR"]`
      );
      const opIcon = document.querySelector(
        `[thing-id="${id}"][op=""]`
      );

      // Check for score on comment
      const commentScore = commentContainer?.getAttribute("score") || null;

      result.comments.push({
        id,
        author,
        text: text.slice(0, 500),
        isMod: !!modIcon,
        isOP: !!opIcon,
        score: commentScore ? parseInt(commentScore) : null,
      });
    }

    return result;
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
      const p = await ensureBrowser();
      const q = encodeURIComponent(body.query || "");
      const sub = body.subreddit ? `r/${body.subreddit}/` : "";
      const sort = body.sort || "new";
      const time = body.time || "week";
      const searchUrl = `https://www.reddit.com/${sub}search/?q=${q}&sort=${sort}&t=${time}`;

      console.log(`[search] ${searchUrl}`);
      await p.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));

      const posts = await extractSearchResults(p);
      console.log(`[search] Found ${posts.length} posts`);
      sendJSON(res, { query: body.query, url: searchUrl, posts });
    }

    // ── POST /thread ──
    else if (path === "/thread" && req.method === "POST") {
      const body = await parseBody(req);
      const p = await ensureBrowser();

      console.log(`[thread] ${body.url}`);
      await p.goto(body.url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));

      // Scroll down to load more comments
      for (let i = 0; i < 3; i++) {
        await p.evaluate(() => window.scrollBy(0, 2000));
        await new Promise((r) => setTimeout(r, 1000));
      }

      const thread = await extractThread(p);
      console.log(
        `[thread] "${thread.title.slice(0, 60)}" — ${thread.comments.length} comments`
      );
      sendJSON(res, thread);
    }

    // ── POST /goto ──
    else if (path === "/goto" && req.method === "POST") {
      const body = await parseBody(req);
      const p = await ensureBrowser();
      await p.goto(body.url, { waitUntil: "networkidle2", timeout: 30000 });
      sendJSON(res, { ok: true, url: p.url() });
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
      console.log("[reddit-scout] Shutting down...");
      if (browser) await browser.close().catch(() => {});
      sendJSON(res, { shutdown: true });
      setTimeout(() => process.exit(0), 500);
    }

    // ── 404 ──
    else {
      sendJSON(
        res,
        {
          error: "Unknown endpoint",
          endpoints: [
            "POST /search   — search Reddit { query, subreddit?, sort?, time? }",
            "POST /thread   — extract thread { url }",
            "POST /goto     — navigate { url }",
            "GET  /html     — current page HTML",
            "GET  /status   — health check",
            "GET  /shutdown — stop server",
          ],
        },
        404
      );
    }
  } catch (err) {
    console.error(`[error] ${path}:`, err.message);
    sendJSON(res, { error: err.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(
    `[reddit-scout] Server running on http://localhost:${PORT} (headless: ${HEADLESS})`
  );
});
