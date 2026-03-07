// ---------------------------------------------------------------------------
// Route-building engine — Graph-based exploration
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
import { cities } from "@/data/cities";

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
  "KU", // Kuwait Airways — Kuwait City hub
  "OV", // SalamAir — Muscat hub
  "XY", // flynas — Riyadh hub
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
// Bus, train, ferry only — no "flight" type. Regional flights are in
// FALLBACK_FLIGHT_PRICES and discovered via the graph.

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
    durationMinutes: 420, // 7h
    price: 10,
    note: "Regular buses, ~300km",
  },
  {
    fromCode: "SGN",
    fromCity: "Ho Chi Minh City",
    toCode: "PNH",
    toCity: "Phnom Penh",
    transport: "bus",
    durationMinutes: 360, // 6h
    price: 15,
    note: "Regular buses via Moc Bai border",
  },
  {
    fromCode: "PNH",
    fromCity: "Phnom Penh",
    toCode: "BKK",
    toCity: "Bangkok",
    transport: "bus",
    durationMinutes: 720, // 12h
    price: 25,
    note: "Bus via Poipet border, ~12h",
  },
  {
    fromCode: "VTE",
    fromCity: "Vientiane",
    toCode: "BKK",
    toCity: "Bangkok",
    transport: "bus",
    durationMinutes: 600, // 10h
    price: 20,
    note: "Bus via Nong Khai border",
  },
  {
    fromCode: "CNX",
    fromCity: "Chiang Mai",
    toCode: "BKK",
    toCity: "Bangkok",
    transport: "train",
    durationMinutes: 720, // 12h
    price: 20,
    note: "Overnight sleeper train",
  },
  {
    fromCode: "KUL",
    fromCity: "Kuala Lumpur",
    toCode: "SIN",
    toCity: "Singapore",
    transport: "bus",
    durationMinutes: 300, // 5h
    price: 10,
    note: "Express bus KL→SG",
  },
  {
    fromCode: "SIN",
    fromCity: "Singapore",
    toCode: "KUL",
    toCity: "Kuala Lumpur",
    transport: "bus",
    durationMinutes: 300, // 5h
    price: 10,
    note: "Express bus SG→KL",
  },
];

// ── Geographic ground-reachability engine ─────────────────────────────────
// Dynamically computes overland travel to major airport hubs based on
// haversine distance, replacing the old hardcoded-only BFS approach.

// Build airport → {lat, lng, country} lookup from cities data
const AIRPORT_COORDS: Map<string, { lat: number; lng: number; country: string }> = new Map();
for (const city of cities) {
  for (const ap of city.nearbyAirports) {
    AIRPORT_COORDS.set(ap.code, { lat: city.lat, lng: city.lng, country: city.country });
  }
}

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Land-connected groups — only airports in the same group can have ground routes.
// Myanmar excluded (unsafe borders). Islands (ID, PH) have no overland connections.
const MAINLAND_SEA_COUNTRIES = new Set(["TH", "VN", "KH", "LA", "MY", "SG"]);

function areLandConnected(countryA: string, countryB: string): boolean {
  return MAINLAND_SEA_COUNTRIES.has(countryA) && MAINLAND_SEA_COUNTRIES.has(countryB);
}

// Ground estimation parameters
const ROAD_FACTOR = 1.4;      // straight-line → road distance multiplier
const BUS_SPEED_KMH = 50;     // average speed including stops/borders
const PRICE_PER_KM = 0.015;   // ~$15 per 1000km, matches SEA bus pricing
const MIN_GROUND_MINUTES = 60; // don't show trivially short ground legs

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
  "BKK-VIE": 660, // EVA Air 5th freedom route
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
  "HKG-BER": 680, "HKG-ROM": 690, "HKG-BCN": 720,
  // From DEL (to Europe)
  "DEL-PAR": 510, "DEL-LON": 510, "DEL-AMS": 510,
  "DEL-BER": 450, "DEL-ROM": 480, "DEL-BCN": 540,
  // From BOM (to Europe)
  "BOM-PAR": 540, "BOM-LON": 540, "BOM-AMS": 540,
  "BOM-BER": 480, "BOM-ROM": 480,
  // From ADD (to Europe) — Ethiopian Airlines hub
  "ADD-PAR": 480, "ADD-LON": 480, "ADD-AMS": 510,
  "ADD-BER": 450, "ADD-ROM": 420, "ADD-BCN": 480,
  // From ALA (to Europe) — Air Astana hub
  "ALA-PAR": 420, "ALA-LON": 420, "ALA-AMS": 390,
  "ALA-BER": 360, "ALA-IST": 330,
  // From TAS (to Europe) — Uzbekistan Airways
  "TAS-PAR": 390, "TAS-LON": 390, "TAS-AMS": 360,
  "TAS-BER": 330, "TAS-ROM": 360,
  // From CMB (to Europe) — SriLankan Airlines
  "CMB-PAR": 600, "CMB-LON": 600, "CMB-AMS": 600,
  "CMB-ROM": 570,
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
  "IST-ROM": 165, "IST-BCN": 210, "IST-MAD": 240, "IST-LIS": 270,
  "IST-WAW": 150, "IST-VIE": 150, "IST-PRG": 165, "IST-BUD": 135,
  // Extended EU destinations from existing hubs
  "SEL-ROM": 720, "SEL-BCN": 750, "SEL-MAD": 780, "SEL-LIS": 780,
  "SEL-WAW": 630, "SEL-VIE": 660, "SEL-PRG": 660, "SEL-BUD": 660,
  "TYO-ROM": 720, "TYO-BER": 690, "TYO-BCN": 750,
  "TPE-BER": 750, "TPE-ROM": 750,
  "TBS-ROM": 240, "TBS-BCN": 300, "TBS-MAD": 330, "TBS-LIS": 360,
  "TBS-PRG": 240, "TBS-BUD": 210,
  "HKG-MAD": 750, "HKG-LIS": 780, "HKG-WAW": 660, "HKG-VIE": 680,
  "HKG-PRG": 680, "HKG-BUD": 680,
  "DEL-MAD": 540, "DEL-LIS": 540, "DEL-WAW": 420, "DEL-VIE": 450,
  "DEL-PRG": 450, "DEL-BUD": 430,
  "BOM-MAD": 540, "BOM-LIS": 540, "BOM-WAW": 450, "BOM-VIE": 450,
  "ADD-MAD": 480, "ADD-LIS": 480, "ADD-WAW": 450, "ADD-VIE": 420,
  "ADD-PRG": 450, "ADD-BUD": 420,
  "ALA-ROM": 360, "ALA-BCN": 390, "ALA-MAD": 420, "ALA-WAW": 300,
  "ALA-VIE": 330, "ALA-PRG": 330, "ALA-BUD": 300,
  "TAS-MAD": 390, "TAS-WAW": 270, "TAS-VIE": 300,
  "TAS-PRG": 300, "TAS-BUD": 270,
  "CMB-BER": 570, "CMB-BCN": 600, "CMB-MAD": 600,
  // From CAN — Guangzhou (China Southern hub)
  "CAN-PAR": 720, "CAN-LON": 720, "CAN-AMS": 690,
  "CAN-BER": 660, "CAN-ROM": 690, "CAN-BCN": 720,
  "CAN-MAD": 720, "CAN-LIS": 750,
  // From PVG — Shanghai (China Eastern hub)
  "PVG-PAR": 750, "PVG-LON": 720, "PVG-AMS": 690,
  "PVG-BER": 660, "PVG-ROM": 690, "PVG-BCN": 720,
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
  // Milan (MIL → MXP)
  "BKK-MIL": 660, "SIN-MIL": 690, "HKG-MIL": 690,
  "DEL-MIL": 480, "BOM-MIL": 480, "ADD-MIL": 420,
  "ALA-MIL": 360, "TAS-MIL": 360, "CMB-MIL": 570,
  "IST-MIL": 180, "TBS-MIL": 240,
  "SEL-MIL": 720, "TYO-MIL": 720, "TPE-MIL": 750,
  "CAN-MIL": 690, "PVG-MIL": 690,
};

