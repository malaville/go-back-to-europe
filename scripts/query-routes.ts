#!/usr/bin/env npx tsx
// ---------------------------------------------------------------------------
// Query 20 routes locally and report metadata (API calls, tier counts, etc.)
// Usage: npx tsx scripts/query-routes.ts
// ---------------------------------------------------------------------------

import { searchRoutes } from "../src/lib/route-engine";

const TODAY = "2026-03-07";

type Query = {
  label: string;
  fromCity: string;
  fromAirport: string;
  targetCity: string;
  targetAirport: string;
  nationality: string;
  deadlineDate: string;
  flexDays: number;
  longLandTransport: boolean;
};

const queries: Query[] = [
  { label: "Bali→London GB flex=3 ASAP",          fromCity: "Bali",           fromAirport: "DPS", targetCity: "London",            targetAirport: "LHR", nationality: "GB", deadlineDate: "2026-03-10", flexDays: 3,  longLandTransport: false },
  { label: "Koh Tao→Berlin DE flex=7 +14d",       fromCity: "Koh Tao",        fromAirport: "USM", targetCity: "Berlin",            targetAirport: "BER", nationality: "DE", deadlineDate: "2026-03-21", flexDays: 7,  longLandTransport: false },
  { label: "Da Lat→Paris FR flex=7 +14d",         fromCity: "Da Lat",         fromAirport: "DLI", targetCity: "Paris",             targetAirport: "CDG", nationality: "FR", deadlineDate: "2026-03-21", flexDays: 7,  longLandTransport: false },
  { label: "Vientiane→Helsinki FI flex=3 +7d",    fromCity: "Vientiane",      fromAirport: "VTE", targetCity: "Helsinki",          targetAirport: "HEL", nationality: "FI", deadlineDate: "2026-03-14", flexDays: 3,  longLandTransport: false },
  { label: "Bangkok→Amsterdam NL flex=7 +30d",    fromCity: "Bangkok",        fromAirport: "BKK", targetCity: "Amsterdam",         targetAirport: "AMS", nationality: "NL", deadlineDate: "2026-04-06", flexDays: 7,  longLandTransport: false },
  { label: "Chiang Mai→Barcelona ES flex=5 +14d", fromCity: "Chiang Mai",     fromAirport: "CNX", targetCity: "Barcelona",         targetAirport: "BCN", nationality: "ES", deadlineDate: "2026-03-21", flexDays: 5,  longLandTransport: false },
  { label: "Singapore→Rome IT flex=7 +7d",        fromCity: "Singapore",      fromAirport: "SIN", targetCity: "Rome",              targetAirport: "FCO", nationality: "IT", deadlineDate: "2026-03-14", flexDays: 7,  longLandTransport: false },
  { label: "Phuket→Warsaw PL flex=3 +30d",        fromCity: "Phuket",         fromAirport: "HKT", targetCity: "Warsaw",            targetAirport: "WAW", nationality: "PL", deadlineDate: "2026-04-06", flexDays: 3,  longLandTransport: false },
  { label: "Phnom Penh→Brussels BE flex=7 ASAP",   fromCity: "Phnom Penh",     fromAirport: "PNH", targetCity: "Brussels",          targetAirport: "BRU", nationality: "BE", deadlineDate: "2026-03-10", flexDays: 7,  longLandTransport: false },
  { label: "Manila→Dublin IE flex=5 +14d",        fromCity: "Manila",         fromAirport: "MNL", targetCity: "Dublin",            targetAirport: "DUB", nationality: "IE", deadlineDate: "2026-03-21", flexDays: 5,  longLandTransport: false },
  { label: "HCMC→Budapest HU flex=7 +7d",         fromCity: "Ho Chi Minh City", fromAirport: "SGN", targetCity: "Budapest",        targetAirport: "BUD", nationality: "HU", deadlineDate: "2026-03-14", flexDays: 7,  longLandTransport: false },
  { label: "Hanoi→Stockholm SE flex=3 +14d",      fromCity: "Hanoi",          fromAirport: "HAN", targetCity: "Stockholm",         targetAirport: "ARN", nationality: "SE", deadlineDate: "2026-03-21", flexDays: 3,  longLandTransport: false },
  { label: "Koh Samui→Prague CZ flex=7 +7d",      fromCity: "Koh Samui",      fromAirport: "USM", targetCity: "Prague",            targetAirport: "PRG", nationality: "CZ", deadlineDate: "2026-03-14", flexDays: 7,  longLandTransport: false },
  { label: "KL→Lisbon PT flex=5 +30d",            fromCity: "Kuala Lumpur",   fromAirport: "KUL", targetCity: "Lisbon",            targetAirport: "LIS", nationality: "PT", deadlineDate: "2026-04-06", flexDays: 5,  longLandTransport: false },
  { label: "Bangkok→Anywhere FR flex=7 +14d",     fromCity: "Bangkok",        fromAirport: "BKK", targetCity: "Anywhere in Europe", targetAirport: "",   nationality: "FR", deadlineDate: "2026-03-21", flexDays: 7,  longLandTransport: false },
  { label: "Yangon→Vienna AT flex=7 +14d",        fromCity: "Yangon",         fromAirport: "RGN", targetCity: "Vienna",            targetAirport: "VIE", nationality: "AT", deadlineDate: "2026-03-21", flexDays: 7,  longLandTransport: false },
  { label: "Bali→Anywhere DE flex=3 +7d",         fromCity: "Bali",           fromAirport: "DPS", targetCity: "Anywhere in Europe", targetAirport: "",   nationality: "DE", deadlineDate: "2026-03-14", flexDays: 3,  longLandTransport: false },
  { label: "Vientiane→Copenhagen DK flex=7 +30d", fromCity: "Vientiane",      fromAirport: "VTE", targetCity: "Copenhagen",        targetAirport: "CPH", nationality: "DK", deadlineDate: "2026-04-06", flexDays: 7,  longLandTransport: true },
  { label: "Seoul→Lyon FR flex=5 +14d",           fromCity: "Seoul",          fromAirport: "ICN", targetCity: "Lyon",              targetAirport: "LYS", nationality: "FR", deadlineDate: "2026-03-21", flexDays: 5,  longLandTransport: false },
  { label: "Taipei→Athens GR flex=7 +30d",        fromCity: "Taipei",         fromAirport: "TPE", targetCity: "Athens",            targetAirport: "ATH", nationality: "GR", deadlineDate: "2026-04-06", flexDays: 7,  longLandTransport: false },
];

