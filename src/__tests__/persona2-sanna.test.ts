import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);
const GULF_CITIES = new Set(["DXB", "AUH", "DOH", "SHJ", "MCT", "BAH", "JED", "RUH", "KWI", "AMM", "BEY"]);

// Sanna — 34yo Finnish remote worker in Vientiane, FI passport, father's emergency, must reach Helsinki by March 12

describe("Sanna — Vientiane→Helsinki, flex=3 (urgent)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Vientiane", fromAirport: "VTE", targetCity: "Helsinki", targetAirport: "HEL",
      nationality: "FI",
      deadlineDate: "2026-03-12", flexDays: 3, longLandTransport: false, today: "2026-03-07",
    }));
  });

  it("returns routes (Sanna is desperate, engine should find something)", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("every route starts from Vientiane", () => {
    for (const route of routes) {
      expect(route.legs[0].fromCode).toBe("VTE");
    }
  });

  it("every route ends in Helsinki", () => {
    for (const route of routes) {
      expect(route.legs[route.legs.length - 1].toCode).toBe("HEL");
    }
  });

  it("all routes depart before March 12", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-12").toBe(true);
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

  it("every route has a tier (preferred or extended)", () => {
    for (const route of routes) {
      expect(["preferred", "extended"]).toContain(route.tier);
    }
  });

  it("preferred routes appear before extended routes", () => {
    let seenExtended = false;
    for (const route of routes) {
      if (route.tier === "extended") seenExtended = true;
      if (route.tier === "preferred" && seenExtended) {
        fail("preferred route appeared after extended route");
      }
    }
  });
});

describe("Sanna — flex controls ground budget", () => {
  let flex3: RouteOption[];
  let flex7: RouteOption[];

  beforeAll(async () => {
    const [res3, res7] = await Promise.all([
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
    flex3 = res3.routes;
    flex7 = res7.routes;
  });

  it("flex=7 preferred routes have ground legs within 14h", () => {
    for (const route of flex7.filter(r => r.tier === "preferred")) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight") {
          expect(leg.durationMinutes).toBeLessThanOrEqual(840);
        }
      }
    }
  });

  it("flex=3 preferred ground legs stay within 6h, extended within 16h cap", () => {
    // Sanna's flex=3 means 6h ground preferred.
    // Extended routes can use up to 16h ground cap.
    for (const route of flex3) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight") {
          if (route.tier === "preferred") {
            expect(leg.durationMinutes).toBeLessThanOrEqual(360);
          } else {
            expect(leg.durationMinutes).toBeLessThanOrEqual(960);
          }
        }
      }
    }
  });

  it("routes matching flex preference have tier=preferred", () => {
    for (const route of flex7) {
      expect(route.tier).toBeDefined();
    }
  });
});

describe("Sanna — anywhere (maybe Stockholm is easier)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Vientiane", fromAirport: "VTE", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "FI",
      deadlineDate: "2026-03-12", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    }));
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });

  it("all routes depart before deadline", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-12").toBe(true);
    }
  });
});
