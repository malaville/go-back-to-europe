import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);
const GULF_CITIES = new Set(["DXB", "AUH", "DOH", "SHJ", "MCT", "BAH", "JED", "RUH", "KWI", "AMM", "BEY"]);

// Anna — 26yo German backpacker on Koh Tao, DE passport, needs to reach Berlin by March 22
// Koh Tao has no airport — nearest is USM (Koh Samui, 2.5h ferry)

describe("Anna — Koh Tao→Berlin, flex=7", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Koh Tao", fromAirport: "USM", targetCity: "Berlin", targetAirport: "BER",
      nationality: "DE",
      deadlineDate: "2026-03-22", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("every route starts from Koh Samui area", () => {
    for (const route of routes) {
      expect(route.legs[0].fromCode).toBe("USM");
    }
  });

  it("every route ends in Berlin", () => {
    for (const route of routes) {
      expect(route.legs[route.legs.length - 1].toCode).toBe("BER");
    }
  });

  it("all routes depart before March 22", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-22").toBe(true);
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

  it("no visa=unknown for DE passport", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        expect(leg.visaStatus).not.toBe("unknown");
      }
    }
  });
});

describe("Anna — anywhere in Europe", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Koh Tao", fromAirport: "USM", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "DE",
      deadlineDate: "2026-03-22", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });

  it("all routes depart before deadline", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-22").toBe(true);
    }
  });
});
