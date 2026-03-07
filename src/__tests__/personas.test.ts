// ---------------------------------------------------------------------------
// Persona-based regression tests — SkipTheGulf route engine
//
// Each test records a snapshot of real Travelpayouts API responses via MSW.
// First run:  RECORD_FIXTURES=1 npm test   (hits real APIs, saves fixtures)
// Later runs: npm test                     (replays from fixtures)
// ---------------------------------------------------------------------------

import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

// Helper: compute departMonth from deadline + flex (same logic as API routes)
function departMonth(deadline: string, flex: number): string {
  const d = new Date(deadline);
  d.setDate(d.getDate() - flex);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Persona 1: Joris — Dutch backpacker in Bali ──────────────────────────

describe("Persona 1: Joris — Bali→Amsterdam, NL passport, deadline March 17", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bali",
      fromAirport: "DPS",
      targetCity: "Amsterdam",
      targetAirport: "AMS",
      nationality: "NL",
      departMonth: departMonth("2026-03-17", 7),
      deadlineDate: "2026-03-17",
      flexDays: 7,
      longLandTransport: false,
    });
  });

  it("returns routes", () => {
    throw new Error("TODO");
  });

  it("all routes depart before the deadline (March 17)", () => {
    throw new Error("TODO");
  });

  it("no Gulf airline codes in any leg", () => {
    throw new Error("TODO");
  });

  it("all routes start from a gateway (DPS has no direct Europe flights)", () => {
    throw new Error("TODO");
  });

  it("no visa=unknown for NL passport", () => {
    throw new Error("TODO");
  });

  it("Nonstop tag only on genuinely nonstop routes", () => {
    throw new Error("TODO");
  });
});

describe("Persona 1: Joris — flex=3 vs flex=7 should produce different results", () => {
  let flex3: RouteOption[];
  let flex7: RouteOption[];

  beforeAll(async () => {
    [flex3, flex7] = await Promise.all([
      searchRoutes({
        fromCity: "Bali",
        fromAirport: "DPS",
        targetCity: "Amsterdam",
        targetAirport: "AMS",
        nationality: "NL",
        departMonth: departMonth("2026-03-17", 3),
        deadlineDate: "2026-03-17",
        flexDays: 3,
        longLandTransport: false,
      }),
      searchRoutes({
        fromCity: "Bali",
        fromAirport: "DPS",
        targetCity: "Amsterdam",
        targetAirport: "AMS",
        nationality: "NL",
        departMonth: departMonth("2026-03-17", 7),
        deadlineDate: "2026-03-17",
        flexDays: 7,
        longLandTransport: false,
      }),
    ]);
  });

  it("different flex values produce different route sets", () => {
    throw new Error("TODO");
  });
});

describe("Persona 1: Joris — land=1 unlocks longer ground transport", () => {
  let withLand: RouteOption[];
  let withoutLand: RouteOption[];

  beforeAll(async () => {
    [withLand, withoutLand] = await Promise.all([
      searchRoutes({
        fromCity: "Bali",
        fromAirport: "DPS",
        targetCity: "Amsterdam",
        targetAirport: "AMS",
        nationality: "NL",
        departMonth: departMonth("2026-03-17", 7),
        deadlineDate: "2026-03-17",
        flexDays: 7,
        longLandTransport: true,
      }),
      searchRoutes({
        fromCity: "Bali",
        fromAirport: "DPS",
        targetCity: "Amsterdam",
        targetAirport: "AMS",
        nationality: "NL",
        departMonth: departMonth("2026-03-17", 7),
        deadlineDate: "2026-03-17",
        flexDays: 7,
        longLandTransport: false,
      }),
    ]);
  });

  it("land=1 produces different or additional routes vs land=0", () => {
    throw new Error("TODO");
  });
});

describe("Persona 1: Joris — 'anywhere in Europe'", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bali",
      fromAirport: "DPS",
      targetCity: "Anywhere in Europe",
      targetAirport: "",
      nationality: "NL",
      departMonth: departMonth("2026-03-17", 7),
      deadlineDate: "2026-03-17",
      flexDays: 7,
      longLandTransport: false,
    });
  });

  it("returns routes to multiple European cities", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline", () => {
    throw new Error("TODO");
  });
});

// ── Persona 2: Sanna — Finnish remote worker in Vientiane ────────────────