/** Look up segment duration, trying both orderings of city codes. */
function getSegmentDuration(from: string, to: string): number | null {
  return SEGMENT_DURATIONS[`${from}-${to}`] ?? SEGMENT_DURATIONS[`${to}-${from}`] ?? null;
}

// Major SEA hubs: airports appearing as origin in ≥3 SEGMENT_DURATIONS entries.
// These are worth bussing to because they have significant flight connectivity.
const MAJOR_HUBS: Set<string> = (() => {
  const originCount = new Map<string, number>();
  for (const key of Object.keys(SEGMENT_DURATIONS)) {
    const origin = key.split("-")[0];
    originCount.set(origin, (originCount.get(origin) ?? 0) + 1);
  }
  const hubs = new Set<string>();
  for (const [code, count] of originCount) {
    if (count >= 3) hubs.add(code);
  }
  return hubs;
})();

// Build a lookup from hardcoded GROUND_CONNECTIONS for override matching
const GROUND_OVERRIDE: Map<string, GroundConnection> = new Map();
for (const gc of GROUND_CONNECTIONS) {
  GROUND_OVERRIDE.set(`${gc.fromCode}-${gc.toCode}`, gc);
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

/** Build an Aviasales one-way search URL for a single leg */
function aviasalesLegUrl(from: string, to: string, departDate?: string): string {
  let ddmm = "1503"; // fallback: 15th of March
  if (departDate) {
    const d = new Date(departDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    ddmm = `${day}${month}`;
  }
  return `https://www.aviasales.com/search/${from}${ddmm}${to}1?marker=708661`;
}

// ── Reverse API code mapping ─────────────────────────────────────────────
// API/city codes → primary airport code

const API_CODE_TO_AIRPORT: Record<string, string> = {
  PAR: "CDG",
  LON: "LHR",
  ROM: "FCO",
  SEL: "ICN",
  TYO: "NRT",
  MIL: "MXP",
  BRU: "BRU",
};

function fromApiCode(code: string): string {
  return API_CODE_TO_AIRPORT[code] ?? code;
}

// ── Fallback flight prices ───────────────────────────────────────────────
// Regional flights the Aviasales API might miss. Used as last resort.

const FALLBACK_FLIGHT_PRICES: Record<string, { price: number; duration: number }> = {
  "VTE-BKK": { price: 60, duration: 70 },
  "PNH-BKK": { price: 40, duration: 90 },
  "DPS-SIN": { price: 65, duration: 180 },
  "MNL-HKG": { price: 50, duration: 150 },
  "RGN-BKK": { price: 50, duration: 100 },
  "HAN-BKK": { price: 60, duration: 130 },
  "CNX-BKK": { price: 30, duration: 80 },
};

// ── Fifth-freedom routes ─────────────────────────────────────────────────
// These are legitimate direct flights — NOT hidden-stop connections.

const FIFTH_FREEDOM_ROUTES: Record<string, { airline: string; price: number }> = {
  // EVA Air (BR)
  "BKK-VIE": { airline: "BR", price: 350 },
  "BKK-AMS": { airline: "BR", price: 380 },
  "BKK-LON": { airline: "BR", price: 400 },
  "BKK-PAR": { airline: "BR", price: 390 },
  // Ethiopian Airlines (ET)
  "BKK-TYO": { airline: "ET", price: 250 },
  "BKK-SEL": { airline: "ET", price: 220 },
};

// ── Warning airport sets ─────────────────────────────────────────────────

const CONFLICT_ADJACENT_AIRPORTS = new Set(["IST"]);
const VISA_WARNING_AIRPORTS = new Set(["DEL", "BOM"]);

// ── EU search airports (module level) ────────────────────────────────────

const EU_SEARCH_AIRPORTS = [
  "CDG", "AMS", "LHR", "BER", "FCO", "MXP", "BCN", "MAD", "LIS",
  "WAW", "VIE", "PRG", "BUD", "HEL", "ATH", "ARN", "CPH", "DUB", "OTP",
];

const EU_AIRPORT_SET = new Set(EU_SEARCH_AIRPORTS);

function isEuAirport(code: string): boolean {
  const cc = AIRPORT_COUNTRY[fromApiCode(code)];
  return cc ? EU_COUNTRIES.has(cc) : EU_AIRPORT_SET.has(code);
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

// ── Segment price fetching ───────────────────────────────────────────────

type SegmentPriceResult = {
  price: number;
  airline: string;
  airlineFullName: string;
  departDate?: string;
  numberOfChanges?: number; // from /v2/prices/latest — undefined means unknown
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
      departDate: cheap.departureAt ? cheap.departureAt.split("T")[0] : undefined,
    };
  }

  // Fallback: latest one-way prices — also skip ME-hub airlines
  const latest = await getLatestOneWayPrice(from, to, MIDDLE_EAST_HUB_AIRLINES);
  if (latest) {
    return {
      price: latest.price,
      airline: latest.airline,
      airlineFullName: latest.airlineName,
      departDate: latest.departDate || undefined,
      numberOfChanges: latest.numberOfChanges,
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
      departDate: latest.departDate || undefined,
    };
  }
  return null;
}

/**
 * Fetch price with fallback chain: API → fifth freedom → fallback prices.
 */
async function fetchPriceWithFallback(
  from: string,
  to: string,
  departMonth?: string
): Promise<SegmentPriceResult | null> {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) console.log(`\n[price] Fetching ${from}->${to} (month=${departMonth})`);

  const apiResult = await fetchSegmentPrice(from, to, departMonth);
  if (apiResult) {
    if (isDev) console.log(`[price] ${from}->${to}: API hit → ${apiResult.airline} (${apiResult.airlineFullName}) €${apiResult.price} depart=${apiResult.departDate ?? "?"}`);
    return apiResult;
  }
  if (isDev) console.log(`[price] ${from}->${to}: API miss, trying fallbacks...`);

  // Check fifth freedom routes
  const key = `${apiCode(from)}-${apiCode(to)}`;
  const revKey = `${apiCode(to)}-${apiCode(from)}`;
  const fifth = FIFTH_FREEDOM_ROUTES[key] ?? FIFTH_FREEDOM_ROUTES[revKey];
  if (fifth) {
    if (isDev) console.log(`[price] ${from}->${to}: 5th freedom → ${fifth.airline} (${airlineName(fifth.airline)}) €${fifth.price}`);
    return {
      price: fifth.price,
      airline: fifth.airline,
      airlineFullName: airlineName(fifth.airline),
    };
  }

  // Check fallback prices
  const fb = FALLBACK_FLIGHT_PRICES[key] ?? FALLBACK_FLIGHT_PRICES[revKey];
  if (fb) {
    if (isDev) console.log(`[price] ${from}->${to}: fallback → €${fb.price}`);
    return {
      price: fb.price,
      airline: "??",
      airlineFullName: "Regional carrier",
    };
  }

  return null;
}

