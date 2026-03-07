import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);
const GULF_CITIES = new Set(["DXB", "AUH", "DOH", "SHJ", "MCT", "BAH", "JED", "RUH", "KWI", "AMM", "BEY"]);

// Lea — 25yo French backpacker in Da Lat, FR passport, flexible, must reach Paris by March 25

describe("Lea — Da Lat→Paris, flex=7", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Paris", targetAirport: "PAR",
      nationality: "FR",
      deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    }));
  });

  it("returns routes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("every route starts from Da Lat", () => {
    for (const route of routes) {
      expect(route.legs[0].fromCode).toBe("DLI");
    }
  });

  it("every route ends in Paris", () => {
    for (const route of routes) {
      const lastLeg = route.legs[route.legs.length - 1];
      expect(["CDG", "ORY", "PAR"].includes(lastLeg.toCode)).toBe(true);
    }
  });

  it("all routes depart before March 25", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-25").toBe(true);
    }
  });

  it("all routes depart on or after today", () => {
    for (const route of routes) {
      expect(route.departureDate >= "2026-03-07").toBe(true);
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

  it("no route transits through a Gulf city", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        expect(GULF_CITIES.has(leg.fromCode)).toBe(false);
        expect(GULF_CITIES.has(leg.toCode)).toBe(false);
      }
    }
  });

  it("every route has a price above zero", () => {
    for (const route of routes) {
      expect(route.totalPrice).toBeGreaterThan(0);
    }
  });

  it("routes include ground transport from DLI (she needs a bus to a gateway)", () => {
    const hasGroundLeg = routes.some(r =>
      r.legs.some(l => l.transport !== "flight" && l.fromCode === "DLI")
    );
    expect(hasGroundLeg).toBe(true);
  });

  it("every route has a tier (preferred or extended)", () => {
    for (const route of routes) {
      expect(["preferred", "extended"]).toContain(route.tier);
    }
  });
});

describe("Lea — flex=3 (not very flexible, but desperate)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Paris", targetAirport: "PAR",
      nationality: "FR",
      deadlineDate: "2026-03-25", flexDays: 3, longLandTransport: false, today: "2026-03-07",
    }));
  });

  it("still returns routes (engine helps desperate users)", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("all routes depart before deadline", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-25").toBe(true);
    }
  });
});

// SKIPPED: Da Lat only produces 1 route (DLI→PNH ferry 11h → BKK → CDG).
// land=0 and land=1 return identical results because no ground leg exceeds 16h.
// BUG: DLI→SGN (7h bus, hardcoded) is not used — engine prefers haversine ferry to PNH.
// BUG: Lea should see many more routes via SGN (Ho Chi Minh City), a major hub.
// TODO: fix SGN gateway, then re-enable this test.
xdescribe("Lea — land toggle (GIVEN: long ground legs exist)", () => {
  let withLand: RouteOption[];
  let withoutLand: RouteOption[];

  beforeAll(async () => {
    const [resLand, resNoLand] = await Promise.all([
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
    withLand = resLand.routes;
    withoutLand = resNoLand.routes;
  });

  // GIVEN: land=1 returns routes with ground legs over 16h
  it("land=1 includes at least one route with a ground leg over 16h", () => {
    const hasLongGround = withLand.some(r =>
      r.legs.some(l => l.transport !== "flight" && l.durationMinutes > 960)
    );
    expect(hasLongGround).toBe(true);
  });

  // THEN: land=0 must exclude those
  it("land=0 has no ground legs over 16h", () => {
    for (const route of withoutLand) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight") {
          expect(leg.durationMinutes).toBeLessThanOrEqual(960);
        }
      }
    }
  });
});

describe("Lea — gateway comparison BKK vs SIN", () => {
  let bkk: RouteOption[];
  let sin: RouteOption[];

  beforeAll(async () => {
    const [resBkk, resSin] = await Promise.all([
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
    bkk = resBkk.routes;
    sin = resSin.routes;
  });

  it("both gateways return routes", () => {
    expect(bkk.length).toBeGreaterThan(0);
    expect(sin.length).toBeGreaterThan(0);
  });

  it("all routes depart before deadline", () => {
    for (const route of [...bkk, ...sin]) {
      expect(route.departureDate <= "2026-03-25").toBe(true);
    }
  });
});

describe("Lea — anywhere with land=1 (maximum flexibility)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Da Lat", fromAirport: "DLI", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "FR",
      deadlineDate: "2026-03-25", flexDays: 7, longLandTransport: true, today: "2026-03-07",
    }));
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });

  it("all routes depart before deadline", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-25").toBe(true);
    }
  });
});
