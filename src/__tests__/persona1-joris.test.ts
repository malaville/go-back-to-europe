import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);
const GULF_CITIES = new Set(["DXB", "AUH", "DOH", "SHJ", "MCT", "BAH", "JED", "RUH", "KWI", "AMM", "BEY"]);

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

  it("every route starts from Bali", () => {
    for (const route of routes) {
      expect(route.legs[0].fromCode).toBe("DPS");
    }
  });

  it("every route ends in Amsterdam", () => {
    for (const route of routes) {
      expect(route.legs[route.legs.length - 1].toCode).toBe("AMS");
    }
  });

  it("all routes depart before deadline", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-17").toBe(true);
    }
  });

  it("all routes depart on or after today", () => {
    for (const route of routes) {
      expect(route.departureDate >= "2026-03-07").toBe(true);
    }
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

  it("every flight leg has a departure date", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        if (leg.transport === "flight") {
          expect(leg.departDate).toBeDefined();
        }
      }
    }
  });

  it("Nonstop tag only on single-flight routes", () => {
    for (const route of routes) {
      if (route.tags.includes("Nonstop")) {
        const flightLegs = route.legs.filter(l => l.transport === "flight");
        expect(flightLegs).toHaveLength(1);
      }
    }
  });

  it("no visa=unknown for NL passport", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        expect(leg.visaStatus).not.toBe("unknown");
      }
    }
  });
});

describe("Joris — flex controls ground transport budget", () => {
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

  it("flex=3 caps ground legs at 6h", () => {
    for (const route of flex3) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight") {
          expect(leg.durationMinutes).toBeLessThanOrEqual(360);
        }
      }
    }
  });

  it("flex=7 caps ground legs at 14h", () => {
    for (const route of flex7) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight") {
          expect(leg.durationMinutes).toBeLessThanOrEqual(840);
        }
      }
    }
  });
});

describe("Joris — land toggle", () => {
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

  it("land=0 caps ground legs at 16h", () => {
    for (const route of withoutLand) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight") {
          expect(leg.durationMinutes).toBeLessThanOrEqual(960);
        }
      }
    }
  });

  it("land=1 caps ground legs at 30h", () => {
    for (const route of withLand) {
      for (const leg of route.legs) {
        if (leg.transport !== "flight") {
          expect(leg.durationMinutes).toBeLessThanOrEqual(1800);
        }
      }
    }
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
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-17").toBe(true);
    }
  });
});
