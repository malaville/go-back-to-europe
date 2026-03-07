// ---------------------------------------------------------------------------
// Aviasales / Travelpayouts API client
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
// Rate limit: 200 queries/hour
// ---------------------------------------------------------------------------

const API_TOKEN = process.env.AVIASALES_API_TOKEN ?? "";

const BASE = "https://api.travelpayouts.com";

// ── Airline IATA code → full name ─────────────────────────────────────────

const AIRLINE_NAMES: Record<string, string> = {
  VJ: "VietJet Air",
  TK: "Turkish Airlines",
  SQ: "Singapore Airlines",
  AF: "Air France",
  KL: "KLM",
  LH: "Lufthansa",
  BA: "British Airways",
  TR: "Scoot",
  AK: "AirAsia",
  D7: "AirAsia X",
  TW: "T'way Air",
  "7C": "Jeju Air",
  CI: "China Airlines",
  BR: "EVA Air",
  JX: "Starlux Airlines",
  KE: "Korean Air",
  OZ: "Asiana Airlines",
  W6: "Wizz Air",
  QR: "Qatar Airways",
  TG: "Thai Airways",
  FD: "Thai AirAsia",
  VN: "Vietnam Airlines",
  MH: "Malaysia Airlines",
  GA: "Garuda Indonesia",
  "5J": "Cebu Pacific",
  PR: "Philippine Airlines",
  NH: "ANA",
  JL: "Japan Airlines",
  FR: "Ryanair",
  U2: "easyJet",
  EK: "Emirates",
  PC: "Pegasus Airlines",
  SL: "Thai Lion Air",
  SU: "Aeroflot",
  CX: "Cathay Pacific",
  HX: "Hong Kong Airlines",
  UO: "HK Express",
  IT: "Tigerair Taiwan",
  MM: "Peach Aviation",
  "3K": "Jetstar Asia",
  QF: "Qantas",
  ET: "Ethiopian Airlines",
  LO: "LOT Polish Airlines",
  OS: "Austrian Airlines",
  AY: "Finnair",
  SK: "SAS",
  IB: "Iberia",
  TP: "TAP Air Portugal",
  AZ: "ITA Airways",
  GF: "Gulf Air",
  WY: "Oman Air",
  UL: "SriLankan Airlines",
  AI: "Air India",
  "6E": "IndiGo",
  KC: "Air Astana",
  GP: "APG Airlines",
  XJ: "Thai AirAsia X",
  Z2: "AirAsia Philippines",
  QD: "Cambodia Airways",
  K6: "Cambodia Angkor Air",
  CA: "Air China",
  CZ: "China Southern",
  MU: "China Eastern",
  HU: "Hainan Airlines",
  "3U": "Sichuan Airlines",
  EY: "Etihad Airways",
  FZ: "flydubai",
  G9: "Air Arabia",
  SV: "Saudia",
  RJ: "Royal Jordanian",
  VF: "Fly Georgia",
};

export function airlineName(iataCode: string): string {
  return AIRLINE_NAMES[iataCode] ?? iataCode;
}

// ── Airport-to-city code mapping ──────────────────────────────────────────
// When the IATA city code differs from the airport code, the Aviasales
// cached-prices endpoints expect the *city* code.

const AIRPORT_TO_CITY: Record<string, string> = {
  ICN: "SEL",
  GMP: "SEL",
  NRT: "TYO",
  HND: "TYO",
  CDG: "PAR",
  ORY: "PAR",
  LHR: "LON",
  LGW: "LON",
  STN: "LON",
  MXP: "MIL",
  LIN: "MIL",
  BGY: "MIL",
  FCO: "ROM",
  CIA: "ROM",
  CRL: "BRU", // Brussels South → BRU city code
};

/** Resolve an airport IATA code to the city code the API expects. */
function cityCode(airportCode: string): string {
  return AIRPORT_TO_CITY[airportCode] ?? airportCode;
}

// ── Types ─────────────────────────────────────────────────────────────────

export type CheapestFlightResult = {
  price: number;
  airline: string;
  airlineName: string;
  departureAt: string;
  returnAt: string | null;
};

export type LatestPriceResult = {
  price: number;
  airline: string;
  airlineName: string;
  departDate: string;
  numberOfChanges: number;
};

// ── API wrappers ──────────────────────────────────────────────────────────

/**
 * GET /v1/prices/cheap — cheapest cached tickets for a given month.
 * Returns the single cheapest entry or null when nothing is found.
 */