// ── Hidden-stop detection ────────────────────────────────────────────────

/**
 * Detect if an airline likely transits through its hub for a given segment.
 * Flags segments where neither endpoint is the airline's hub.
 */
function detectHiddenStop(
  airlineCode: string,
  from: string,
  to: string,
  durationMinutes: number
): string | null {
  // Fifth-freedom check: if this airline+route is a known 5th freedom flight,
  // it's a real direct flight, not a hidden connection
  const key = `${apiCode(from)}-${apiCode(to)}`;
  const revKey = `${apiCode(to)}-${apiCode(from)}`;
  const fifth = FIFTH_FREEDOM_ROUTES[key] ?? FIFTH_FREEDOM_ROUTES[revKey];
  if (fifth && fifth.airline === airlineCode) return null;

  const hubs = AIRLINE_HUBS[airlineCode];
  if (!hubs) return null;

  // Single-hub carriers (TK, PC, ET) almost always transit via their hub
  const singleHubCarriers = new Set(["TK", "PC", "ET", "UL", "KC"]);
  const threshold = singleHubCarriers.has(airlineCode) ? 300 : 480; // 5h vs 8h
  if (durationMinutes < threshold) return null;

  const fromApi = apiCode(from);
  const toApi = apiCode(to);

  for (const hub of hubs) {
    if (fromApi === hub || toApi === hub) return null; // direct to/from hub
  }

  const hubCity = AIRPORT_CITY[hubs[0]] || hubs[0];
  return `Likely connects via ${hubCity}`;
}

// ── Graph exploration ────────────────────────────────────────────────────

/**
 * Get all airports reachable by flight from a given airport,
 * based on SEGMENT_DURATIONS keys. Memoized.
 */
const _flightNeighborCache = new Map<string, string[]>();

function getFlightNeighbors(airport: string): string[] {
  const api = apiCode(airport);
  if (_flightNeighborCache.has(api)) return _flightNeighborCache.get(api)!;

  const neighbors = new Set<string>();
  for (const key of Object.keys(SEGMENT_DURATIONS)) {
    const [a, b] = key.split("-");
    if (a === api) neighbors.add(fromApiCode(b));
    else if (b === api) neighbors.add(fromApiCode(a));
  }
  const result = [...neighbors];
  _flightNeighborCache.set(api, result);
  return result;
}

/**
 * Compute ground-reachable major airports from an origin.
 * Uses haversine distance + road factor to estimate overland travel time.
 * Hardcoded GROUND_CONNECTIONS serve as overrides with more accurate data.
 * Also chains hardcoded connections via BFS (max 4 legs) for known routes.
 */
type GroundPath = {
  airport: string;
  legs: GroundConnection[];
  totalMinutes: number;
  totalPrice: number;
};

type GroundFilterReason = {
  hub: string;
  city: string;
  reason: string;
  distanceKm?: number;
  roadKm?: number;
  estimatedMinutes?: number;
};

