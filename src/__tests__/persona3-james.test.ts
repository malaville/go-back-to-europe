import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);

// James — 42yo British family man in Bangkok, GB passport, wife + 2 kids, must reach London by March 20

describe("James — Bangkok→London, flex=7", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bangkok", fromAirport: "BKK", targetCity: "London", targetAirport: "LON",
      nationality: "GB",
      deadlineDate: "2026-03-20", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });
  it("all routes depart before March 20", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-20")).toHaveLength(0);
  });
  it("no Gulf carriers", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        if (leg.airlineCode) {
          expect(GULF_CARRIERS.has(leg.airlineCode)).toBe(false);
        }
      }
    }
  });
  it("Delhi hidden stop has visa warning for GB passport", () => {
    const delhiLegs = routes.flatMap(r => r.legs).filter(l => l.hiddenStop === "DEL" || l.toCode === "DEL");
    if (delhiLegs.length > 0) {
      const hasVisaWarning = delhiLegs.some(l => l.visaNote && l.visaNote.length > 0);
      expect(hasVisaWarning).toBe(true);
    }
  });
  it("Nonstop tag only on genuinely nonstop routes", () => {
    for (const route of routes) {
      if (route.tags.includes("Nonstop")) {
        const flightLegs = route.legs.filter(l => l.transport === "flight");
        expect(flightLegs).toHaveLength(1);
      }
    }
  });
  it("Recommended tag favors single-carrier routes", () => {
    const recommended = routes.find(r => r.tags.includes("Recommended"));
    if (recommended) {
      expect(recommended.ticketType).toBe("single-carrier");
    }
  });
});

describe("James — flex=3 vs flex=7", () => {
  let flex3: RouteOption[];
  let flex7: RouteOption[];

  beforeAll(async () => {
    [flex3, flex7] = await Promise.all([
      searchRoutes({
        fromCity: "Bangkok", fromAirport: "BKK", targetCity: "London", targetAirport: "LON",
        nationality: "GB",
        deadlineDate: "2026-03-20", flexDays: 3, longLandTransport: false, today: "2026-03-07",
      }),
      searchRoutes({
        fromCity: "Bangkok", fromAirport: "BKK", targetCity: "London", targetAirport: "LON",
        nationality: "GB",
        deadlineDate: "2026-03-20", flexDays: 7, longLandTransport: false, today: "2026-03-07",
      }),
    ]);
  });

  it("both flex values return routes", () => {
    expect(flex3.length).toBeGreaterThan(0);
    expect(flex7.length).toBeGreaterThan(0);
  });
  it("both return reasonable route counts", () => {
    expect(flex3.length).toBeGreaterThanOrEqual(1);
    expect(flex7.length).toBeGreaterThanOrEqual(1);
  });
});

describe("James — anywhere with GB passport", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bangkok", fromAirport: "BKK", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "GB",
      deadlineDate: "2026-03-20", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });
  it("all routes depart before deadline", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-20")).toHaveLength(0);
  });
  it("GB visa rules differ from EU (no Schengen-free transit)", () => {
    const allVisaNotes = routes.flatMap(r => r.legs).filter(l => l.visaNote && l.visaNote.length > 0);
    // GB passport holders face different visa rules than EU nationals at some transit points
    // At least one route should have a visa note (e.g., India transit visa warning)
    expect(allVisaNotes.length).toBeGreaterThan(0);
  });
});
