// ---------------------------------------------------------------------------
// GFAD — Google Flights Anywhere Data
//
// Calls Google's internal GetExploreDestinations API directly (no browser,
// no cookies, no auth) to get real-time, date-specific flight prices from
// any origin to all reachable destinations worldwide.
//
// Returns: { airport, city, price, airline, stops, durationMin }[]
// Latency: ~0.8s per request, parallelizable
// ---------------------------------------------------------------------------

/** Known city → Google entity IDs (extend as needed) */
const CITY_ENTITY_IDS: Record<string, string> = {
  // SEA origins
  MNL: "/m/0195pd",  // Manila
  BKK: "/m/0fn2g",   // Bangkok
  DMK: "/m/0fn2g",   // Bangkok (Don Mueang → same city entity)
  SGN: "/m/0hn4h",   // Ho Chi Minh City
  HAN: "/m/0fnff",   // Hanoi
  DPS: "/m/01jc_q",  // Bali/Denpasar
  SIN: "/m/06t2t",   // Singapore
  KUL: "/m/049d1",   // Kuala Lumpur
  HKG: "/m/03h64",   // Hong Kong
  TPE: "/m/0ftkx",   // Taipei
  ICN: "/m/0hsqf",   // Seoul
  NRT: "/m/07dfk",   // Tokyo
  HND: "/m/07dfk",   // Tokyo (Haneda → same city entity)
  PVG: "/m/06wjf",   // Shanghai
  SHA: "/m/06wjf",   // Shanghai (Hongqiao)
  PEK: "/m/01914",   // Beijing
  PKX: "/m/01914",   // Beijing (Daxing)
  DEL: "/m/0dlv0",   // New Delhi
  BOM: "/m/04vmp",   // Mumbai
  CTU: "/m/016v46",  // Chengdu
  TFU: "/m/016v46",  // Chengdu (Tianfu)
  XIY: "/m/0cxgx",   // Xi'an
  CAN: "/m/01d8l",   // Guangzhou
  CNX: "/m/01hr58",  // Chiang Mai
  DAD: "/m/0fwc7",   // Da Nang
  HKT: "/m/01z0my",  // Phuket
  CMB: "/m/0fn7r",   // Colombo
  CCU: "/m/0cvw9",   // Kolkata

  // Central Asia / Caucasus hubs
  IST: "/m/09949m",  // Istanbul
  ALA: "/m/0151s1",  // Almaty
  TAS: "/m/0fsmy",   // Tashkent
  GYD: "/m/0fnh5k",  // Baku
  TBS: "/m/0fnhl",   // Tbilisi
  URC: "/m/01c8t6",  // Ürümqi
  ADD: "/m/0dttf",   // Addis Ababa

  // European destinations
  CDG: "/m/05qtj",   // Paris
  LHR: "/m/04jpl",   // London
  AMS: "/m/0k3p",    // Amsterdam
  BER: "/m/0156q",   // Berlin
  FCO: "/m/06c62",   // Rome
  MXP: "/m/0947l",   // Milan
  BCN: "/m/01f62",   // Barcelona
  MAD: "/m/0fpzwf",  // Madrid
  LIS: "/m/04llb",   // Lisbon
  VIE: "/m/07ytt",   // Vienna
  MUC: "/m/02h6_6p", // Munich
  HEL: "/m/01yrx",   // Helsinki
  ATH: "/m/0n2z",    // Athens
  WAW: "/m/081m_",   // Warsaw
  PRG: "/m/05ywg",   // Prague
  BUD: "/m/09blyk",  // Budapest
  CPH: "/m/01lfy",   // Copenhagen
  ARN: "/m/06np0",   // Stockholm
  DUB: "/m/02cft",   // Dublin
  OTP: "/m/09f6cj",  // Bucharest
  GVA: "/m/0drnk",   // Geneva
};

/** EU airport codes for destination matching */
const EU_AIRPORTS = new Set([
  "CDG", "ORY", "LHR", "LGW", "STN", "AMS", "BER", "FCO", "MXP",
  "BCN", "MAD", "LIS", "WAW", "VIE", "PRG", "BUD", "HEL", "ATH",
  "ARN", "CPH", "DUB", "OTP", "MUC", "GVA", "ZRH", "BRU", "OSL",
]);

export interface GfadDestination {
  city: string;
  airport: string;
  price: number;        // EUR, date-specific
  airline: string;      // full name
  airlineCode: string;  // IATA code
  stops: number;
  durationMin: number;
  isEU: boolean;
}

export interface GfadResult {
  origin: string;       // IATA code
  date: string;         // ISO date
  destinations: GfadDestination[];
  elapsedMs: number;
}

const ENDPOINT = "https://www.google.com/_/FlightsFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetExploreDestinations";

/**
 * Fetch all destinations from a given origin on a specific date.
 * Returns date-specific, real-time prices — no browser, no auth.
 */
