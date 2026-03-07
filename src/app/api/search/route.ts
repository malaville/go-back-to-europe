// ---------------------------------------------------------------------------
// POST /api/search — Flight route search endpoint
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { cities } from "@/data/cities";
import { searchRoutes } from "@/lib/route-engine";

type SearchRequestBody = {
  fromCity: string;
  targetCity: string;
  nationality: string;
  deadlineDate: string; // ISO date string  e.g. "2026-04-15"
  flexDays: number;
};

/**
 * Find a city's primary airport code from the static cities data.
 * Returns the first airport code from `nearbyAirports`, or "" if not found.
 */
function lookupAirportCode(cityName: string): string {
  if (!cityName) return "";

  const normalized = cityName.toLowerCase().trim();
  const match = cities.find((c) => c.name.toLowerCase() === normalized);

  if (match && match.nearbyAirports.length > 0) {
    return match.nearbyAirports[0].code;
  }

  return "";
}

/**
 * Derive the departure month (YYYY-MM) from a deadline date and flex window.
 * We target the month that the user would depart in — deadline minus flex days.
 */
function getDepartMonth(deadlineDate: string, flexDays: number): string {
  const deadline = new Date(deadlineDate);
  // Earliest possible departure
  const earliest = new Date(deadline);
  earliest.setDate(earliest.getDate() - flexDays);

  const year = earliest.getFullYear();
  const month = String(earliest.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchRequestBody;
    const { fromCity, targetCity, nationality, deadlineDate, flexDays } = body;

    if (!fromCity || !deadlineDate) {
      return NextResponse.json([], { status: 200 });
    }

    // Look up airport codes
    const fromAirport = lookupAirportCode(fromCity);
    if (!fromAirport) {
      console.warn(`[search] Could not find airport for city: ${fromCity}`);
      return NextResponse.json([], { status: 200 });
    }

    const isAnywhere =
      !targetCity ||
      targetCity.toLowerCase().includes("anywhere") ||
      targetCity.toLowerCase().includes("europe");

    const targetAirport = isAnywhere ? "" : lookupAirportCode(targetCity);

    // Calculate departure month
    const departMonth = getDepartMonth(deadlineDate, flexDays ?? 7);

    // Search routes
    const routes = await searchRoutes({
      fromCity,
      fromAirport,
      targetCity: isAnywhere ? "Anywhere in Europe" : targetCity,
      targetAirport,
      nationality: nationality || "FR",
      departMonth,
    });

    return NextResponse.json(routes, { status: 200 });
  } catch (error) {
    console.error("[search] Route search failed:", error);
    return NextResponse.json([], { status: 200 });
  }
}
