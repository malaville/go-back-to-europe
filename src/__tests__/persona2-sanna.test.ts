import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);

// Sanna — 34yo Finnish remote worker in Vientiane, FI passport, father's emergency, must reach Helsinki by March 12

describe("Sanna — Vientiane→Helsinki, flex=3 (urgent)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Vientiane", fromAirport: "VTE", targetCity: "Helsinki", targetAirport: "HEL",
      nationality: "FI",
      deadlineDate: "2026-03-12", flexDays: 3, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns no routes (no VTE flights before March 12, bus exceeds 6h flex=3 cap)", () => {
    expect(routes).toHaveLength(0);
  });
  
  it("all routes depart before March 12", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-12")).toHaveLength(0);
  });
  it("all routes end in Helsinki", () => {
    for (const route of routes) {
      expect(route.legs[route.legs.length - 1].toCode).toBe("HEL");
    }
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
  it("routes go through a gateway (BKK or HAN)", () => {
    const gateways = new Set(["BKK", "HAN", "VTE"]);
    for (const route of routes) {
      expect(gateways.has(route.legs[0].fromCode)).toBe(true);
    }
  });
});

describe("Sanna — flex=3 vs flex=7", () => {
  let flex3: RouteOption[];
  let flex7: RouteOption[];

  beforeAll(async () => {
    [flex3, flex7] = await Promise.all([
      searchRoutes({
        fromCity: "Vientiane", fromAirport: "VTE", targetCity: "Helsinki", targetAirport: "HEL",
        nationality: "FI",
        deadlineDate: "2026-03-12", flexDays: 3, longLandTransport: false, today: "2026-03-07",
      }),
      searchRoutes({
        fromCity: "Vientiane", fromAirport: "VTE", targetCity: "Helsinki", targetAirport: "HEL",
        nationality: "FI",
        deadlineDate: "2026-03-12", flexDays: 7, longLandTransport: false, today: "2026-03-07",
      }),
    ]);
  });

  it("flex=7 produces different results than flex=3", () => {
    const ids3 = new Set(flex3.map(r => r.id));
    const ids7 = new Set(flex7.map(r => r.id));
    const same = flex3.length === flex7.length && [...ids3].every(id => ids7.has(id));
    expect(same).toBe(false);
  });
});

describe("Sanna — anywhere (maybe Stockholm is easier)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Vientiane", fromAirport: "VTE", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "FI",
      deadlineDate: "2026-03-12", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });
  it("all routes depart before deadline", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-12")).toHaveLength(0);
  });
});
