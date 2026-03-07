import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);

// Lea — 25yo French backpacker in Da Lat, FR passport, flexible, must reach Paris by March 25

describe("Lea — Da Lat→Paris, flex=7", () => {
  let routes: RouteOption[];
  const today = new Date("2026-03-07");

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Paris", targetAirport: "PAR",
      nationality: "FR",
      deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes", () => {
    expect(routes.length).toBeGreaterThan(1);
  });

  it("all routes depart after today", () => {
    expect(routes.every(route => new Date(route.departureDate) >= today)).toBeTruthy();
  });

  it("all routes depart before March 25 — no April/May/July departures and after today", () => {
    expect(routes.filter(route => new Date(route.departureDate) >= new Date("2026-03-25"))).toHaveLength(0);
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
  it("routes include ground transport to gateway (DLI→SGN bus)", () => {
    const hasGroundLeg = routes.some(r =>
      r.legs.some(l => l.transport !== "flight" && l.fromCode === "DLI")
    );
    expect(hasGroundLeg).toBe(true);
  });


});

describe("Lea — flex=3 should block 7h DLI→SGN bus (6h max)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Paris", targetAirport: "PAR",
      nationality: "FR",
      deadlineDate: "2026-03-25", flexDays: 3, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("no ground legs exceeding 6h (flex=3 cap)", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight" && leg.durationMinutes) {
          expect(leg.durationMinutes).toBeLessThanOrEqual(360);
        }
      }
    }
  });
});

xdescribe("Lea — land=1 vs land=0", () => {
  let withLand: RouteOption[];
  let withoutLand: RouteOption[];

  beforeAll(async () => {
    [withLand, withoutLand] = await Promise.all([
      searchRoutes({
        fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Paris", targetAirport: "PAR",
        nationality: "FR",
        deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: true, today: "2026-03-07",
      }),
      searchRoutes({
        fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Paris", targetAirport: "PAR",
        nationality: "FR",
        deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: false, today: "2026-03-07",
      }),
    ]);
  });

  it("land=1 returns routes", () => {
    expect(withLand.length).toBeGreaterThan(0);
  });
  it("all routes depart before deadline", () => {
    expect(withLand.filter(r => r.departureDate > "2026-03-25")).toHaveLength(0);
    expect(withoutLand.filter(r => r.departureDate > "2026-03-25")).toHaveLength(0);
  });
  it("land=1 produces different or additional routes", () => {
    const idsWith = new Set(withLand.map(r => r.id));
    const idsWithout = new Set(withoutLand.map(r => r.id));
    const same = withLand.length === withoutLand.length && [...idsWith].every(id => idsWithout.has(id));
    expect(same).toBe(false);
  });
});

describe("Lea — gateway comparison BKK vs SIN", () => {
  let bkk: RouteOption[];
  let sin: RouteOption[];

  beforeAll(async () => {
    [bkk, sin] = await Promise.all([
      searchRoutes({
        fromCity: "Bangkok", fromAirport: "BKK", targetCity: "Paris", targetAirport: "PAR",
        nationality: "FR",
        deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: false, today: "2026-03-07",
      }),
      searchRoutes({
        fromCity: "Singapore", fromAirport: "SIN", targetCity: "Paris", targetAirport: "PAR",
        nationality: "FR",
        deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: false, today: "2026-03-07",
      }),
    ]);
  });

  it("both gateways return routes", () => {
    expect(bkk.length).toBeGreaterThan(0);
    expect(sin.length).toBeGreaterThan(0);
  });
  it("all routes depart before deadline", () => {
    expect(bkk.filter(r => r.departureDate > "2026-03-25")).toHaveLength(0);
    expect(sin.filter(r => r.departureDate > "2026-03-25")).toHaveLength(0);
  });
});

describe("Lea — anywhere with land=1 (maximum flexibility)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "FR",
      deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: true, today: "2026-03-07",
    });
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });
  it("all routes depart before deadline", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-25")).toHaveLength(0);
  });
});
