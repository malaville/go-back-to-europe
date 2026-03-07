import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/travelpayouts-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const region = searchParams.get("region"); // comma-separated: "sea" | "europe" | "east_asia"

  try {
    const regions = region ? region.split(",") : undefined;
    const results = await searchCities(query, { regions, limit: 15 });

    // Map to the format the frontend expects
    const mapped = results.map(c => ({
      name: c.name,
      country: c.country,
      region: regions?.[0] ?? "sea",
      lat: c.lat,
      lng: c.lng,
      nearbyAirports: c.airports.map(a => ({
        code: a.code,
        name: a.name,
        distanceKm: 0,
        travelTimeHours: 0,
      })),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
