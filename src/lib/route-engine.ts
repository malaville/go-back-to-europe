// ---------------------------------------------------------------------------
// Route-building engine
// Generates multi-leg SEA → Europe routes that avoid conflict zones,
// prices each segment via the Aviasales cached-price API, and returns
// sorted RouteOption[] results.
// ---------------------------------------------------------------------------

import type { RouteOption, RouteLeg } from "@/data/route-types";
import {
  getCheapestFlight,
  getLatestOneWayPrice,
  airlineName,
} from "./aviasales";
import { visaRules } from "@/data/visa-rules";

// ── Airlines that hub through the Middle East ─────────────────────────────
// Flights on these carriers between non-ME points almost always connect
// through the Gulf (Abu Dhabi, Dubai, Doha, Sharjah, etc.), defeating the
// "avoid conflict zones" constraint even when the listed airports are safe.
const MIDDLE_EAST_HUB_AIRLINES = new Set([
  "EY", // Etihad Airways — Abu Dhabi hub
  "EK", // Emirates — Dubai hub
  "FZ", // flydubai — Dubai hub
  "G9", // Air Arabia — Sharjah hub
  "QR", // Qatar Airways — Doha hub
  "GF", // Gulf Air — Bahrain hub
  "WY", // Oman Air — Muscat hub
  "SV", // Saudia — Jeddah/Riyadh hub
  "RJ", // Royal Jordanian — Amman hub
  "ME", // Middle East Airlines — Beirut hub
]);

// ── Airline hub cities ────────────────────────────────────────────────────
// When an airline is returned for a segment and neither endpoint is its hub,
// the flight almost certainly connects through the hub (hidden stop).
const AIRLINE_HUBS: Record<string, string[]> = {
  MU: ["PVG"],     // China Eastern → Shanghai
  CZ: ["CAN"],     // China Southern → Guangzhou
  CA: ["PEK"],     // Air China → Beijing
  HU: ["PEK"],     // Hainan Airlines → Beijing
  TK: ["IST"],     // Turkish Airlines → Istanbul
  PC: ["IST"],     // Pegasus → Istanbul
  ET: ["ADD"],     // Ethiopian Airlines → Addis Ababa
  UL: ["CMB"],     // SriLankan Airlines → Colombo
  AI: ["DEL", "BOM"], // Air India → Delhi/Mumbai
  SU: ["SVO"],     // Aeroflot → Moscow
  KC: ["ALA"],     // Air Astana → Almaty
};

// ── Airline alliances ────────────────────────────────────────────────────
const AIRLINE_ALLIANCES: Record<string, string> = {
  // Star Alliance
  LH: "Star Alliance", SQ: "Star Alliance", NH: "Star Alliance",
  TG: "Star Alliance", AI: "Star Alliance", OS: "Star Alliance",
  SK: "Star Alliance", AY: "Star Alliance", TP: "Star Alliance",
  ET: "Star Alliance", LO: "Star Alliance", CA: "Star Alliance",
  BR: "Star Alliance", OZ: "Star Alliance",
  // SkyTeam
  AF: "SkyTeam", KL: "SkyTeam", MU: "SkyTeam", CZ: "SkyTeam",
  KE: "SkyTeam", VN: "SkyTeam", GA: "SkyTeam", AZ: "SkyTeam",
  // oneworld
  BA: "oneworld", CX: "oneworld", JL: "oneworld", MH: "oneworld",
  UL: "oneworld", IB: "oneworld", QF: "oneworld",
};

// ── Minimum connection time per airport (minutes) ────────────────────────
const MIN_CONNECTION_MINUTES: Record<string, number> = {
  SIN: 120,  // Changi — efficient
  HKG: 150,  // HK — efficient but immigration
  ICN: 120,  // Incheon — fast
  NRT: 150,  // Narita — slower
  TPE: 120,  // Taoyuan — decent
  CAN: 180,  // Guangzhou — large, TWOV processing
  PVG: 210,  // Shanghai — massive, TWOV customs
  DEL: 240,  // Delhi — slow immigration
  BOM: 210,  // Mumbai — large
  ADD: 210,  // Addis — slower processing
  CMB: 180,  // Colombo — medium
  ALA: 150,  // Almaty — smaller, faster
  TAS: 150,  // Tashkent — smaller
  TBS: 150,  // Tbilisi — small
  IST: 180,  // Istanbul — huge
  BKK: 150,  // Suvarnabhumi
  KUL: 150,  // KLIA
};
const DEFAULT_CONNECTION_MINUTES = 180;

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
];

// ── Segment durations (minutes) ───────────────────────────────────────────

