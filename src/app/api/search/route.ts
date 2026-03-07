// ---------------------------------------------------------------------------
// POST /api/search — Flight route search endpoint
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { cities } from "@/data/cities";
import { searchRoutes } from "@/lib/route-engine";
import { ddlog, ddflush } from "@/lib/datadog-server";

type SearchRequestBody = {
  fromCity: string;
  targetCity: string;
  nationality: string;
  deadlineDate: string; // ISO date string  e.g. "2026-04-15"
  flexDays: number;
  longLandTransport?: boolean;
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
    const { fromCity, targetCity, nationality, deadlineDate, flexDays, longLandTransport } = body;

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

    // If a specific destination was requested but not found, return empty
    if (!isAnywhere && !targetAirport) {
      console.warn(`[search] Could not find airport for target city: ${targetCity}`);
      return NextResponse.json([], { status: 200 });
    }

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
      deadlineDate,
      flexDays: flexDays ?? 7,
      longLandTransport: longLandTransport ?? false,
    });

    ddlog("info", "search", { fromCity, targetCity: isAnywhere ? "Anywhere" : targetCity, nationality, deadlineDate, flexDays, routeCount: routes.length });
    await ddflush();

    // Return with no-cache headers to ensure fresh data
    const response = NextResponse.json(routes, { status: 200 });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    return response;
  } catch (error) {
    ddlog("error", "search failed", { error: String(error) });
    await ddflush();
    console.error("[search] Route search failed:", error);
    return NextResponse.json([], { status: 200 });
  }
}