export async function getCheapestFlight(
  origin: string,
  destination: string,
  departMonth?: string, // YYYY-MM
  excludeAirlines?: Set<string>
): Promise<CheapestFlightResult | null> {
  try {
    const params = new URLSearchParams({
      origin: cityCode(origin),
      destination: cityCode(destination),
      currency: "EUR",
      token: API_TOKEN,
    });
    if (departMonth) {
      params.set("depart_date", departMonth);
    }

    const url = `${BASE}/v1/prices/cheap?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 21600 } }); // 6 h cache
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data) return null;

    // data is keyed by destination city code, then by ticket index ("0", "1", ...)
    const destKey = cityCode(destination);
    const tickets = json.data[destKey];
    if (!tickets) return null;

    // Find cheapest across all indices, skipping blocked airlines
    let cheapest: CheapestFlightResult | null = null;
    if (process.env.NODE_ENV === "development") {
      console.log(`[aviasales] getCheapestFlight ${origin}->${destination}: ${Object.keys(tickets).length} tickets found`);
      for (const key of Object.keys(tickets)) {
        const t = tickets[key];
        const blocked = excludeAirlines?.has(t.airline) ? " [BLOCKED]" : "";
        console.log(`  [${key}] ${t.airline} (${airlineName(t.airline)}) €${t.price} depart=${t.departure_at ?? "?"} stops=${t.number_of_changes ?? "?"}${blocked}`);
      }
    }
    for (const key of Object.keys(tickets)) {
      const t = tickets[key];
      if (excludeAirlines?.has(t.airline)) continue;
      if (!cheapest || t.price < cheapest.price) {
        cheapest = {
          price: t.price,
          airline: t.airline,
          airlineName: airlineName(t.airline),
          departureAt: t.departure_at ?? "",
          returnAt: t.return_at ?? null,
        };
      }
    }
    if (process.env.NODE_ENV === "development" && cheapest) {
      console.log(`  → Winner: ${cheapest.airline} (${cheapest.airlineName}) €${cheapest.price} depart=${cheapest.departureAt}`);
    }
    return cheapest;
  } catch (err) {
    console.error(`[aviasales] getCheapestFlight ${origin}->${destination} failed:`, err);
    return null;
  }
}

/**
 * GET /v2/prices/latest — latest discovered prices (one-way).
 * Returns the single cheapest one-way price or null.
 */
export async function getLatestOneWayPrice(
  origin: string,
  destination: string,
  excludeAirlines?: Set<string>,
  maxChanges?: number
): Promise<LatestPriceResult | null> {
  try {
    const params = new URLSearchParams({
      origin: cityCode(origin),
      destination: cityCode(destination),
      currency: "EUR",
      one_way: "true",
      sorting: "price",
      limit: "30",
      token: API_TOKEN,
    });

    const url = `${BASE}/v2/prices/latest?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) return null;

    if (process.env.NODE_ENV === "development") {
      console.log(`[aviasales] getLatestOneWayPrice ${origin}->${destination}: ${json.data.length} results (maxChanges=${maxChanges ?? "any"})`);
      for (const d of json.data.slice(0, 10)) {
        const blocked = excludeAirlines?.has(d.airline) ? " [BLOCKED]" : "";
        const stopsOk = maxChanges !== undefined && (d.number_of_changes ?? 99) > maxChanges ? " [TOO MANY STOPS]" : "";
        console.log(`  ${d.airline} (${airlineName(d.airline)}) €${d.value} stops=${d.number_of_changes ?? "?"} depart=${d.depart_date ?? "?"}${blocked}${stopsOk}`);
      }
    }

    // Find cheapest that passes all filters
    for (const d of json.data) {
      if (excludeAirlines?.has(d.airline)) continue;
      if (maxChanges !== undefined && (d.number_of_changes ?? 99) > maxChanges) continue;
      if (process.env.NODE_ENV === "development") {
        console.log(`  → Winner: ${d.airline} (${airlineName(d.airline)}) €${d.value} stops=${d.number_of_changes ?? 0} depart=${d.depart_date ?? "?"}`);
      }
      return {
        price: d.value,
        airline: d.airline ?? "",
        airlineName: d.airline ? airlineName(d.airline) : "",
        departDate: d.depart_date ?? "",
        numberOfChanges: d.number_of_changes ?? 0,
      };
    }
    return null;
  } catch (err) {
    console.error(`[aviasales] getLatestOneWayPrice ${origin}->${destination} failed:`, err);
    return null;
  }
}

// ── API call tracking client ─────────────────────────────────────────────

export type ApiCallStats = {
  cheapCalls: number;      // /v1/prices/cheap requests
  latestCalls: number;     // /v2/prices/latest requests
  totalCalls: number;      // cheapCalls + latestCalls
  fallbackHits: number;    // prices served from FALLBACK_FLIGHT_PRICES or FIFTH_FREEDOM (no API call)
};

export class AviasalesClient {
  static cheapCalls = 0;
  static latestCalls = 0;
  static fallbackHits = 0;

  static reset() {
    AviasalesClient.cheapCalls = 0;
    AviasalesClient.latestCalls = 0;
    AviasalesClient.fallbackHits = 0;
  }

  static get stats(): ApiCallStats {
    return {
      cheapCalls: AviasalesClient.cheapCalls,
      latestCalls: AviasalesClient.latestCalls,
      totalCalls: AviasalesClient.cheapCalls + AviasalesClient.latestCalls,
      fallbackHits: AviasalesClient.fallbackHits,
    };
  }

  static async getCheapest(
    origin: string,
    destination: string,
    departMonth?: string,
    excludeAirlines?: Set<string>,
  ): Promise<CheapestFlightResult | null> {
    AviasalesClient.cheapCalls++;
    return getCheapestFlight(origin, destination, departMonth, excludeAirlines);
  }

  static async getLatest(
    origin: string,
    destination: string,
    excludeAirlines?: Set<string>,
    maxChanges?: number,
  ): Promise<LatestPriceResult | null> {
    AviasalesClient.latestCalls++;
    return getLatestOneWayPrice(origin, destination, excludeAirlines, maxChanges);
  }

  static recordFallbackHit() {
    AviasalesClient.fallbackHits++;
  }
}