describe("Persona 2: Sanna — Vientiane→Helsinki, FI passport, deadline March 12 (urgent)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Vientiane",
      fromAirport: "VTE",
      targetCity: "Helsinki",
      targetAirport: "HEL",
      nationality: "FI",
      departMonth: departMonth("2026-03-12", 3),
      deadlineDate: "2026-03-12",
      flexDays: 3,
      longLandTransport: false,
    });
  });

  it("returns routes", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline (March 12)", () => {
    throw new Error("TODO");
  });

  it("all routes end in Helsinki", () => {
    throw new Error("TODO");
  });

  it("no Gulf carriers", () => {
    throw new Error("TODO");
  });

  it("routes go through a gateway (BKK or HAN) — VTE has no direct Europe flights", () => {
    throw new Error("TODO");
  });
});

describe("Persona 2: Sanna — flex=7 opens more gateways", () => {
  let flex3: RouteOption[];
  let flex7: RouteOption[];

  beforeAll(async () => {
    [flex3, flex7] = await Promise.all([
      searchRoutes({
        fromCity: "Vientiane",
        fromAirport: "VTE",
        targetCity: "Helsinki",
        targetAirport: "HEL",
        nationality: "FI",
        departMonth: departMonth("2026-03-12", 3),
        deadlineDate: "2026-03-12",
        flexDays: 3,
        longLandTransport: false,
      }),
      searchRoutes({
        fromCity: "Vientiane",
        fromAirport: "VTE",
        targetCity: "Helsinki",
        targetAirport: "HEL",
        nationality: "FI",
        departMonth: departMonth("2026-03-12", 7),
        deadlineDate: "2026-03-12",
        flexDays: 7,
        longLandTransport: false,
      }),
    ]);
  });

  it("flex=7 produces different results than flex=3", () => {
    throw new Error("TODO");
  });
});

describe("Persona 2: Sanna — 'anywhere' (maybe Stockholm is easier)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Vientiane",
      fromAirport: "VTE",
      targetCity: "Anywhere in Europe",
      targetAirport: "",
      nationality: "FI",
      departMonth: departMonth("2026-03-12", 7),
      deadlineDate: "2026-03-12",
      flexDays: 7,
      longLandTransport: false,
    });
  });

  it("returns routes to multiple European cities", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline", () => {
    throw new Error("TODO");
  });
});

// ── Persona 3: James — British family in Bangkok ─────────────────────────

describe("Persona 3: James — Bangkok→London, GB passport, deadline March 20", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bangkok",
      fromAirport: "BKK",
      targetCity: "London",
      targetAirport: "LON",
      nationality: "GB",
      departMonth: departMonth("2026-03-20", 7),
      deadlineDate: "2026-03-20",
      flexDays: 7,
      longLandTransport: false,
    });
  });

  it("returns routes", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline (March 20)", () => {
    throw new Error("TODO");
  });

  it("no Gulf carriers", () => {
    throw new Error("TODO");
  });

  it("Delhi hidden stop has visa warning for GB passport", () => {
    throw new Error("TODO");
  });

  it("Nonstop tag only on genuinely nonstop routes", () => {
    throw new Error("TODO");
  });

  it("Recommended tag favors single-carrier routes", () => {
    throw new Error("TODO");
  });
});

describe("Persona 3: James — flex=3 vs flex=7", () => {
  let flex3: RouteOption[];
  let flex7: RouteOption[];

  beforeAll(async () => {
    [flex3, flex7] = await Promise.all([
      searchRoutes({
        fromCity: "Bangkok",
        fromAirport: "BKK",
        targetCity: "London",
        targetAirport: "LON",
        nationality: "GB",
        departMonth: departMonth("2026-03-20", 3),
        deadlineDate: "2026-03-20",
        flexDays: 3,
        longLandTransport: false,
      }),
      searchRoutes({
        fromCity: "Bangkok",
        fromAirport: "BKK",
        targetCity: "London",
        targetAirport: "LON",
        nationality: "GB",
        departMonth: departMonth("2026-03-20", 7),
        deadlineDate: "2026-03-20",
        flexDays: 7,
        longLandTransport: false,
      }),
    ]);
  });

  it("flex values produce different results (BKK is already a hub, so may be similar)", () => {
    throw new Error("TODO");
  });
});

