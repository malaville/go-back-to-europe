import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);

// Joris — 28yo Dutch backpacker in Bali, NL passport, must reach Amsterdam by March 17

describe("Joris — Bali→Amsterdam, flex=7", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bali", fromAirport: "DPS", targetCity: "Amsterdam", targetAirport: "AMS",
      nationality: "NL",
      deadlineDate: "2026-03-17", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });
  it("all routes depart before March 17", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-17")).toHaveLength(0);
  });
  it("no Gulf airline codes in any leg", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        if (leg.airlineCode) {
          expect(GULF_CARRIERS.has(leg.airlineCode)).toBe(false);
        }
      }
    }
  });
  it("all routes start from a gateway (SIN/KUL/BKK)", () => {
    const gateways = new Set(["SIN", "KUL", "BKK", "DPS"]);
    for (const route of routes) {
      expect(gateways.has(route.legs[0].fromCode)).toBe(true);
    }
  });
  it("no visa=unknown for NL passport", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        expect(leg.visaStatus).not.toBe("unknown");
      }
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
});

describe("Joris — flex=3 vs flex=7", () => {
  let flex3: RouteOption[];
  let flex7: RouteOption[];

  beforeAll(async () => {
    [flex3, flex7] = await Promise.all([
      searchRoutes({
        fromCity: "Bali", fromAirport: "DPS", targetCity: "Amsterdam", targetAirport: "AMS",
        nationality: "NL",
        deadlineDate: "2026-03-17", flexDays: 3, longLandTransport: false, today: "2026-03-07",
      }),
      searchRoutes({
        fromCity: "Bali", fromAirport: "DPS", targetCity: "Amsterdam", targetAirport: "AMS",
        nationality: "NL",
        deadlineDate: "2026-03-17", flexDays: 7, longLandTransport: false, today: "2026-03-07",
      }),
    ]);
  });

  it("different flex values produce different route sets", () => {
    const ids3 = new Set(flex3.map(r => r.id));
    const ids7 = new Set(flex7.map(r => r.id));
    const same = flex3.length === flex7.length && [...ids3].every(id => ids7.has(id));
    expect(same).toBe(false);
  });
});

describe("Joris — land=1 vs land=0", () => {
  let withLand: RouteOption[];
  let withoutLand: RouteOption[];

  beforeAll(async () => {
    [withLand, withoutLand] = await Promise.all([
      searchRoutes({
        fromCity: "Bali", fromAirport: "DPS", targetCity: "Amsterdam", targetAirport: "AMS",
        nationality: "NL",
        deadlineDate: "2026-03-17", flexDays: 7, longLandTransport: true, today: "2026-03-07",
      }),
      searchRoutes({
        fromCity: "Bali", fromAirport: "DPS", targetCity: "Amsterdam", targetAirport: "AMS",
        nationality: "NL",
        deadlineDate: "2026-03-17", flexDays: 7, longLandTransport: false, today: "2026-03-07",
      }),
    ]);
  });

  it("land=1 produces different or additional routes", () => {
    const idsWith = new Set(withLand.map(r => r.id));
    const idsWithout = new Set(withoutLand.map(r => r.id));
    const same = withLand.length === withoutLand.length && [...idsWith].every(id => idsWithout.has(id));
    expect(same).toBe(false);
  });
});

describe("Joris — anywhere in Europe", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Bali", fromAirport: "DPS", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "NL",
      deadlineDate: "2026-03-17", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });
  it("all routes depart before deadline", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-17")).toHaveLength(0);
  });
});