async function main() {
  const rows: string[][] = [];

  for (const q of queries) {
    const { routes, metadata } = await searchRoutes({
      ...q,
      today: TODAY,
    });

    const cheapest = routes.length > 0
      ? `€${Math.min(...routes.map(r => r.totalPrice))}`
      : "—";

    rows.push([
      q.label,
      String(metadata.routesReturned),
      String(metadata.preferredCount),
      String(metadata.extendedCount),
      String(metadata.uniqueEdges),
      String(metadata.apiCalls),
      `${metadata.cheapCalls}/${metadata.latestCalls}`,
      String(metadata.fallbackHits),
      cheapest,
      `${metadata.wallTimeMs}ms`,
    ]);
  }

  // Print table
  const headers = ["Query", "Routes", "Pref", "Ext", "Edges", "API calls", "cheap/latest", "Fallback", "Cheapest", "Time"];
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)));

  const line = (cols: string[]) => cols.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.log(line(headers));
  console.log(widths.map(w => "─".repeat(w)).join("──"));
  for (const row of rows) {
    console.log(line(row));
  }

  // Totals
  const totalApiCalls = rows.reduce((s, r) => s + Number(r[5]), 0);
  const totalRoutes = rows.reduce((s, r) => s + Number(r[1]), 0);
  console.log(widths.map(w => "─".repeat(w)).join("──"));
  console.log(`Total: ${totalRoutes} routes across ${queries.length} queries, ${totalApiCalls} API calls`);
}

main().catch(console.error);