export async function gfadExplore(
  originAirport: string,
  date: string,
  options?: { gl?: string; currency?: string; maxStops?: number }
): Promise<GfadResult> {
  const gl = options?.gl ?? "FR";
  const currency = options?.currency ?? "EUR";
  const maxStops = options?.maxStops ?? 3;

  const originMid = CITY_ENTITY_IDS[originAirport];
  if (!originMid) {
    return { origin: originAirport, date, destinations: [], elapsedMs: 0 };
  }

  const inner = JSON.stringify([
    [], null, null,
    [null, null, 2, null, [], 1, [1, 0, 0, 0], null, null, null, null, null, null,
      [[[[[originMid, 5]]], [], null, 0, null, null, date, null, null, null, null, null, null, null, maxStops]],
      null, null, null, 1  // ← date-specified flag
    ],
    null, 1, null, 0, null, 0, [1004, 702], 3
  ]);

  const body = new URLSearchParams({ "f.req": JSON.stringify([null, inner]) });

  const t0 = performance.now();
  let raw: string;
  try {
    const res = await fetch(
      `${ENDPOINT}?hl=en&gl=${gl}&soc-app=162&soc-platform=1&soc-device=1`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "x-goog-ext-259736195-jspb": `["en-US","${gl}","${currency}",1,null,[60],null,null,7,[]]`,
          "referer": "https://www.google.com/travel/explore",
        },
        body: body.toString(),
      }
    );
    raw = await res.text();
  } catch {
    return { origin: originAirport, date, destinations: [], elapsedMs: performance.now() - t0 };
  }
  const elapsedMs = performance.now() - t0;

  // Parse response — may be single-line or chunked
  const destinations = parseGfadResponse(raw);

  return { origin: originAirport, date, destinations, elapsedMs };
}

/**
 * Parallel GFAD explore from multiple origins on the same date.
 */
export async function gfadExploreMulti(
  origins: string[],
  date: string,
  options?: { gl?: string; currency?: string; maxStops?: number }
): Promise<GfadResult[]> {
  return Promise.all(origins.map(o => gfadExplore(o, date, options)));
}

// ── Response parsing ──────────────────────────────────────────────────────

function parseGfadResponse(raw: string): GfadDestination[] {
  const midMap: Record<string, string> = {};
  const allPrices: unknown[][] = [];

  // Parse wrb.fr chunks from response
  const chunks = extractWrbFrChunks(raw);

  for (const chunk of chunks) {
    try {
      const inner = JSON.parse(chunk as string);
      if (!Array.isArray(inner)) continue;

      // Destinations: inner[3][0] = array of city objects
      if (inner[3]?.[0]?.length > 5) {
        for (const d of inner[3][0]) {
          if (d[0] && d[2]) {
            midMap[d[0]] = d[2]; // /m/xxx → city name
          }
        }
      }

      // Prices: inner[4][0] = array of price objects
      if (inner[4]?.[0]?.[0]?.[0]?.startsWith?.("/m/")) {
        allPrices.push(...(inner[4][0] as unknown[][]));
      }
    } catch {
      // skip unparseable chunks
    }
  }

  // Build destination list
  const seen = new Set<string>();
  const results: GfadDestination[] = [];

  for (const p of allPrices) {
    const mid = p[0] as string;
    const priceArr = p[1] as [number | null, number][] | null;
    const flight = p[6] as (string | number | null)[] | undefined;

    if (!priceArr || !Array.isArray(priceArr[0])) continue;
    const price = (priceArr[0] as [null, number])[1];
    if (!price || typeof price !== "number") continue;

    const airlineCode = (flight?.[0] as string) || "";
    const airline = (flight?.[1] as string) || "";
    const stops = (flight?.[2] as number) ?? 0;
    const durationMin = (flight?.[3] as number) || 0;
    const airport = (flight?.[5] as string) || "";

    if (!airport || seen.has(airport)) continue;
    seen.add(airport);

    results.push({
      city: midMap[mid] || mid,
      airport,
      price,
      airline,
      airlineCode,
      stops,
      durationMin,
      isEU: EU_AIRPORTS.has(airport),
    });
  }

  return results.sort((a, b) => a.price - b.price);
}

function extractWrbFrChunks(raw: string): string[] {
  const chunks: string[] = [];
  const lines = raw.trim().split("\n");

  if (lines.length <= 3) {
    // Single-line format: )]}'\n\n[["wrb.fr",...],["wrb.fr",...],...]
    const dataLine = lines[lines.length - 1];
    try {
      const outer = JSON.parse(dataLine);
      for (const item of outer) {
        if (Array.isArray(item) && item[0] === "wrb.fr" && typeof item[2] === "string") {
          chunks.push(item[2]);
        }
      }
    } catch {
      // ignore
    }
  } else {
    // Multi-line chunked format: )]}'\n\nSIZE\nJSON\nSIZE\nJSON...
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || line === ")]}'") { i++; continue; }
      const size = parseInt(line);
      if (!isNaN(size) && i + 1 < lines.length) {
        try {
          const parsed = JSON.parse(lines[i + 1]);
          // Each chunk is [["wrb.fr", null, "INNER", ...]]
          const item = Array.isArray(parsed[0]) ? parsed[0] : parsed;
          if (item[0] === "wrb.fr" && typeof item[2] === "string") {
            chunks.push(item[2]);
          }
        } catch {
          // skip
        }
        i += 2;
      } else {
        i++;
      }
    }
  }

  return chunks;
}

// ── Utility ───────────────────────────────────────────────────────────────

/** Check if we have the entity ID for an airport */
export function hasGfadSupport(airport: string): boolean {
  return airport in CITY_ENTITY_IDS;
}

/** Get all supported airport codes */
export function supportedAirports(): string[] {
  return Object.keys(CITY_ENTITY_IDS);
}
