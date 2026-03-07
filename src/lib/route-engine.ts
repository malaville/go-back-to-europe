// ---------------------------------------------------------------------------
// Route-building engine
// Generates multi-leg SEA → Europe routes that avoid conflict zones,
// prices each segment via the Aviasales cached-price API, and returns
// sorted RouteOption[] results.
// ---------------------------------------------------------------------------

import type { RouteOption, RouteLeg } from "@/data/mock-routes";
import {
  getCheapestFlight,
  getLatestOneWayPrice,
  airlineName,
} from "./aviasales";
import { visaRules } from "@/data/visa-rules";

// ── Ground-transport connections ──────────────────────────────────────────
// Small airports that need a ground leg to reach an international hub.

type GroundConnection = {
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  transport: "bus" | "train" | "ferry";
  durationMinutes: number;
  price: number;
  note: string;
};

const GROUND_CONNECTIONS: GroundConnection[] = [
  {
    fromCode: "DLI",
    fromCity: "Da Lat",
    toCode: "SGN",
    toCity: "Ho Chi Minh City",
    transport: "bus",
    durationMinutes: 420, // 7 h
    price: 10,
    note: "Regular buses, ~300km",
  },
  // Add more ground connections here as needed:
  // { fromCode: "XXX", fromCity: "...", toCode: "YYY", ... },
];

// ── Segment durations (minutes) ───────────────────────────────────────────

const SEGMENT_DURATIONS: Record<string, number> = {
  // From SGN
  "SGN-BKK": 105, "SGN-SIN": 125, "SGN-KUL": 130,
  "SGN-SEL": 310, "SGN-TPE": 210, "SGN-TYO": 340,
  "SGN-HKG": 165, "SGN-DEL": 330, "SGN-BOM": 360,
  "SGN-CMB": 240,
  // From BKK
  "BKK-SEL": 310, "BKK-TPE": 220, "BKK-TYO": 360,
  "BKK-IST": 570, "BKK-TBS": 510,
  "BKK-HKG": 165, "BKK-DEL": 255, "BKK-BOM": 270,
  "BKK-ADD": 540, "BKK-ALA": 390, "BKK-TAS": 420,
  "BKK-CMB": 210,
  // From KUL
  "KUL-IST": 675, "KUL-HKG": 225, "KUL-DEL": 330,
  "KUL-CMB": 210, "KUL-ADD": 540,
  // From SIN
  "SIN-PAR": 800, "SIN-LON": 780, "SIN-AMS": 750,
  "SIN-HKG": 225, "SIN-DEL": 330, "SIN-CMB": 210,
  "SIN-ADD": 570,
  // From HKG (to Europe)
  "HKG-PAR": 720, "HKG-LON": 720, "HKG-AMS": 700,
  "HKG-BER": 680, "HKG-FCO": 690, "HKG-BCN": 720,
  // From DEL (to Europe)
  "DEL-PAR": 510, "DEL-LON": 510, "DEL-AMS": 510,
  "DEL-BER": 450, "DEL-FCO": 480, "DEL-BCN": 540,
  // From BOM (to Europe)
  "BOM-PAR": 540, "BOM-LON": 540, "BOM-AMS": 540,
  "BOM-BER": 480, "BOM-FCO": 480,
  // From ADD (to Europe) — Ethiopian Airlines hub
  "ADD-PAR": 480, "ADD-LON": 480, "ADD-AMS": 510,
  "ADD-BER": 450, "ADD-FCO": 420, "ADD-BCN": 480,
  // From ALA (to Europe) — Air Astana hub
  "ALA-PAR": 420, "ALA-LON": 420, "ALA-AMS": 390,
  "ALA-BER": 360, "ALA-IST": 330,
  // From TAS (to Europe) — Uzbekistan Airways
  "TAS-PAR": 390, "TAS-LON": 390, "TAS-AMS": 360,
  "TAS-BER": 330, "TAS-FCO": 360,
  // From CMB (to Europe) — SriLankan Airlines
  "CMB-PAR": 600, "CMB-LON": 600, "CMB-AMS": 600,
  "CMB-FCO": 570,
  // From SEL (to Europe)
  "SEL-PAR": 750, "SEL-AMS": 690, "SEL-LON": 700, "SEL-BER": 660,
  // From TYO (to Europe)
  "TYO-PAR": 750, "TYO-AMS": 720, "TYO-LON": 720,
  // From TPE (to Europe)
  "TPE-PAR": 780, "TPE-AMS": 790, "TPE-LON": 770,
  // From TBS (to Europe)
  "TBS-PAR": 310, "TBS-BER": 270, "TBS-WAW": 240,
  "TBS-VIE": 240, "TBS-AMS": 330,
  // From IST (to Europe)
  "IST-PAR": 220, "IST-AMS": 220, "IST-LON": 240, "IST-BER": 180,
  "IST-FCO": 165, "IST-BCN": 210, "IST-MAD": 240, "IST-LIS": 270,
  "IST-WAW": 150, "IST-VIE": 150, "IST-PRG": 165, "IST-BUD": 135,
  // Extended EU destinations from existing hubs
  "SEL-FCO": 720, "SEL-BCN": 750, "SEL-MAD": 780, "SEL-LIS": 780,
  "SEL-WAW": 630, "SEL-VIE": 660, "SEL-PRG": 660, "SEL-BUD": 660,
  "TYO-FCO": 720, "TYO-BER": 690, "TYO-BCN": 750,
  "TPE-BER": 750, "TPE-FCO": 750,
  "TBS-FCO": 240, "TBS-BCN": 300, "TBS-MAD": 330, "TBS-LIS": 360,
  "TBS-PRG": 240, "TBS-BUD": 210,
  "HKG-MAD": 750, "HKG-LIS": 780, "HKG-WAW": 660, "HKG-VIE": 680,
  "HKG-PRG": 680, "HKG-BUD": 680,
  "DEL-MAD": 540, "DEL-LIS": 540, "DEL-WAW": 420, "DEL-VIE": 450,
  "DEL-PRG": 450, "DEL-BUD": 430,
  "BOM-MAD": 540, "BOM-LIS": 540, "BOM-WAW": 450, "BOM-VIE": 450,
  "ADD-MAD": 480, "ADD-LIS": 480, "ADD-WAW": 450, "ADD-VIE": 420,
  "ADD-PRG": 450, "ADD-BUD": 420,
  "ALA-FCO": 360, "ALA-BCN": 390, "ALA-MAD": 420, "ALA-WAW": 300,
  "ALA-VIE": 330, "ALA-PRG": 330, "ALA-BUD": 300,
  "TAS-MAD": 390, "TAS-WAW": 270, "TAS-VIE": 300,
  "TAS-PRG": 300, "TAS-BUD": 270,
  "CMB-BER": 570, "CMB-BCN": 600, "CMB-MAD": 600,
};