function computeGroundReachable(origin: string, maxMinutes: number): { paths: GroundPath[]; filtered: GroundFilterReason[] } {
  const results = new Map<string, GroundPath>(); // airport → best path
  const filtered: GroundFilterReason[] = [];

  const originCoords = AIRPORT_COORDS.get(origin);
  const originCountry = AIRPORT_COUNTRY[origin];

  // ── Phase 1: Dynamic distance-based reachability to major hubs ────────
  if (originCoords && originCountry) {
    // Convert API codes in MAJOR_HUBS to real airport codes for lookup
    for (const hubApi of MAJOR_HUBS) {
      const hub = fromApiCode(hubApi);
      if (hub === origin) continue;

      const hubCoords = AIRPORT_COORDS.get(hub);
      const hubCountry = AIRPORT_COUNTRY[hub];
      const hubCity = AIRPORT_CITY[hub] ?? hub;

      if (!hubCoords || !hubCountry) {
        // Hub not in cities data (transit hubs like IST, DEL — not SEA ground targets)
        continue;
      }

      // Land connectivity check
      if (!areLandConnected(originCountry, hubCountry)) {
        filtered.push({ hub, city: hubCity, reason: `Not land-connected (${originCountry} ↔ ${hubCountry})` });
        continue;
      }

      const straightKm = haversineKm(originCoords.lat, originCoords.lng, hubCoords.lat, hubCoords.lng);
      const roadKm = straightKm * ROAD_FACTOR;
      const estimatedMinutes = Math.round((roadKm / BUS_SPEED_KMH) * 60);

      if (estimatedMinutes < MIN_GROUND_MINUTES) {
        filtered.push({ hub, city: hubCity, reason: `Too short (${estimatedMinutes}min)`, distanceKm: Math.round(straightKm), roadKm: Math.round(roadKm), estimatedMinutes });
        continue;
      }

      if (estimatedMinutes > maxMinutes) {
        filtered.push({ hub, city: hubCity, reason: `Too far (${Math.round(estimatedMinutes / 60)}h > ${Math.round(maxMinutes / 60)}h budget)`, distanceKm: Math.round(straightKm), roadKm: Math.round(roadKm), estimatedMinutes });
        continue;
      }

      // Check for hardcoded override with better data
      const override = GROUND_OVERRIDE.get(`${origin}-${hub}`);
      const price = override ? override.price : Math.round(roadKm * PRICE_PER_KM);
      const minutes = override ? override.durationMinutes : estimatedMinutes;
      const note = override ? override.note : "Estimated overland — plan your own stops along the way";
      const transport = override ? override.transport : "bus" as const;

      const leg: GroundConnection = {
        fromCode: origin,
        fromCity: AIRPORT_CITY[origin] ?? origin,
        toCode: hub,
        toCity: hubCity,
        transport,
        durationMinutes: minutes,
        price,
        note,
      };

      results.set(hub, {
        airport: hub,
        legs: [leg],
        totalMinutes: minutes,
        totalPrice: price,
      });
    }
  }

  // ── Phase 2: BFS on hardcoded connections (max 4 legs) ────────────────
  // This catches non-hub airports and chains like DLI→SGN→PNH
  const visited = new Set<string>([origin, ...results.keys()]);
  const queue: GroundPath[] = [{
    airport: origin,
    legs: [],
    totalMinutes: 0,
    totalPrice: 0,
  }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const gc of GROUND_CONNECTIONS) {
      if (gc.fromCode !== current.airport) continue;
      if (visited.has(gc.toCode)) continue;

      const newTime = current.totalMinutes + gc.durationMinutes;
      if (newTime > maxMinutes) continue;

      const path: GroundPath = {
        airport: gc.toCode,
        legs: [...current.legs, gc],
        totalMinutes: newTime,
        totalPrice: current.totalPrice + gc.price,
      };

      // Only add if not already reachable via dynamic computation,
      // or if BFS chain is faster
      const existing = results.get(gc.toCode);
      if (!existing || path.totalMinutes < existing.totalMinutes) {
        results.set(gc.toCode, path);
      }
      visited.add(gc.toCode);

      // Max 4 ground legs for BFS chains
      if (path.legs.length < 4) {
        queue.push(path);
      }
    }
  }

  return { paths: [...results.values()], filtered };
}

// ── Route assembly ───────────────────────────────────────────────────────

type FlightEdge = {
  from: string;
  to: string;
};

type CandidatePath = {
  groundLegs: GroundConnection[];
  groundTotalMinutes: number;
  groundTotalPrice: number;
  flightEdges: FlightEdge[];
};

