// ---------------------------------------------------------------------------
// MSW server with fixture recording/replay for Travelpayouts API
//
// Usage:
//   npm test                     — replay from fixtures (fails if missing)
//   RECORD_FIXTURES=1 npm test   — hit real APIs, save responses as fixtures
// ---------------------------------------------------------------------------

import { setupServer } from "msw/node";
import { http, HttpResponse, bypass, passthrough } from "msw";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const RECORDING = process.env.RECORD_FIXTURES === "1";

// Hosts whose responses we intercept and record
const INTERCEPTED_HOSTS = ["api.travelpayouts.com"];

function fixtureKey(url: string): string {
  const u = new URL(url);
  const params = new URLSearchParams([...u.searchParams.entries()].sort());
  params.delete("token");
  const normalized = `${u.pathname}?${params.toString()}`;
  const hash = crypto.createHash("md5").update(normalized).digest("hex").slice(0, 12);
  const safePath = u.pathname.replace(/\//g, "_").replace(/^_/, "");
  return `${safePath}_${hash}`;
}

function loadFixture(key: string): { status: number; body: unknown } | null {
  const fp = path.join(FIXTURES_DIR, `${key}.json`);
  if (fs.existsSync(fp)) {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  }
  return null;
}

function saveFixture(key: string, data: { status: number; body: unknown }): void {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  fs.writeFileSync(
    path.join(FIXTURES_DIR, `${key}.json`),
    JSON.stringify(data, null, 2)
  );
}

export const server = setupServer(
  http.all("*", async ({ request }) => {
    const url = new URL(request.url);
    if (!INTERCEPTED_HOSTS.includes(url.hostname)) {
      return passthrough();
    }

    const key = fixtureKey(request.url);
    const existing = loadFixture(key);

    if (existing) {
      return HttpResponse.json(existing.body, { status: existing.status });
    }

    if (RECORDING) {
      try {
        const realResponse = await fetch(bypass(request));
        const text = await realResponse.text();
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          console.warn(`[fixture] Non-JSON response for ${url.pathname}: ${text.slice(0, 100)}`);
          body = { _raw: text, _status: realResponse.status };
        }
        saveFixture(key, { status: realResponse.status, body });
        console.log(`[fixture] Recorded: ${key} (${url.pathname})`);
        return HttpResponse.json(body, { status: realResponse.status });
      } catch (err) {
        console.error(`[fixture] Recording failed for ${url.pathname}:`, err);
        return HttpResponse.json(
          { error: "Recording failed", detail: String(err) },
          { status: 500 }
        );
      }
    }

    // No fixture and not recording — return a clear error
    console.error(`[MSW] No fixture for: ${key} — ${url.pathname}${url.search}`);
    return HttpResponse.json(
      { success: false, error: `Missing fixture: ${key}` },
      { status: 404 }
    );
  })
);
