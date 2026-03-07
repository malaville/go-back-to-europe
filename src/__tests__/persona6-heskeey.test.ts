import { searchRoutes } from "@/lib/route-engine";
import type { RouteOption } from "@/data/route-types";

const GULF_CARRIERS = new Set(["EY", "EK", "FZ", "G9", "QR", "GF", "WY", "SV", "RJ", "ME", "KU", "OV", "XY"]);
const GULF_CITIES = new Set(["DXB", "AUH", "DOH", "SHJ", "MCT", "BAH", "JED", "RUH", "KWI", "AMM", "BEY"]);

// HeskeeyTime — British traveler stranded in Manila, needs to reach London ASAP
// Real case from 2026-03-07: original flight March 10 cancelled.
// Best routes found manually: MNL→XIY→GYD→LGW (Baku Express ~€772),
// MNL→CTU→LHR (~€527 via Chengdu trick)

describe("HeskeeyTime — MNL→London, urgent (flex=3)", () => {
  let routes: RouteOption[];

  beforeAll(async () => {
    ({ routes } = await searchRoutes({
      fromCity: "Manila", fromAirport: "MNL", targetCity: "London", targetAirport: "LHR",
      nationality: "GB",
      deadlineDate: "2026-03-12", flexDays: 3, longLandTransport: false, today: "2026-03-07",
    }));
  });

  it("returns routes", () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it("every route starts from Manila", () => {
    for (const route of routes) {
      expect(route.legs[0].fromCode).toBe("MNL");
    }
  });

  it("every route ends in London", () => {
    for (const route of routes) {
      const lastLeg = route.legs[route.legs.length - 1];
      expect(["LHR", "LGW", "STN", "LON"].includes(lastLeg.toCode)).toBe(true);
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

  it("finds routes via non-traditional hubs (Chinese, Caucasus, or Central Asian)", () => {
    // The engine should find creative routes through CTU, XIY, PEK, PVG, GYD, ALA, TBS, URC
    // Which specific ones appear depends on API price availability
    const creativeHubs = new Set(["CTU", "XIY", "PEK", "PVG", "CAN", "GYD", "ALA", "TBS", "URC", "TAS"]);
    const viaCreative = routes.filter(r =>
      r.legs.some(l => creativeHubs.has(l.fromCode) || creativeHubs.has(l.toCode))
    );
    expect(viaCreative.length).toBeGreaterThan(0);
  });

  it("finds 3-hop Silk Road routes (MNL→China→Caucasus→London)", () => {
    const threeHop = routes.filter(r => {
      const flightLegs = r.legs.filter(l => l.transport === "flight");
      return flightLegs.length >= 3;
    });
    expect(threeHop.length).toBeGreaterThan(0);
  });

  it("urgent search warns about approximate dates on multi-leg routes", () => {
    // Cached API prices are historical minimums (5-20x below real last-minute prices).
    // For urgent travel (flex=3, deadline in days), the dates from different legs
    // won't align — the engine should flag this with a date warning so the user
    // knows prices are approximate, not bookable as-is.
    const multiLeg = routes.filter(r => r.legs.filter(l => l.transport === "flight").length > 1);
    const withDateWarning = multiLeg.filter(r =>
      r.warnings.some(w => w.toLowerCase().includes("date") || w.toLowerCase().includes("approximate"))
    );
    // At least some multi-leg routes should carry a date/approximate warning
    expect(withDateWarning.length).toBeGreaterThan(0);
  });

  it("flight legs from /v1/cheap have flight numbers", () => {
    const legsWithFlightNum = routes.flatMap(r => r.legs).filter(l =>
      l.transport === "flight" && l.flightNumber
    );
    // At least some legs should have flight numbers (from /v1/prices/cheap)
    expect(legsWithFlightNum.length).toBeGreaterThan(0);
  });

  it("flight legs from /v1/cheap have departure times", () => {
    const legsWithTime = routes.flatMap(r => r.legs).filter(l =>
      l.transport === "flight" && l.departTime
    );
    expect(legsWithTime.length).toBeGreaterThan(0);
  });
});

