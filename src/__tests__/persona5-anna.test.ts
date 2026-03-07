import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);

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
  it("all routes depart before March 22", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-22")).toHaveLength(0);
  });
  it("all routes depart on or after today", () => {
    expect(routes.filter(r => r.departureDate < "2026-03-07")).toHaveLength(0);
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
  it("first leg starts from USM or a nearby gateway", () => {
    const validStarts = new Set(["USM", "BKK", "HKT"]);
    for (const route of routes) {
      expect(validStarts.has(route.legs[0].fromCode)).toBe(true);
    }
  });
  it("no visa issues for DE passport", () => {
    for (const route of routes) {
      for (const leg of route.legs) {
        expect(leg.visaStatus).not.toBe("unknown");
      }
    }
  });
});

describe("Anna — flex=3 (urgent)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    routes = await searchRoutes({
      fromCity: "Koh Tao", fromAirport: "USM", targetCity: "Berlin", targetAirport: "BER",
      nationality: "DE",
      deadlineDate: "2026-03-22", flexDays: 3, longLandTransport: false, today: "2026-03-07",
    });
  });

  it("returns routes (USM has direct flights to BKK)", () => {
    expect(routes.length).toBeGreaterThan(0);
  });
  it("all routes depart before deadline", () => {
    expect(routes.filter(r => r.departureDate > "2026-03-22")).toHaveLength(0);
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
    expect(routes.filter(r => r.departureDate > "2026-03-22")).toHaveLength(0);
  });
});
