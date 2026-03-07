import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);
const GULF_CITIES = new Set(["DXB", "AUH", "DOH", "SHJ", "MCT", "BAH", "JED", "RUH", "KWI", "AMM", "BEY"]);

// James — 42yo British family man in Bangkok, GB passport, wife + 2 kids, must reach London by March 20

describe("James — Bangkok→London, flex=7", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Bangkok", fromAirport: "BKK", targetCity: "London", targetAirport: "LON",
      nationality: "GB",
      deadlineDate: "2026-03-20", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    }));
  });

  it("returns routes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("every route starts from Bangkok", () => {
    for (const route of routes) {
      expect(route.legs[0].fromCode).toBe("BKK");
    }
  });

  it("every route ends in London", () => {
    for (const route of routes) {
      const lastLeg = route.legs[route.legs.length - 1];
      // London has multiple airports (LHR, LGW, STN, LTN)
      expect(["LHR", "LGW", "STN", "LTN", "LON"].includes(lastLeg.toCode)).toBe(true);
    }
  });

  it("all routes depart before March 20", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-20").toBe(true);
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

  it("Delhi hidden stop has visa warning for GB passport", () => {
    const delhiLegs = routes.flatMap(r => r.legs).filter(l => l.hiddenStop === "DEL" || l.toCode === "DEL");
    if (delhiLegs.length > 0) {
      const hasVisaWarning = delhiLegs.some(l => l.visaNote && l.visaNote.length > 0);
      expect(hasVisaWarning).toBe(true);
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

  it("every route has a tier (preferred or extended)", () => {
    for (const route of routes) {
      expect(["preferred", "extended"]).toContain(route.tier);
    }
  });
});

describe("James — GB passport visa rules differ from EU", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Bangkok", fromAirport: "BKK", targetCity: "Anywhere in Europe", targetAirport: "",
      nationality: "GB",
      deadlineDate: "2026-03-20", flexDays: 7, longLandTransport: false, today: "2026-03-07",
    }));
  });

  it("returns routes to multiple European cities", () => {
    const destinations = new Set(routes.map(r => r.legs[r.legs.length - 1].toCode));
    expect(destinations.size).toBeGreaterThan(1);
  });

  it("all routes depart before deadline", () => {
    for (const route of routes) {
      expect(route.departureDate <= "2026-03-20").toBe(true);
    }
  });

  it("at least one route has a visa note (GB is not Schengen)", () => {
    const allVisaNotes = routes.flatMap(r => r.legs).filter(l => l.visaNote && l.visaNote.length > 0);
    expect(allVisaNotes.length).toBeGreaterThan(0);
  });
});