function buildRouteFromEdges(
  path: CandidatePath,
  priceMap: Map<string, SegmentPriceResult>,
  nationality: string,
  deadlineDate: string,
  departMonth: string,
  fallbackDepartDate: string,
): RouteOption | null {
  const legs: RouteLeg[] = [];

  // Ground legs
  for (const gc of path.groundLegs) {
    const gVisa = resolveVisaStatus(gc.toCode, nationality);
    legs.push({
      from: gc.fromCity,
      to: gc.toCity,
      fromCode: gc.fromCode,
      toCode: gc.toCode,
      transport: gc.transport,
      duration: formatDuration(gc.durationMinutes),
      durationMinutes: gc.durationMinutes,
      price: gc.price,
      visaStatus: gVisa.status,
      visaNote: gVisa.note,
    });
  }

  // Flight legs
  let firstFlightDepartDate: string | undefined;
  for (const edge of path.flightEdges) {
    const edgeKey = `${apiCode(edge.from)}-${apiCode(edge.to)}`;
    const priceResult = priceMap.get(edgeKey);
    if (!priceResult) return null;

    if (!firstFlightDepartDate && priceResult.departDate) {
      firstFlightDepartDate = priceResult.departDate;
    }

    const fromApi = apiCode(edge.from);
    const toApi = apiCode(edge.to);
    const duration = getSegmentDuration(fromApi, toApi);
    if (duration === null) return null;

    const visa = resolveVisaStatus(edge.to, nationality);
    const hiddenStop = detectHiddenStop(priceResult.airline, edge.from, edge.to, duration);

    legs.push({
      from: AIRPORT_CITY[edge.from] ?? edge.from,
      to: AIRPORT_CITY[edge.to] ?? edge.to,
      fromCode: edge.from,
      toCode: edge.to,
      transport: "flight",
      airline: priceResult.airlineFullName,
      airlineCode: priceResult.airline,
      hiddenStop: hiddenStop ?? undefined,
      duration: formatDuration(duration),
      durationMinutes: duration,
      price: priceResult.price,
      visaStatus: visa.status,
      visaNote: visa.note,
      searchUrl: aviasalesLegUrl(edge.from, edge.to, priceResult.departDate),
    });
  }

  // Totals
  const totalPrice = legs.reduce((sum, l) => sum + l.price, 0);
  const totalDurationMinutes = legs.reduce((sum, l) => sum + l.durationMinutes, 0);

  // Estimated total including layovers
  let layoverMinutes = 0;
  const flightLegs = legs.filter((l) => l.transport === "flight");
  if (flightLegs.length > 1) {
    for (let i = 0; i < flightLegs.length - 1; i++) {
      const connectAt = flightLegs[i].toCode;
      layoverMinutes += MIN_CONNECTION_MINUTES[connectAt] ?? DEFAULT_CONNECTION_MINUTES;
    }
  }
  // Ground→flight connection time
  if (path.groundLegs.length > 0 && flightLegs.length > 0) {
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
  const warnings: string[] = [];

  // Auto-detect from intermediate airports
  for (const edge of path.flightEdges.slice(0, -1)) {
    if (CONFLICT_ADJACENT_AIRPORTS.has(edge.to)) {
      warnings.push(
        "Route transits through Turkey — near active conflict zones. Check current travel advisories."
      );
    }
    if (VISA_WARNING_AIRPORTS.has(edge.to)) {
      warnings.push(
        "Indian e-visa takes 3-5 business days — apply immediately if departing within a week."
      );
    }
  }

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
  // Flag hidden stops + check visa for hidden stop hubs
  for (const leg of flightLegs) {
    if (leg.hiddenStop) {
      warnings.push(`${leg.from}→${leg.to} on ${leg.airline}: ${leg.hiddenStop}`);
      // Check if hidden stop hub requires a visa (e.g., DEL/BOM for Indian transit)
      const hubMatch = leg.hiddenStop.match(/via (.+)$/);
      if (hubMatch) {
        const hubName = hubMatch[1];
        const hubCode = Object.entries(AIRPORT_CITY).find(([, name]) => name === hubName)?.[0];
        if (hubCode && VISA_WARNING_AIRPORTS.has(hubCode)) {
          warnings.push(
            "Indian e-visa takes 3-5 business days — apply immediately if departing within a week."
          );
        }
      }
    }
  }

  // Tags — auto-generate from structure
  const tags: string[] = [];

  // Check if the single-flight route is truly nonstop using API stop count
  const singleFlightEdge = path.flightEdges.length === 1 ? path.flightEdges[0] : null;
  const singleFlightPrice = singleFlightEdge
    ? priceMap.get(`${apiCode(singleFlightEdge.from)}-${apiCode(singleFlightEdge.to)}`)
    : null;
  const isVerifiedNonstop = singleFlightPrice?.numberOfChanges === 0;
  const hasStops = singleFlightPrice?.numberOfChanges !== undefined && singleFlightPrice.numberOfChanges > 0;

  if (flightLegs.length === 1 && path.groundLegs.length === 0 && !flightLegs[0].hiddenStop && !hasStops) {
    if (isVerifiedNonstop) {
      tags.push("Nonstop");
    } else if (flightLegs[0].airlineCode && flightLegs[0].airlineCode !== "??") {
      // Known airline, unknown stops — might be nonstop
      tags.push("Nonstop");
    }
    // If airline unknown AND stops unknown, don't tag Nonstop
  } else {
    // Build "Via X" or "Via X + Y" tag from intermediate hubs
    const intermediateAirports = path.flightEdges.slice(0, -1).map(e => e.to);
    if (path.groundLegs.length > 0) {
      // Include ground destination as first waypoint if different from flight origin
      const groundDest = path.groundLegs[path.groundLegs.length - 1].toCode;
      if (!intermediateAirports.includes(groundDest) && flightLegs.length > 0 && flightLegs[0].fromCode !== groundDest) {
        // Don't add — it's just the departure hub
      }
    }
    const hubNames = intermediateAirports.map(a => AIRPORT_CITY[a] ?? a);
    if (hubNames.length > 0) {
      tags.push(`Via ${hubNames.join(" + ")}`);
    }
  }

  // Fifth freedom tag
  for (const edge of path.flightEdges) {
    const ek = `${apiCode(edge.from)}-${apiCode(edge.to)}`;
    const rk = `${apiCode(edge.to)}-${apiCode(edge.from)}`;
    if (FIFTH_FREEDOM_ROUTES[ek] || FIFTH_FREEDOM_ROUTES[rk]) {
      const pm = priceMap.get(ek);
      if (pm && (FIFTH_FREEDOM_ROUTES[ek]?.airline === pm.airline || FIFTH_FREEDOM_ROUTES[rk]?.airline === pm.airline)) {
        tags.push("5th freedom deal");
        break;
      }
    }
  }

  if (ticketType === "single-carrier") {
    tags.push("Single ticket");
  } else if (ticketType === "alliance") {
    const allianceName = AIRLINE_ALLIANCES[airlineCodes[0]];
    if (allianceName) tags.push(allianceName);
  }

  // Search URL
  const searchMonth = departMonth.split("-")[1] || "03";
  const searchDate = `15${searchMonth}`;
  const firstFrom = legs[0].fromCode;
  const lastTo = legs[legs.length - 1].toCode;
  const searchUrl = `https://www.aviasales.com/search/${firstFrom}${searchDate}${lastTo}1?marker=708661`;

  // ID
  const legCodes = legs.map((l) => l.fromCode).join("-") + "-" + legs[legs.length - 1].toCode;
  const id = `route-${legCodes}-${totalPrice}`;

  // Departure date: use real API date from first flight, fallback to deadline - 2 days
  const departureDate = firstFlightDepartDate || fallbackDepartDate;

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
    departureDate,
  };
}

// ── Scoring ──────────────────────────────────────────────────────────────

