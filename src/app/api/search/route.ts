// ---------------------------------------------------------------------------
// POST /api/search — Flight route search endpoint
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { cities } from "@/data/cities";
import { searchRoutes } from "@/lib/route-engine";
import { ddlog, ddflush } from "@/lib/datadog-server";
import { lookupAirportByCity } from "@/lib/travelpayouts-data";

type SearchRequestBody = {
  fromCity: string;
  targetCity: string;
  nationality: string;
  deadlineDate: string; // ISO date string  e.g. "2026-04-15"
  flexDays: number;
  longLandTransport?: boolean;
};

/**
 * Find a city's primary airport code.
 * Tries static cities first (for route engine compatibility), then Travelpayouts API.
 */
function lookupAirportCodeStatic(cityName: string): string {
  if (!cityName) return "";
  const normalized = cityName.toLowerCase().trim();
  const match = cities.find((c) => c.name.toLowerCase() === normalized);
  if (match && match.nearbyAirports.length > 0) {
    return match.nearbyAirports[0].code;
  }
  return "";
}

async function lookupAirportCode(cityName: string): Promise<string> {
  const staticResult = lookupAirportCodeStatic(cityName);
  if (staticResult) return staticResult;
  return lookupAirportByCity(cityName);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchRequestBody;
    const { fromCity, targetCity, nationality, deadlineDate, flexDays, longLandTransport } = body;

    if (!fromCity || !deadlineDate) {
      return NextResponse.json([], { status: 200 });
    }

    // Look up airport codes
    const fromAirport = await lookupAirportCode(fromCity);
    if (!fromAirport) {
      console.warn(`[search] Could not find airport for city: ${fromCity}`);
      return NextResponse.json([], { status: 200 });
    }

    const isAnywhere =
      !targetCity ||
      targetCity.toLowerCase().includes("anywhere") ||
      targetCity.toLowerCase().includes("europe");

    const targetAirport = isAnywhere ? "" : await lookupAirportCode(targetCity);

    // If a specific destination was requested but not found, return empty
    if (!isAnywhere && !targetAirport) {
      console.warn(`[search] Could not find airport for target city: ${targetCity}`);
      return NextResponse.json([], { status: 200 });
    }

    // Search routes
    const { routes, metadata } = await searchRoutes({
      fromCity,
      fromAirport,
      targetCity: isAnywhere ? "Anywhere in Europe" : targetCity,
      targetAirport,
      nationality: nationality || "FR",
      deadlineDate,
      flexDays: flexDays ?? 7,
      longLandTransport: longLandTransport ?? false,
    });

    ddlog("info", "search", { fromCity, targetCity: isAnywhere ? "Anywhere" : targetCity, nationality, deadlineDate, flexDays, routeCount: routes.length });
    await ddflush();

    // Pick top 2 highlighted routes: cheapest + simplest (fewest legs)
    const highlighted: typeof routes = [];
    if (routes.length > 0) {
      const cheapest = routes.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min);
      highlighted.push(cheapest);
      const simplest = routes
        .filter(r => r.id !== cheapest.id)
        .reduce((best, r) => r.legs.length < best.legs.length ? r : best, routes.find(r => r.id !== cheapest.id) ?? cheapest);
      if (simplest.id !== cheapest.id) {
        highlighted.push(simplest);
      }
    }

    // Return with no-cache headers to ensure fresh data
    const response = NextResponse.json({
      highlighted,
      count: routes.length,
      routes,
      metadata,
    }, { status: 200 });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    return response;
  } catch (error) {
    ddlog("error", "search failed", { error: String(error) });
    await ddflush();
    console.error("[search] Route search failed:", error);
    return NextResponse.json({ highlighted: [], count: 0, routes: [] }, { status: 200 });
  }
}