/** Look up segment duration, trying both orderings of city codes. */
function getSegmentDuration(from: string, to: string): number | null {
  return SEGMENT_DURATIONS[`${from}-${to}`] ?? SEGMENT_DURATIONS[`${to}-${from}`] ?? null;
}

// ── Airport → country code mapping ───────────────────────────────────────

const AIRPORT_COUNTRY: Record<string, string> = {
  BKK: "TH",
  DMK: "TH",
  CNX: "TH",
  SGN: "VN",
  HAN: "VN",
  DLI: "VN",
  SIN: "SG",
  KUL: "MY",
  PNH: "KH",
  ICN: "KR",
  GMP: "KR",
  NRT: "JP",
  HND: "JP",
  TPE: "TW",
  TSA: "TW",
  IST: "TR",
  TBS: "GE",
  HKG: "HK",
  DEL: "IN",
  BOM: "IN",
  ADD: "ET",
  ALA: "KZ",
  TAS: "UZ",
  CMB: "LK",
  HEL: "FI",
  DPS: "ID",
  MNL: "PH",
  VTE: "LA",
  RGN: "MM",
  // European airports — visa status "none" (home)
  CDG: "FR",
  ORY: "FR",
  LYS: "FR",
  AMS: "NL",
  LHR: "GB",
  LGW: "GB",
  STN: "GB",
  BER: "DE",
  FCO: "IT",
  CIA: "IT",
  MXP: "IT",
  LIN: "IT",
  BGY: "IT",
  BCN: "ES",
  MAD: "ES",
  LIS: "PT",
  WAW: "PL",
  WMI: "PL",
  BUD: "HU",
  PRG: "CZ",
  VIE: "AT",
  BRU: "BE",
  CRL: "BE",
};

// EU / EEA / Schengen country codes — transit visa always "none"
const EU_COUNTRIES = new Set([
  "FR", "NL", "GB", "DE", "IT", "ES", "PT", "PL", "HU", "CZ", "AT", "BE",
  "SE", "DK", "FI", "IE", "RO", "BG", "HR", "SI", "SK", "LT", "LV", "EE",
  "LU", "MT", "CY", "GR", "NO", "IS", "CH",
]);

// ── Airport → city name mapping ──────────────────────────────────────────

