import puppeteer from "puppeteer";

const SEARCHES = [
  "https://www.reddit.com/search/?q=flights+europe+gulf+stuck+asia&sort=new&t=week",
  "https://www.reddit.com/search/?q=avoid+gulf+airlines+get+home&sort=new&t=week",
  "https://www.reddit.com/search/?q=cancelled+flight+emirates+qatar+etihad+rebook&sort=new&t=week",
  "https://www.reddit.com/search/?q=bangkok+bali+flight+europe+cheap&sort=new&t=week",
  "https://www.reddit.com/search/?q=stranded+southeast+asia+flight+home&sort=new&t=week",
];

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

  const allPosts = new Map(); // dedupe by URL

  for (const url of SEARCHES) {
    console.log(`\n--- Searching: ${url.split("q=")[1]?.split("&")[0]} ---`);
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000)); // let JS render

      const posts = await page.evaluate(() => {
        const results = [];
        // Try to find post links in search results
        const links = document.querySelectorAll('a[href*="/comments/"]');
        for (const link of links) {
          const href = link.getAttribute("href");
          const text = link.textContent?.trim();
          if (href && text && text.length > 10 && !text.startsWith("http")) {
            results.push({ title: text.slice(0, 120), url: href });
          }
        }
        return results;
      });

      for (const p of posts) {
        const fullUrl = p.url.startsWith("http") ? p.url : `https://www.reddit.com${p.url}`;
        if (!allPosts.has(fullUrl)) {
          allPosts.set(fullUrl, p.title);
          console.log(`  ${p.title}`);
          console.log(`  ${fullUrl}`);
        }
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  console.log(`\n=== Total unique posts found: ${allPosts.size} ===`);
  await browser.close();
}

run().catch(console.error);
