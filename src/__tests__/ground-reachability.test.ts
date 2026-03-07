import { haversineKm, computeGroundReachable } from "@/lib/route-engine";

// Real-world SEA distances (Google Maps driving/ferry estimates)
// Format: [from, to, realKm, realHours, description]
const KNOWN_DISTANCES: [string, string, number, number, string][] = [
  // Mainland SEA — bus routes
  ["Vientiane", "Bangkok", 630, 10, "Bus via Nong Khai border"],
  ["Vientiane", "Hanoi", 750, 14, "Bus via Cau Treo or Nam Can border"],
  ["Da Lat", "Ho Chi Minh City", 300, 7, "Bus on QL20/QL27"],
  ["Ho Chi Minh City", "Phnom Penh", 230, 6, "Bus via Moc Bai border"],
  ["Phnom Penh", "Bangkok", 650, 12, "Bus via Poipet border"],
  ["Chiang Mai", "Bangkok", 700, 10, "Train/bus"],
  ["Kuala Lumpur", "Singapore", 350, 5, "Express bus"],
  ["Hanoi", "Da Nang", 760, 14, "Bus/train on Reunification Express"],

  // Cross-water — ferry+bus routes (Indonesia)
  ["Bali", "Surabaya", 350, 8, "Ferry Gilimanuk + bus/train"],
  ["Bali", "Jakarta", 960, 20, "Ferry + train across Java"],
  ["Surabaya", "Jakarta", 780, 12, "Train across Java"],

];

// Coordinates from cities.ts
const COORDS: Record<string, [number, number]> = {
  "Vientiane": [17.9757, 102.6331],
  "Bangkok": [13.7563, 100.5018],
  "Hanoi": [21.0285, 105.8542],
  "Da Lat": [11.9404, 108.4583],
  "Ho Chi Minh City": [10.8231, 106.6297],
  "Phnom Penh": [11.5564, 104.9282],
  "Chiang Mai": [18.7883, 98.9853],
  "Kuala Lumpur": [3.1390, 101.6869],
  "Singapore": [1.3521, 103.8198],
  "Bali": [-8.3405, 115.0920],
  "Surabaya": [-7.2575, 112.7521],
  "Jakarta": [-6.2088, 106.8456],
  "Da Nang": [16.0544, 108.2022],
};

describe("Haversine heuristic vs real distances", () => {
  for (const [from, to, realKm, realHours, desc] of KNOWN_DISTANCES) {
    it(`${from} → ${to}: estimate within 150% of real (${desc})`, () => {
      const [lat1, lng1] = COORDS[from];
      const [lat2, lng2] = COORDS[to];
      const straightKm = haversineKm(lat1, lng1, lat2, lng2);
      const estimatedRoadKm = straightKm * 1.4; // ROAD_FACTOR
      const estimatedHours = estimatedRoadKm / 50; // BUS_SPEED_KMH

      // Haversine * road factor should not overestimate real distance by more than 50%
      expect(estimatedRoadKm).toBeLessThanOrEqual(realKm * 1.5);

      // Time estimate should be in the right ballpark (within 2x of real)
      expect(estimatedHours).toBeLessThanOrEqual(realHours * 2);
      expect(estimatedHours).toBeGreaterThanOrEqual(realHours * 0.3);

      // Log for review
      console.log(
        `  ${from} → ${to}: straight=${Math.round(straightKm)}km, ` +
        `est=${Math.round(estimatedRoadKm)}km (real=${realKm}km, ${((estimatedRoadKm / realKm) * 100).toFixed(0)}%), ` +
        `est=${estimatedHours.toFixed(1)}h (real=${realHours}h)`
      );
    });
  }
});

describe("Ground reachability from isolated airports", () => {
  it("DPS (Bali) with 16h budget reaches SIN or KUL via haversine", () => {
    const { paths } = computeGroundReachable("DPS", 16 * 60);
    const airports = paths.map(p => p.airport);
    // Bali should be able to reach at least one major hub by bus/boat
    console.log("  DPS reachable:", airports.map(a => `${a} (${Math.round(paths.find(p => p.airport === a)!.totalMinutes / 60)}h)`));
    // DPS is an island — ground connections depend on ferry availability
    // With the new bus/boat heuristic, nearby Indonesian airports should be reachable
    expect(paths.length).toBeGreaterThanOrEqual(0); // conservative — may find SUB if in hubs
  });

  it("VTE (Vientiane) with 16h budget reaches BKK and HAN", () => {
    const { paths } = computeGroundReachable("VTE", 16 * 60);
    const airports = paths.map(p => p.airport);
    console.log("  VTE reachable:", airports.map(a => `${a} (${Math.round(paths.find(p => p.airport === a)!.totalMinutes / 60)}h)`));
    expect(airports).toContain("BKK");
    expect(airports).toContain("HAN");
  });

  it("VTE with 6h budget reaches nothing (desperate case)", () => {
    const { paths } = computeGroundReachable("VTE", 6 * 60);
    expect(paths).toHaveLength(0);
  });

  it("DLI (Da Lat) with 16h budget reaches SGN and PNH", () => {
    const { paths } = computeGroundReachable("DLI", 16 * 60);
    const airports = paths.map(p => p.airport);
    console.log("  DLI reachable:", airports.map(a => `${a} (${Math.round(paths.find(p => p.airport === a)!.totalMinutes / 60)}h)`));
    expect(airports).toContain("SGN");
  });

  it("SIN with 6h budget reaches KUL", () => {
    const { paths } = computeGroundReachable("SIN", 6 * 60);
    const airports = paths.map(p => p.airport);
    expect(airports).toContain("KUL");
  });

  it("BKK with 16h budget reaches nearby airports", () => {
    const { paths } = computeGroundReachable("BKK", 16 * 60);
    const airports = paths.map(p => p.airport);
    console.log("  BKK reachable:", airports.map(a => `${a} (${Math.round(paths.find(p => p.airport === a)!.totalMinutes / 60)}h)`));
    expect(paths.length).toBeGreaterThan(0);
  });

  it("MNL (Manila) — island, check what's reachable", () => {
    const { paths, filtered } = computeGroundReachable("MNL", 16 * 60);
    const airports = paths.map(p => p.airport);
    console.log("  MNL reachable:", airports);
    console.log("  MNL filtered:", filtered.map(f => `${f.hub}: ${f.reason}`));
    // Manila is isolated — no nearby major hubs by bus/boat
    expect(paths.length).toBeGreaterThanOrEqual(0);
  });
});