const AIRPORT_CITY: Record<string, string> = {
  BKK: "Bangkok",
  DMK: "Bangkok",
  CNX: "Chiang Mai",
  SGN: "Ho Chi Minh City",
  HAN: "Hanoi",
  DLI: "Da Lat",
  SIN: "Singapore",
  KUL: "Kuala Lumpur",
  PNH: "Phnom Penh",
  ICN: "Seoul",
  GMP: "Seoul",
  NRT: "Tokyo",
  HND: "Tokyo",
  TPE: "Taipei",
  TSA: "Taipei",
  IST: "Istanbul",
  TBS: "Tbilisi",
  HKG: "Hong Kong",
  DEL: "Delhi",
  BOM: "Mumbai",
  ADD: "Addis Ababa",
  ALA: "Almaty",
  TAS: "Tashkent",
  CMB: "Colombo",
  HEL: "Helsinki",
  DPS: "Bali",
  MNL: "Manila",
  VTE: "Vientiane",
  RGN: "Yangon",
  CDG: "Paris",
  ORY: "Paris",
  LYS: "Lyon",
  AMS: "Amsterdam",
  LHR: "London",
  LGW: "London",
  STN: "London",
  BER: "Berlin",
  FCO: "Rome",
  CIA: "Rome",
  MXP: "Milan",
  LIN: "Milan",
  BGY: "Milan",
  BCN: "Barcelona",
  MAD: "Madrid",
  LIS: "Lisbon",
  WAW: "Warsaw",
  WMI: "Warsaw",
  BUD: "Budapest",
  PRG: "Prague",
  VIE: "Vienna",
  BRU: "Brussels",
  CRL: "Brussels",
};

// Airport code → city code used by the Aviasales API
const AIRPORT_TO_API_CODE: Record<string, string> = {
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
  CRL: "BRU",
};

function apiCode(airportCode: string): string {
  return AIRPORT_TO_API_CODE[airportCode] ?? airportCode;
}

// ── Visa lookup helper ───────────────────────────────────────────────────

function resolveVisaStatus(
  airportCode: string,
  nationality: string
): { status: RouteLeg["visaStatus"]; note?: string } {
  const country = AIRPORT_COUNTRY[airportCode];
  if (!country) return { status: "none" };

  // European destination — you're going home
  if (EU_COUNTRIES.has(country)) return { status: "none" };

  // Look up in visa rules
  const rule = visaRules.find(
    (r) => r.nationality === nationality && r.destinationCountry === country
  );

  if (rule) {
    return { status: rule.category, note: rule.notes };
  }

  // Fallback — unknown, mark as warning
  return { status: "warning", note: "Visa requirements unknown — check before travel" };
}

// ── Duration formatting ──────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── Route pattern definitions ────────────────────────────────────────────
// Each pattern is an array of airport codes representing waypoints.
// The engine fills in departure (index 0) and destination (last index).

type RoutePattern = {
  hubs: string[]; // intermediate airport codes between departure and destination
  tag: string;
  warnings?: string[];
};

/**
 * Generate candidate route patterns for a given (departure, destination) pair.
 * The departure hub is the first international airport reachable from the
 * departure city (after any ground transport leg).
 */
function getCandidatePatterns(departureHub: string): RoutePattern[] {
  const patterns: RoutePattern[] = [];

  // ── 2-leg direct routes (only from major SEA airports)
  if (["SIN", "BKK", "KUL"].includes(departureHub)) {
    patterns.push({
      hubs: [], // departure → destination directly
      tag: "Direct",
    });
  }

  // ── 3-leg via East Asia
  patterns.push({ hubs: ["ICN"], tag: "Via Seoul" });
  patterns.push({ hubs: ["NRT"], tag: "Via Tokyo" });
  patterns.push({ hubs: ["TPE"], tag: "Via Taipei" });

  // ── 3-leg via Hong Kong
  patterns.push({ hubs: ["HKG"], tag: "Via Hong Kong" });

  // ── 3-leg via South Asia
  patterns.push({ hubs: ["DEL"], tag: "Via Delhi" });
  patterns.push({ hubs: ["BOM"], tag: "Via Mumbai" });
  patterns.push({ hubs: ["CMB"], tag: "Via Colombo" });

  // ── 3-leg via Africa
  patterns.push({ hubs: ["ADD"], tag: "Via Addis Ababa" });

  // ── 3-leg via Central Asia
  patterns.push({ hubs: ["ALA"], tag: "Via Almaty" });
  patterns.push({ hubs: ["TAS"], tag: "Via Tashkent" });

  // ── 3-leg via Caucasus
  patterns.push({ hubs: ["TBS"], tag: "Via Tbilisi" });
  patterns.push({
    hubs: ["IST"],
    tag: "Via Istanbul",
    warnings: [
      "Route transits through Turkey — near active conflict zones. Check current travel advisories.",
    ],
  });

  // ── 4-leg budget/adventure routes
  patterns.push({ hubs: ["BKK", "ICN"], tag: "Budget via Bangkok + Seoul" });
  patterns.push({ hubs: ["BKK", "TBS"], tag: "Budget via Bangkok + Tbilisi" });
  patterns.push({ hubs: ["BKK", "DEL"], tag: "Via Bangkok + Delhi" });
  patterns.push({ hubs: ["BKK", "ADD"], tag: "Via Bangkok + Addis Ababa" });
  patterns.push({ hubs: ["BKK", "ALA"], tag: "Via Bangkok + Almaty" });
  patterns.push({ hubs: ["BKK", "HKG"], tag: "Via Bangkok + Hong Kong" });
  patterns.push({ hubs: ["SIN", "CMB"], tag: "Via Singapore + Colombo" });
  patterns.push({
    hubs: ["KUL", "IST"],
    tag: "Budget via KL + Istanbul",
    warnings: [
      "Route transits through Turkey — near active conflict zones. Check current travel advisories.",
    ],
  });

  return patterns;
}