const SEGMENT_DURATIONS: Record<string, number> = {
  // ── Direct nonstop SEA → Europe (Vietnam Airlines, Air France, SQ, etc.) ──
  "SGN-PAR": 780, "SGN-LON": 750,
  "BKK-PAR": 690, "BKK-LON": 690, "BKK-AMS": 690,
  "SIN-PAR": 800, "SIN-LON": 780, "SIN-AMS": 750,
  // From SGN
  "SGN-BKK": 105, "SGN-SIN": 125, "SGN-KUL": 130,
  "SGN-SEL": 310, "SGN-TPE": 210, "SGN-TYO": 340,
  "SGN-HKG": 165, "SGN-DEL": 330, "SGN-BOM": 360,
  "SGN-CMB": 240,
  "SGN-CAN": 150, "SGN-PVG": 240,
  // From BKK
  "BKK-SEL": 310, "BKK-TPE": 220, "BKK-TYO": 360,
  "BKK-IST": 570, "BKK-TBS": 510,
  "BKK-HKG": 165, "BKK-DEL": 255, "BKK-BOM": 270,
  "BKK-ADD": 540, "BKK-ALA": 390, "BKK-TAS": 420,
  "BKK-CMB": 210,
  "BKK-CAN": 180, "BKK-PVG": 270,
  // From KUL
  "KUL-IST": 675, "KUL-HKG": 225, "KUL-DEL": 330,
  "KUL-CMB": 210, "KUL-ADD": 540,
  "KUL-CAN": 225, "KUL-PVG": 300,
  // From SIN
  "SIN-HKG": 225, "SIN-DEL": 330, "SIN-CMB": 210,
  "SIN-ADD": 570,
  "SIN-CAN": 225, "SIN-PVG": 300,
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
  // From CAN — Guangzhou (China Southern hub)
  "CAN-PAR": 720, "CAN-LON": 720, "CAN-AMS": 690,
  "CAN-BER": 660, "CAN-FCO": 690, "CAN-BCN": 720,
  "CAN-MAD": 720, "CAN-LIS": 750,
  // From PVG — Shanghai (China Eastern hub)
  "PVG-PAR": 750, "PVG-LON": 720, "PVG-AMS": 690,
  "PVG-BER": 660, "PVG-FCO": 690, "PVG-BCN": 720,
  "PVG-MAD": 750, "PVG-LIS": 780,
  "PVG-WAW": 600, "PVG-VIE": 630, "PVG-PRG": 630, "PVG-BUD": 630,
  "CAN-WAW": 630, "CAN-VIE": 660, "CAN-PRG": 660, "CAN-BUD": 660,

  // ── Small SEA origins → transit hubs ──
  // Hanoi (HAN)
  "HAN-BKK": 120, "HAN-SIN": 210, "HAN-HKG": 135,
  "HAN-CAN": 120, "HAN-PVG": 180,
  // Bali (DPS)
  "DPS-SIN": 155, "DPS-KUL": 180, "DPS-BKK": 210,
  "DPS-HKG": 210, "DPS-CAN": 240,
  // Manila (MNL)
  "MNL-HKG": 135, "MNL-SIN": 210, "MNL-BKK": 210,
  "MNL-CAN": 180, "MNL-TPE": 90,
  // Phnom Penh (PNH)
  "PNH-BKK": 65, "PNH-SIN": 120, "PNH-SGN": 75,
  "PNH-HKG": 150,
  // Vientiane (VTE)
  "VTE-BKK": 70, "VTE-HAN": 120, "VTE-SGN": 130,
  // Chiang Mai (CNX)
  "CNX-BKK": 75, "CNX-SGN": 180, "CNX-SIN": 180,
  // Yangon (RGN)
  "RGN-BKK": 90, "RGN-SIN": 180, "RGN-HKG": 150,

  // ── New EU destinations from existing hubs ──
  // Helsinki (HEL)
  "BKK-HEL": 630, "SIN-HEL": 660, "HKG-HEL": 660,
  "DEL-HEL": 480, "ALA-HEL": 390, "TBS-HEL": 210, "IST-HEL": 240,
  "CAN-HEL": 690, "PVG-HEL": 660,
  // Athens (ATH)
  "BKK-ATH": 600, "SIN-ATH": 630, "HKG-ATH": 720,
  "DEL-ATH": 450, "ADD-ATH": 390, "TBS-ATH": 330, "IST-ATH": 90,
  "ALA-ATH": 480, "CAN-ATH": 750, "PVG-ATH": 750,
  // Stockholm (ARN)
  "BKK-ARN": 720, "SIN-ARN": 750, "HKG-ARN": 720,
  "DEL-ARN": 540, "ALA-ARN": 450, "TBS-ARN": 300, "IST-ARN": 360,
  // Copenhagen (CPH)
  "BKK-CPH": 600, "SIN-CPH": 630, "HKG-CPH": 660,
  "DEL-CPH": 480, "ALA-CPH": 420, "TBS-CPH": 270, "IST-CPH": 300,
  // Dublin (DUB)
  "BKK-DUB": 720, "SIN-DUB": 750, "HKG-DUB": 810,
  "DEL-DUB": 600, "ALA-DUB": 540, "TBS-DUB": 420, "IST-DUB": 450,
  // Bucharest (OTP)
  "BKK-OTP": 540, "SIN-OTP": 570, "HKG-OTP": 630,
  "DEL-OTP": 360, "ALA-OTP": 300, "TBS-OTP": 150, "IST-OTP": 240,
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
  CAN: "CN",
  PVG: "CN",
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
  HEL: "FI",
  ATH: "GR",
  ARN: "SE",
  CPH: "DK",
  DUB: "IE",
  OTP: "RO",
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
  CAN: "Guangzhou",
  PVG: "Shanghai",
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
  HEL: "Helsinki",
  ATH: "Athens",
  ARN: "Stockholm",
  CPH: "Copenhagen",
  DUB: "Dublin",
  OTP: "Bucharest",
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

  // ── Nonstop direct routes (VN, AF, SQ, TG, BA, KLM fly nonstop from major SEA hubs)
  if (["SGN", "SIN", "BKK", "KUL"].includes(departureHub)) {
    patterns.push({
      hubs: [],
      tag: "Nonstop",
    });
  }

  // ── 3-leg via East Asia (clean — no ME transit)
  patterns.push({ hubs: ["ICN"], tag: "Via Seoul" });
  patterns.push({ hubs: ["NRT"], tag: "Via Tokyo" });
  patterns.push({ hubs: ["TPE"], tag: "Via Taipei" });

  // ── 3-leg via Hong Kong (Cathay Pacific — no ME transit)
  patterns.push({ hubs: ["HKG"], tag: "Via Hong Kong" });

  // ── 3-leg via China (144h visa-free transit for many nationalities)
  patterns.push({ hubs: ["CAN"], tag: "Via Guangzhou" });
  patterns.push({ hubs: ["PVG"], tag: "Via Shanghai" });

  // ── 3-leg via Singapore (Singapore Airlines — no ME transit)
  if (departureHub !== "SIN") {
    patterns.push({ hubs: ["SIN"], tag: "Via Singapore" });
  }

  // ── 3-leg via South Asia
  patterns.push({
    hubs: ["DEL"],
    tag: "Via Delhi",
    warnings: [
      "Indian e-visa takes 3-5 business days — apply immediately if departing within a week.",
    ],
  });
  patterns.push({
    hubs: ["BOM"],
    tag: "Via Mumbai",
    warnings: [
      "Indian e-visa takes 3-5 business days — apply immediately if departing within a week.",
    ],
  });
  patterns.push({ hubs: ["CMB"], tag: "Via Colombo" });

  // ── 3-leg via Africa (Ethiopian Airlines — no ME transit, flies polar/African routes)
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
  patterns.push({ hubs: ["BKK", "CAN"], tag: "Via Bangkok + Guangzhou" });
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
 * Automatically excludes Middle East hub airlines to avoid Gulf transits.
 */
async function fetchSegmentPrice(
  from: string,
  to: string,
  departMonth?: string
): Promise<SegmentPriceResult | null> {
  // Try the monthly cache first — skip ME-hub airlines
  const cheap = await getCheapestFlight(from, to, departMonth, MIDDLE_EAST_HUB_AIRLINES);
  if (cheap) {
    return {
      price: cheap.price,
      airline: cheap.airline,
      airlineFullName: cheap.airlineName,
    };
  }

  // Fallback: latest one-way prices — also skip ME-hub airlines
  const latest = await getLatestOneWayPrice(from, to, MIDDLE_EAST_HUB_AIRLINES);
  if (latest) {
    return {
      price: latest.price,
      airline: latest.airline,
      airlineFullName: latest.airlineName,
    };
  }

  return null;
}

/**
 * Fetch price for a NONSTOP segment only — requires number_of_changes === 0.
 * Only uses /v2/prices/latest since /v1/prices/cheap doesn't report changes.
 */
async function fetchNonstopPrice(
  from: string,
  to: string,
): Promise<SegmentPriceResult | null> {
  const latest = await getLatestOneWayPrice(from, to, MIDDLE_EAST_HUB_AIRLINES, 0);
  if (latest) {
    return {
      price: latest.price,
      airline: latest.airline,
      airlineFullName: latest.airlineName,
    };
  }
  return null;
}

/**
 * Detect if an airline likely transits through its hub for a given segment.
 * Only flags long-haul segments (>8h) where neither endpoint is the hub.
 */
function detectHiddenStop(
  airlineCode: string,
  from: string,
  to: string,
  durationMinutes: number
): string | null {
  if (durationMinutes < 480) return null; // short-haul, likely direct

  const hubs = AIRLINE_HUBS[airlineCode];
  if (!hubs) return null;

  const fromApi = apiCode(from);
  const toApi = apiCode(to);

  for (const hub of hubs) {
    if (fromApi === hub || toApi === hub) return null; // direct to/from hub
  }

  const hubCity = AIRPORT_CITY[hubs[0]] || hubs[0];
  return `Likely connects via ${hubCity}`;
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
  const EU_SEARCH_AIRPORTS = ["CDG", "AMS", "LHR", "BER", "FCO", "BCN", "MAD", "LIS", "WAW", "VIE", "PRG", "BUD", "HEL", "ATH", "ARN", "CPH", "DUB", "OTP"];
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

    const isNonstop = pattern.hubs.length === 0;
    const priceResults = await Promise.all(
      segmentCodes.map((seg) =>
        isNonstop
          ? fetchNonstopPrice(seg.from, seg.to)
          : fetchSegmentPrice(seg.from, seg.to, departMonth)
      )
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

      const hiddenStop = detectHiddenStop(priceResult.airline, seg.from, seg.to, duration);

      legs.push({
        from: AIRPORT_CITY[seg.from] ?? seg.from,
        to: AIRPORT_CITY[seg.to] ?? seg.to,
        fromCode: seg.from,
        toCode: seg.to,
        transport: "flight",
        airline: priceResult.airlineFullName,
        airlineCode: priceResult.airline,
        hiddenStop: hiddenStop ?? undefined,
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

    // Estimated total including layovers
    let layoverMinutes = 0;
    const flightLegs = legs.filter((l) => l.transport === "flight");
    if (flightLegs.length > 1) {
      // Add connection time at each intermediate airport
      for (let i = 0; i < flightLegs.length - 1; i++) {
        const connectAt = flightLegs[i].toCode;
        layoverMinutes += MIN_CONNECTION_MINUTES[connectAt] ?? DEFAULT_CONNECTION_MINUTES;
      }
    }
    // Also add ground→flight connection time if applicable
    if (groundLeg && flightLegs.length > 0) {
      layoverMinutes += MIN_CONNECTION_MINUTES[flightLegs[0].fromCode] ?? DEFAULT_CONNECTION_MINUTES;
    }

    const estimatedTotalMinutes = totalDurationMinutes + layoverMinutes;
    const estimatedTotalDuration = legs.length > 1
      ? `~${formatDuration(estimatedTotalMinutes)}`
      : formatDuration(totalDurationMinutes);
    const totalDuration = legs.length > 1
      ? `${formatDuration(totalDurationMinutes)} flying`
      : formatDuration(totalDurationMinutes);

    // Ticket type — detect alliance connections
    const airlineCodes = flightLegs
      .map((l) => l.airlineCode)
      .filter((c): c is string => !!c);

    let ticketType: "separate" | "alliance" | "single-carrier" = "separate";
    if (airlineCodes.length > 0) {
      if (airlineCodes.every((c) => c === airlineCodes[0])) {
        ticketType = "single-carrier";
      } else {
        const alliances = airlineCodes.map((c) => AIRLINE_ALLIANCES[c]).filter(Boolean);
        if (
          alliances.length === airlineCodes.length &&
          alliances.every((a) => a === alliances[0])
        ) {
          ticketType = "alliance";
        }
      }
    }

    // Warnings
    const warnings: string[] = [...(pattern.warnings ?? [])];
    if (estimatedTotalMinutes > 1440) {
      warnings.push(
        "Long total travel time — consider an overnight stop at a layover city"
      );
    }
    if (ticketType === "separate" && flightLegs.length > 1) {
      warnings.push(
        "Separate tickets — no rebooking protection if you miss a connection. Book with extra layover time."
      );
    }
    // Flag hidden stops
    for (const leg of flightLegs) {
      if (leg.hiddenStop) {
        warnings.push(`${leg.from}→${leg.to} on ${leg.airline}: ${leg.hiddenStop}`);
      }
    }

    // Build Aviasales affiliate search URL (origin → final destination)
    const searchMonth = departMonth.split("-")[1] || "03";
    const searchDate = `15${searchMonth}`; // 15th of departure month
    const firstFrom = legs[0].fromCode;
    const lastTo = legs[legs.length - 1].toCode;
    const searchUrl = `https://www.aviasales.com/search/${firstFrom}${searchDate}${lastTo}1?marker=708661`;

    // Tags
    const tags: string[] = [pattern.tag];
    if (ticketType === "single-carrier") {
      tags.push("Single ticket");
    } else if (ticketType === "alliance") {
      const allianceName = AIRLINE_ALLIANCES[airlineCodes[0]];
      if (allianceName) tags.push(allianceName);
    }

    // Generate a deterministic ID
    const legCodes = legs.map((l) => l.fromCode).join("-") + "-" + legs[legs.length - 1].toCode;
    const id = `route-${legCodes}-${totalPrice}`;

    return {
      id,
      legs,
      totalPrice,
      totalDurationMinutes,
      totalDuration,
      estimatedTotalMinutes,
      estimatedTotalDuration,
      searchUrl,
      ticketType,
      warnings,
      tags,
    };
  });

  const rawResults = await Promise.all(routePromises);

  // Filter nulls, then sort: safe routes first, then by price.
  // Routes with conflict-zone warnings get pushed to the bottom.
  const routes = rawResults
    .filter((r): r is RouteOption => r !== null)
    .sort((a, b) => {
      const aHasConflict = a.warnings.some((w) => w.includes("conflict"));
      const bHasConflict = b.warnings.some((w) => w.includes("conflict"));
      if (aHasConflict && !bHasConflict) return 1;
      if (!aHasConflict && bHasConflict) return -1;
      return a.totalPrice - b.totalPrice;
    });

  if (routes.length === 0) return routes;

  // ── Compute recommendation score for each route ──────────────────────
  const medianPrice = routes[Math.floor(routes.length / 2)].totalPrice;
  const sortedByTime = [...routes].sort((a, b) => a.estimatedTotalMinutes - b.estimatedTotalMinutes);
  const medianTime = sortedByTime[Math.floor(sortedByTime.length / 2)].estimatedTotalMinutes;

  let bestScore = -1;
  let bestRoute: RouteOption | null = null;

  for (const route of routes) {
    let score = 0;

    // All visa-free transits (+20)
    if (route.legs.every((l) => l.visaStatus === "free" || l.visaStatus === "none")) {
      score += 20;
    }

    // Fewer stops (+15 nonstop, +10 one-stop)
    const fLegs = route.legs.filter((l) => l.transport === "flight");
    if (fLegs.length === 1) score += 15;
    else if (fLegs.length === 2) score += 10;

    // Ticket type (+10 single, +5 alliance)
    if (route.ticketType === "single-carrier") score += 10;
    else if (route.ticketType === "alliance") score += 5;

    // No conflict warnings (+10)
    if (!route.warnings.some((w) => w.includes("conflict"))) score += 10;

    // No hidden stops (+5)
    if (!route.legs.some((l) => l.hiddenStop)) score += 5;

    // Price below median (+15)
    if (route.totalPrice <= medianPrice) score += 15;

    // Time below median (+10)
    if (route.estimatedTotalMinutes <= medianTime) score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestRoute = route;
    }
  }

  // ── Tag routes ───────────────────────────────────────────────────────

  // Recommended (composite best)
  if (bestRoute) {
    bestRoute.tags.push("Recommended");
  }

  // Cheapest
  routes[0].tags.push("Cheapest");

  // Fastest (by estimated total)
  const fastest = routes.reduce((min, r) =>
    r.estimatedTotalMinutes < min.estimatedTotalMinutes ? r : min
  );
  if (!fastest.tags.includes("Cheapest")) {
    fastest.tags.push("Fastest");
  } else if (routes.length > 1) {
    const nextFastest = routes
      .filter((r) => r !== fastest)
      .reduce((min, r) =>
        r.estimatedTotalMinutes < min.estimatedTotalMinutes ? r : min
      );
    nextFastest.tags.push("Fastest");
  }

  // Adventure route = most legs
  const adventure = routes.reduce((best, r) =>
    r.legs.length > best.legs.length ? r : best
  );
  if (
    adventure.legs.length > 2 &&
    !adventure.tags.includes("Cheapest") &&
    !adventure.tags.includes("Fastest") &&
    !adventure.tags.includes("Recommended")
  ) {
    adventure.tags.push("Adventure route");
  }

  // Cap results at ~20 to prevent combinatorial explosion
  return routes.slice(0, 20);
}