function scoreAndSort(routes: RouteOption[]): RouteOption[] {
  if (routes.length === 0) return routes;

  // Compute normalization ranges
  const prices = routes.map(r => r.totalPrice);
  const times = routes.map(r => r.estimatedTotalMinutes);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const priceRange = maxPrice - minPrice || 1;
  const timeRange = maxTime - minTime || 1;

  type Scored = { route: RouteOption; score: number };
  const scored: Scored[] = routes.map(route => {
    const fLegs = route.legs.filter(l => l.transport === "flight");
    const stops = fLegs.length - 1;
    const hasHiddenStop = route.legs.some(l => l.hiddenStop);
    const hasConflict = route.warnings.some(w => w.includes("conflict"));
    const allVisaFree = route.legs.every(l => l.visaStatus === "free" || l.visaStatus === "none");
    const isNonstop = route.tags.includes("Nonstop");

    // Normalized 0-1 scores (higher = better)
    const priceScore = 1 - (route.totalPrice - minPrice) / priceRange;           // 25%
    const timeScore = 1 - (route.estimatedTotalMinutes - minTime) / timeRange;    // 20%
    const safetyScore = hasConflict ? 0 : 1;                                       // 15%
    const visaScore = allVisaFree ? 1 : 0;                                         // 10%
    const stopsScore = Math.max(0, 1 - stops * 0.33);                             // 10%
    const nonstopScore = isNonstop ? 1 : 0;                                        // 10%
    const hiddenScore = hasHiddenStop ? 0 : 1;                                     // 5%
    const ticketScore = route.ticketType === "single-carrier" ? 1
      : route.ticketType === "alliance" ? 0.5 : 0;                                // 5%

    const score =
      priceScore * 0.25 +
      timeScore * 0.20 +
      safetyScore * 0.15 +
      visaScore * 0.10 +
      stopsScore * 0.10 +
      nonstopScore * 0.10 +
      hiddenScore * 0.05 +
      ticketScore * 0.05;

    return { route, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  const sorted = scored.map(s => s.route);

  // Apply tags
  // Recommended = best score
  sorted[0].tags.push("Recommended");

  // Cheapest
  const cheapest = sorted.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min);
  if (!cheapest.tags.includes("Recommended")) {
    cheapest.tags.push("Cheapest");
  } else {
    // Find second cheapest
    const second = sorted.filter(r => r !== cheapest).reduce((min, r) =>
      r.totalPrice < min.totalPrice ? r : min, sorted[1]);
    if (second) second.tags.push("Cheapest");
  }

  // Fastest
  const fastest = sorted.reduce((min, r) =>
    r.estimatedTotalMinutes < min.estimatedTotalMinutes ? r : min);
  if (!fastest.tags.includes("Recommended") && !fastest.tags.includes("Cheapest")) {
    fastest.tags.push("Fastest");
  } else {
    const nextFastest = sorted
      .filter(r => r !== fastest)
      .reduce((min, r) =>
        r.estimatedTotalMinutes < min.estimatedTotalMinutes ? r : min, sorted[1]);
    if (nextFastest && !nextFastest.tags.includes("Recommended") && !nextFastest.tags.includes("Cheapest")) {
      nextFastest.tags.push("Fastest");
    }
  }

  // Adventure = most legs, only if 3+
  const adventure = sorted.reduce((best, r) => r.legs.length > best.legs.length ? r : best);
  if (
    adventure.legs.length > 2 &&
    !adventure.tags.includes("Cheapest") &&
    !adventure.tags.includes("Fastest") &&
    !adventure.tags.includes("Recommended")
  ) {
    adventure.tags.push("Adventure route");
  }

  return sorted;
}

// ── Debug trace type ─────────────────────────────────────────────────────

export type ExplainTrace = {
  steps: ExplainStep[];
  summary: {
    candidatePaths: number;
    uniqueEdges: number;
    edgesPriced: number;
    edgesMissing: number;
    routesAssembled: number;
    routesDeduplicated: number;
    routesReturned: number;
    wallTimeMs: number;
  };
};

export type ExplainStep = {
  step: string;
  detail: string;
  data?: unknown;
};

// ── Main search function ─────────────────────────────────────────────────

type SearchParams = {
  fromCity: string;
  fromAirport: string;
  targetCity: string;
  targetAirport: string;
  nationality: string;
  departMonth: string; // YYYY-MM
  deadlineDate: string; // ISO date for calculating departure date
  flexDays: number; // days of flexibility before deadline
  longLandTransport?: boolean; // user willing to take 16-30h overland legs
};

export async function searchRoutes(params: SearchParams): Promise<RouteOption[]> {
  const { routes } = await _searchRoutesInternal(params, false);
  return routes;
}

export async function searchRoutesWithExplain(params: SearchParams): Promise<{ routes: RouteOption[]; explain: ExplainTrace }> {
  return _searchRoutesInternal(params, true) as Promise<{ routes: RouteOption[]; explain: ExplainTrace }>;
}

async function _searchRoutesInternal(params: SearchParams, explain: boolean): Promise<{ routes: RouteOption[]; explain?: ExplainTrace }> {
  const { fromAirport, targetAirport, nationality, departMonth, deadlineDate, flexDays, longLandTransport } = params;
  const t0 = Date.now();
  const steps: ExplainStep[] = [];
  function trace(step: string, detail: string, data?: unknown) {
    if (explain) steps.push({ step, detail, data });
  }

  // ── Step 1: Compute dates ──────────────────────────────────────────────
  // Flight departure = deadline - 2 days (buffer for travel time)
  // flexDays controls ground travel budget only
  const deadline = new Date(deadlineDate);
  const flightDepartDate = new Date(deadline);
  flightDepartDate.setDate(flightDepartDate.getDate() - 2);
  const fallbackDepartDate = flightDepartDate.toISOString().split("T")[0];

  // Ground travel time budget:
  // Default: max 16h — covers DLI→SGN 7h, DLI→PNH 11h, VTE→BKK 10h, KUL↔SIN 5h
  // Long land transport: max 30h — adds DLI→BKK 25h, DLI→HAN 29h, but not 35h+ treks
  const groundCapMinutes = longLandTransport ? 30 * 60 : 16 * 60;
  const maxGroundMinutes = Math.min(flexDays * 120, groundCapMinutes);

  // Destination set
  const destinationAirports: string[] =
    targetAirport && targetAirport.length > 0
      ? [targetAirport]
      : EU_SEARCH_AIRPORTS;
  const destApiCodes = new Set(destinationAirports.map(a => apiCode(a)));

  trace("1_dates", `deadline=${deadlineDate}, fallbackDepart=${fallbackDepartDate}, maxGroundMin=${maxGroundMinutes}, departMonth=${departMonth}`, {
    deadlineDate,
    fallbackDepartDate,
    maxGroundMinutes,
    flexDays,
    departMonth,
    destinations: [...destApiCodes],
  });

  // ── Step 2: Ground reachability — find all start airports ──────────────
  const { paths: groundPaths, filtered: groundFiltered } = computeGroundReachable(fromAirport, maxGroundMinutes);

  // Start airports: origin itself + all ground-reachable airports
  type StartPoint = {
    airport: string;
    groundLegs: GroundConnection[];
    groundMinutes: number;
    groundPrice: number;
  };

  const startPoints: StartPoint[] = [
    { airport: fromAirport, groundLegs: [], groundMinutes: 0, groundPrice: 0 },
    ...groundPaths.map(gp => ({
      airport: gp.airport,
      groundLegs: gp.legs,
      groundMinutes: gp.totalMinutes,
      groundPrice: gp.totalPrice,
    })),
  ];

  trace("2_ground_reachability", `Origin ${fromAirport} (${AIRPORT_CITY[fromAirport] ?? fromAirport}). Ground budget: ${Math.round(maxGroundMinutes / 60)}h. Found ${groundPaths.length} ground-reachable airports.`, {
    origin: fromAirport,
    originCountry: AIRPORT_COUNTRY[fromAirport],
    startAirports: startPoints.map(sp => ({
      airport: sp.airport,
      city: AIRPORT_CITY[sp.airport] ?? sp.airport,
      groundRoute: sp.groundLegs.map(g => `${g.fromCode}→${g.toCode} (${g.transport}, ${formatDuration(g.durationMinutes)}, $${g.price}${g.note.startsWith("Estimated") ? " — estimated" : ""})`),
      totalGroundMinutes: sp.groundMinutes,
      totalGroundPrice: sp.groundPrice,
    })),
    filtered: groundFiltered,
  });

  // ── Step 3-5: Layered graph exploration ────────────────────────────────
  // Collect all candidate paths and unique flight edges to price

  const candidatePaths: CandidatePath[] = [];
  const edgesToPrice = new Set<string>(); // "FROM-TO" in API codes

  function addEdge(from: string, to: string) {
    edgesToPrice.add(`${apiCode(from)}-${apiCode(to)}`);
  }

  // Layer 1: start airports → their flight neighbors
  const layer1Hubs = new Set<string>(); // non-EU airports reached at layer 1
  let layer1DirectCount = 0;

  for (const sp of startPoints) {
    const neighbors = getFlightNeighbors(sp.airport);

    for (const neighbor of neighbors) {
      // Skip if same as origin or in ground path
      if (neighbor === fromAirport) continue;
      if (sp.groundLegs.some(g => g.toCode === neighbor || g.fromCode === neighbor)) continue;

      const neighborApi = apiCode(neighbor);

      // Check if neighbor is an EU destination we want
      if (destApiCodes.has(neighborApi)) {
        // 1-flight route!
        layer1DirectCount++;
        addEdge(sp.airport, neighbor);
        candidatePaths.push({
          groundLegs: sp.groundLegs,
          groundTotalMinutes: sp.groundMinutes,
          groundTotalPrice: sp.groundPrice,
          flightEdges: [{ from: sp.airport, to: neighbor }],
        });
      }

      // Collect as hub for layer 2 (if not EU)
      if (!isEuAirport(neighbor)) {
        layer1Hubs.add(neighbor);
        addEdge(sp.airport, neighbor);
      }
    }
  }

  trace("3_layer1", `Layer 1: ${startPoints.length} start airports → ${layer1Hubs.size} transit hubs + ${layer1DirectCount} direct-to-EU paths.`, {
    directToEU: layer1DirectCount,
    transitHubs: [...layer1Hubs].map(h => `${h} (${AIRPORT_CITY[h] ?? h})`),
    startNeighbors: startPoints.map(sp => ({
      from: `${sp.airport} (${AIRPORT_CITY[sp.airport] ?? sp.airport})`,
      flightNeighbors: getFlightNeighbors(sp.airport).map(n => `${n} (${AIRPORT_CITY[n] ?? n})${isEuAirport(n) ? " [EU]" : ""}`),
    })),
  });

  // Layer 2: layer-1 hubs → their flight neighbors
  const layer2Hubs = new Set<string>();
  let layer2RouteCount = 0;

  for (const hub1 of layer1Hubs) {
    const neighbors = getFlightNeighbors(hub1);

    for (const neighbor of neighbors) {
      if (neighbor === fromAirport) continue;
      if (layer1Hubs.has(neighbor) && neighbor === hub1) continue;

      const neighborApi = apiCode(neighbor);

      if (destApiCodes.has(neighborApi)) {
        // 2-flight route: each startPoint → hub1 → neighbor(EU)
        addEdge(hub1, neighbor);
        for (const sp of startPoints) {
          // Verify sp.airport → hub1 edge exists
          const spNeighbors = getFlightNeighbors(sp.airport);
          if (!spNeighbors.includes(hub1)) continue;
          if (sp.groundLegs.some(g => g.toCode === hub1)) continue;
          if (hub1 === sp.airport) continue;

          layer2RouteCount++;
          candidatePaths.push({
            groundLegs: sp.groundLegs,
            groundTotalMinutes: sp.groundMinutes,
            groundTotalPrice: sp.groundPrice,
            flightEdges: [
              { from: sp.airport, to: hub1 },
              { from: hub1, to: neighbor },
            ],
          });
        }
      }

      // Collect non-EU, non-layer1 airports as layer 2 hubs
      if (!isEuAirport(neighbor) && !layer1Hubs.has(neighbor) && neighbor !== fromAirport) {
        layer2Hubs.add(neighbor);
        addEdge(hub1, neighbor);
      }
    }
  }

  trace("4_layer2", `Layer 2: ${layer1Hubs.size} L1 hubs → ${layer2Hubs.size} L2 hubs + ${layer2RouteCount} 2-flight paths.`, {
    twoFlightPaths: layer2RouteCount,
    layer2Hubs: [...layer2Hubs].map(h => `${h} (${AIRPORT_CITY[h] ?? h})`),
  });

  // Layer 3: layer-2 hubs → EU destinations only (terminal)
  let layer3RouteCount = 0;
  for (const hub2 of layer2Hubs) {
    const neighbors = getFlightNeighbors(hub2);

    for (const neighbor of neighbors) {
      const neighborApi = apiCode(neighbor);
      if (!destApiCodes.has(neighborApi)) continue;

      addEdge(hub2, neighbor);

      // 3-flight route: each startPoint → some hub1 → hub2 → neighbor(EU)
      for (const sp of startPoints) {
        const spNeighbors = getFlightNeighbors(sp.airport);

        for (const hub1 of layer1Hubs) {
          if (hub1 === sp.airport || hub1 === hub2) continue;
          if (!spNeighbors.includes(hub1)) continue;
          if (sp.groundLegs.some(g => g.toCode === hub1)) continue;

          // Verify hub1 → hub2 edge exists
          const hub1Neighbors = getFlightNeighbors(hub1);
          if (!hub1Neighbors.includes(hub2)) continue;

          // Cycle check
          const visited = new Set([sp.airport, hub1, hub2, neighbor]);
          if (visited.size < 4) continue; // means a duplicate

          layer3RouteCount++;
          candidatePaths.push({
            groundLegs: sp.groundLegs,
            groundTotalMinutes: sp.groundMinutes,
            groundTotalPrice: sp.groundPrice,
            flightEdges: [
              { from: sp.airport, to: hub1 },
              { from: hub1, to: hub2 },
              { from: hub2, to: neighbor },
            ],
          });
        }
      }
    }
  }

  trace("5_layer3", `Layer 3: ${layer2Hubs.size} L2 hubs → EU only. ${layer3RouteCount} 3-flight paths. Total candidate paths: ${candidatePaths.length}.`, {
    threeFlightPaths: layer3RouteCount,
    totalCandidates: candidatePaths.length,
  });

  // ── Step 6: Parallel price fetching with shared cache ──────────────────
  const edgeArray = [...edgesToPrice];
  console.log(`[route-engine] Fetching prices for ${edgeArray.length} unique edges`);

  const priceResults = await Promise.all(
    edgeArray.map(async (edge) => {
      const [from, to] = edge.split("-");
      const result = await fetchPriceWithFallback(from, to, departMonth);
      return { edge, result };
    })
  );

  const priceMap = new Map<string, SegmentPriceResult>();
  const missingEdges: string[] = [];
  for (const { edge, result } of priceResults) {
    if (result) priceMap.set(edge, result);
    else missingEdges.push(edge);
  }

  trace("6_pricing", `Fetched ${edgeArray.length} unique edges. ${priceMap.size} priced, ${missingEdges.length} missing.`, {
    totalEdges: edgeArray.length,
    priced: priceMap.size,
    missing: missingEdges,
    prices: explain ? Object.fromEntries([...priceMap.entries()].map(([k, v]) => [k, {
      price: v.price,
      airline: `${v.airline} (${v.airlineFullName})`,
      departDate: v.departDate ?? null,
      source: FIFTH_FREEDOM_ROUTES[k] ? "fifth_freedom" : FALLBACK_FLIGHT_PRICES[k] ? "fallback" : "api",
    }])) : undefined,
  });

  // ── Step 7: Assemble routes ────────────────────────────────────────────
  const routes: RouteOption[] = [];
  const seenIds = new Set<string>();
  let droppedNoPrice = 0;
  let droppedNoDuration = 0;
  let droppedBuildFail = 0;
  let droppedDuplicate = 0;

  for (const path of candidatePaths) {
    // Verify all edges have prices
    const allPriced = path.flightEdges.every(e =>
      priceMap.has(`${apiCode(e.from)}-${apiCode(e.to)}`)
    );
    if (!allPriced) { droppedNoPrice++; continue; }

    // Verify all edges have segment durations
    const allDurations = path.flightEdges.every(e =>
      getSegmentDuration(apiCode(e.from), apiCode(e.to)) !== null
    );
    if (!allDurations) { droppedNoDuration++; continue; }

    const route = buildRouteFromEdges(
      path,
      priceMap,
      nationality,
      deadlineDate,
      departMonth,
      fallbackDepartDate,
    );
    if (!route) { droppedBuildFail++; continue; }

    // Deduplicate by ID
    if (seenIds.has(route.id)) { droppedDuplicate++; continue; }
    seenIds.add(route.id);

    routes.push(route);
  }

  trace("7_assembly", `Assembled ${routes.length} routes from ${candidatePaths.length} candidates. Dropped: ${droppedNoPrice} no-price, ${droppedNoDuration} no-duration, ${droppedBuildFail} build-fail, ${droppedDuplicate} duplicate.`, {
    assembled: routes.length,
    candidates: candidatePaths.length,
    dropped: { noPrice: droppedNoPrice, noDuration: droppedNoDuration, buildFail: droppedBuildFail, duplicate: droppedDuplicate },
  });

  // ── Step 8: Score, sort, cap ───────────────────────────────────────────
  const sorted = scoreAndSort(routes);
  const final = sorted.slice(0, 25);

  trace("8_scoring", `Scored and sorted ${routes.length} routes. Returning top ${final.length}.`, {
    topRoutes: final.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      path: r.legs.map(l => l.fromCode).join("→") + "→" + r.legs[r.legs.length - 1].toCode,
      price: r.totalPrice,
      time: r.estimatedTotalDuration,
      tags: r.tags,
      departureDate: r.departureDate,
    })),
  });

  // Check for fifth-freedom routes in results
  const fifthFreedomInResults = final.filter(r =>
    r.tags.some(t => t.includes("5th freedom"))
  );
  if (fifthFreedomInResults.length > 0) {
    trace("8b_fifth_freedom", `${fifthFreedomInResults.length} route(s) use fifth-freedom flights.`, {
      routes: fifthFreedomInResults.map(r => ({
        id: r.id,
        path: r.legs.map(l => l.fromCode).join("→") + "→" + r.legs[r.legs.length - 1].toCode,
      })),
    });
  }

  const wallTimeMs = Date.now() - t0;

  const explainTrace: ExplainTrace | undefined = explain ? {
    steps,
    summary: {
      candidatePaths: candidatePaths.length,
      uniqueEdges: edgeArray.length,
      edgesPriced: priceMap.size,
      edgesMissing: missingEdges.length,
      routesAssembled: routes.length,
      routesDeduplicated: droppedDuplicate,
      routesReturned: final.length,
      wallTimeMs,
    },
  } : undefined;

  return { routes: final, explain: explainTrace };
}