// ── Segment price fetching ───────────────────────────────────────────────

type SegmentPriceResult = {
  price: number;
  airline: string;
  airlineFullName: string;
};

/**
 * Fetch the cheapest price for a single flight segment, trying both
 * getCheapestFlight (monthly cache) and getLatestOneWayPrice as fallback.
 */
async function fetchSegmentPrice(
  from: string,
  to: string,
  departMonth?: string
): Promise<SegmentPriceResult | null> {
  // Try the monthly cache first
  const cheap = await getCheapestFlight(from, to, departMonth);
  if (cheap) {
    return {
      price: cheap.price,
      airline: cheap.airline,
      airlineFullName: cheap.airlineName,
    };
  }

  // Fallback: latest one-way prices
  const latest = await getLatestOneWayPrice(from, to);
  if (latest) {
    return {
      price: latest.price,
      airline: latest.airline,
      airlineFullName: latest.airlineName,
    };
  }

  return null;
}

// ── Main search function ─────────────────────────────────────────────────

export async function searchRoutes(params: {
  fromCity: string;
  fromAirport: string;
  targetCity: string;
  targetAirport: string;
  nationality: string;
  departMonth: string; // YYYY-MM
}): Promise<RouteOption[]> {
  const { fromCity, fromAirport, targetCity, targetAirport, nationality, departMonth } = params;

  // Determine which EU airports to search
  const EU_SEARCH_AIRPORTS = ["CDG", "AMS", "LHR", "BER", "FCO", "BCN", "MAD", "LIS", "WAW", "VIE", "PRG", "BUD"];
  const destinationAirports: string[] =
    targetAirport && targetAirport.length > 0
      ? [targetAirport]
      : EU_SEARCH_AIRPORTS;

  // Determine if we need a ground transport prefix
  const groundLeg = GROUND_CONNECTIONS.find((g) => g.fromCode === fromAirport);
  const departureHub = groundLeg ? groundLeg.toCode : fromAirport;

  // Build candidate routes for every destination
  const patterns = getCandidatePatterns(departureHub);

  // Generate all (pattern, destination) combinations
  type Candidate = {
    destAirport: string;
    pattern: RoutePattern;
  };

  const candidates: Candidate[] = [];
  for (const dest of destinationAirports) {
    for (const pattern of patterns) {
      // Skip patterns where the departure hub is the same as a hub in the pattern
      // (e.g., departing from BKK with a pattern that goes through BKK)
      if (pattern.hubs.includes(departureHub)) continue;

      // Skip direct routes for airports that don't have known direct durations
      if (pattern.hubs.length === 0) {
        const dur = getSegmentDuration(apiCode(departureHub), apiCode(dest));
        if (!dur) continue;
      }

      candidates.push({ destAirport: dest, pattern });
    }
  }

  // Process all candidates in parallel
  const routePromises = candidates.map(async (candidate): Promise<RouteOption | null> => {
    const { destAirport, pattern } = candidate;

    // Build the full waypoint chain: [departureHub, ...hubs, destAirport]
    const waypoints = [departureHub, ...pattern.hubs, destAirport];

    // Fetch prices for all flight segments in parallel
    const segmentCodes = waypoints.map((wp, i) => {
      if (i === waypoints.length - 1) return null;
      return { from: wp, to: waypoints[i + 1] };
    }).filter((s): s is { from: string; to: string } => s !== null);

    const priceResults = await Promise.all(
      segmentCodes.map((seg) => fetchSegmentPrice(seg.from, seg.to, departMonth))
    );

    // If any segment has no price, skip this route
    if (priceResults.some((r) => r === null)) return null;

    // Build the legs
    const legs: RouteLeg[] = [];

    // Prepend ground transport leg if needed
    if (groundLeg) {
      const gVisa = resolveVisaStatus(groundLeg.toCode, nationality);
      legs.push({
        from: groundLeg.fromCity,
        to: groundLeg.toCity,
        fromCode: groundLeg.fromCode,
        toCode: groundLeg.toCode,
        transport: groundLeg.transport,
        duration: formatDuration(groundLeg.durationMinutes),
        durationMinutes: groundLeg.durationMinutes,
        price: groundLeg.price,
        visaStatus: gVisa.status,
        visaNote: gVisa.note,
      });
    }

    // Flight legs
    for (let i = 0; i < segmentCodes.length; i++) {
      const seg = segmentCodes[i];
      const priceResult = priceResults[i]!;

      const fromApi = apiCode(seg.from);
      const toApi = apiCode(seg.to);
      const duration = getSegmentDuration(fromApi, toApi);

      // If we don't have a duration for this segment, skip the route
      if (duration === null) return null;

      const visa = resolveVisaStatus(seg.to, nationality);

      legs.push({
        from: AIRPORT_CITY[seg.from] ?? seg.from,
        to: AIRPORT_CITY[seg.to] ?? seg.to,
        fromCode: seg.from,
        toCode: seg.to,
        transport: "flight",
        airline: priceResult.airlineFullName,
        duration: formatDuration(duration),
        durationMinutes: duration,
        price: priceResult.price,
        visaStatus: visa.status,
        visaNote: visa.note,
      });
    }

    // Totals
    const totalPrice = legs.reduce((sum, l) => sum + l.price, 0);
    const totalDurationMinutes = legs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const layoverText = legs.length > 1 ? " (+ layovers)" : "";
    const totalDuration = formatDuration(totalDurationMinutes) + layoverText;

    // Warnings
    const warnings: string[] = [...(pattern.warnings ?? [])];
    if (totalDurationMinutes > 1200) {
      warnings.push(
        "Long total travel time — consider an overnight stop at a layover city"
      );
    }

    // Tags
    const tags: string[] = [pattern.tag];

    // Generate a deterministic ID
    const legCodes = legs.map((l) => l.fromCode).join("-") + "-" + legs[legs.length - 1].toCode;
    const id = `route-${legCodes}-${totalPrice}`;

    return {
      id,
      legs,
      totalPrice,
      totalDurationMinutes,
      totalDuration,
      warnings,
      tags,
    };
  });

  const rawResults = await Promise.all(routePromises);

  // Filter nulls and sort by price
  const routes = rawResults
    .filter((r): r is RouteOption => r !== null)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  // Tag the cheapest, fastest, and most comfortable
  if (routes.length > 0) {
    // Cheapest
    routes[0].tags.push("Cheapest");

    // Fastest
    const fastest = routes.reduce((min, r) =>
      r.totalDurationMinutes < min.totalDurationMinutes ? r : min
    );
    if (!fastest.tags.includes("Cheapest")) {
      fastest.tags.push("Fastest");
    } else if (routes.length > 1) {
      // Find next fastest that isn't already tagged cheapest
      const nextFastest = routes
        .filter((r) => r !== fastest)
        .reduce((min, r) =>
          r.totalDurationMinutes < min.totalDurationMinutes ? r : min
        );
      nextFastest.tags.push("Fastest");
    }

    // Most comfortable = fewest legs (and within that, shortest duration)
    const comfortable = routes.reduce((best, r) => {
      if (r.legs.length < best.legs.length) return r;
      if (
        r.legs.length === best.legs.length &&
        r.totalDurationMinutes < best.totalDurationMinutes
      )
        return r;
      return best;
    });
    if (
      !comfortable.tags.includes("Cheapest") &&
      !comfortable.tags.includes("Fastest")
    ) {
      comfortable.tags.push("Most comfortable");
    }

    // Adventure route = most legs
    const adventure = routes.reduce((best, r) =>
      r.legs.length > best.legs.length ? r : best
    );
    if (
      adventure.legs.length > 2 &&
      !adventure.tags.includes("Cheapest") &&
      !adventure.tags.includes("Fastest") &&
      !adventure.tags.includes("Most comfortable")
    ) {
      adventure.tags.push("Adventure route");
    }
  }

  return routes;
}