describe("Persona 3: James — 'anywhere' with GB passport", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bangkok",
      fromAirport: "BKK",
      targetCity: "Anywhere in Europe",
      targetAirport: "",
      nationality: "GB",
      departMonth: departMonth("2026-03-20", 7),
      deadlineDate: "2026-03-20",
      flexDays: 7,
      longLandTransport: false,
    });
  });

  it("returns routes to multiple European cities", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline", () => {
    throw new Error("TODO");
  });

  it("GB visa rules differ from EU (no Schengen-free transit)", () => {
    throw new Error("TODO");
  });
});

// ── Persona 4: Lea — French backpacker in Da Lat ─────────────────────────

describe("Persona 4: Lea — Da Lat→Paris, FR passport, deadline March 25", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Da Lat",
      fromAirport: "DLI",
      targetCity: "Paris",
      targetAirport: "PAR",
      nationality: "FR",
      departMonth: departMonth("2026-03-25", 7),
      deadlineDate: "2026-03-25",
      flexDays: 7,
      longLandTransport: false,
    });
  });

  it("returns routes", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline (March 25) — no April/May/July departures", () => {
    throw new Error("TODO");
  });

  it("no Gulf carriers", () => {
    throw new Error("TODO");
  });

  it("routes include ground transport to gateway (DLI→SGN bus)", () => {
    throw new Error("TODO");
  });

  it("per-leg booking links differ across routes", () => {
    throw new Error("TODO");
  });
});

describe("Persona 4: Lea — flex=3 should block 7h DLI→SGN bus (6h max)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Da Lat",
      fromAirport: "DLI",
      targetCity: "Paris",
      targetAirport: "PAR",
      nationality: "FR",
      departMonth: departMonth("2026-03-25", 3),
      deadlineDate: "2026-03-25",
      flexDays: 3,
      longLandTransport: false,
    });
  });

  it("no ground legs exceeding 6h (flex=3 cap)", () => {
    throw new Error("TODO");
  });
});

describe("Persona 4: Lea — land=1 enables longer ground transport", () => {
  let withLand: RouteOption[];
  let withoutLand: RouteOption[];

  beforeAll(async () => {
    [withLand, withoutLand] = await Promise.all([
      searchRoutes({
        fromCity: "Da Lat",
        fromAirport: "DLI",
        targetCity: "Paris",
        targetAirport: "PAR",
        nationality: "FR",
        departMonth: departMonth("2026-03-25", 7),
        deadlineDate: "2026-03-25",
        flexDays: 7,
        longLandTransport: true,
      }),
      searchRoutes({
        fromCity: "Da Lat",
        fromAirport: "DLI",
        targetCity: "Paris",
        targetAirport: "PAR",
        nationality: "FR",
        departMonth: departMonth("2026-03-25", 7),
        deadlineDate: "2026-03-25",
        flexDays: 7,
        longLandTransport: false,
      }),
    ]);
  });

  it("land=1 returns routes", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline", () => {
    throw new Error("TODO");
  });

  it("land=1 produces different or additional routes vs land=0", () => {
    throw new Error("TODO");
  });
});

describe("Persona 4: Lea — gateway comparison BKK vs SIN", () => {
  let bkk: RouteOption[];
  let sin: RouteOption[];

  beforeAll(async () => {
    [bkk, sin] = await Promise.all([
      searchRoutes({
        fromCity: "Bangkok",
        fromAirport: "BKK",
        targetCity: "Paris",
        targetAirport: "PAR",
        nationality: "FR",
        departMonth: departMonth("2026-03-25", 7),
        deadlineDate: "2026-03-25",
        flexDays: 7,
        longLandTransport: false,
      }),
      searchRoutes({
        fromCity: "Singapore",
        fromAirport: "SIN",
        targetCity: "Paris",
        targetAirport: "PAR",
        nationality: "FR",
        departMonth: departMonth("2026-03-25", 7),
        deadlineDate: "2026-03-25",
        flexDays: 7,
        longLandTransport: false,
      }),
    ]);
  });

  it("both gateways return routes", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline", () => {
    throw new Error("TODO");
  });
});

describe("Persona 4: Lea — 'anywhere' with land=1 (maximum flexibility)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Da Lat",
      fromAirport: "DLI",
      targetCity: "Anywhere in Europe",
      targetAirport: "",
      nationality: "FR",
      departMonth: departMonth("2026-03-25", 7),
      deadlineDate: "2026-03-25",
      flexDays: 7,
      longLandTransport: true,
    });
  });

  it("returns routes to multiple European cities", () => {
    throw new Error("TODO");
  });

  it("all routes depart before deadline", () => {
    throw new Error("TODO");
  });
});
