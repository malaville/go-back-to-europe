// ---------------------------------------------------------------------------
// GET /api/query — LLM-friendly route search endpoint
// Returns flattened JSON with frontend-matching keys for fast parsing.
//
// Usage: /api/query?from=Bangkok&to=Paris&nat=FR&date=2026-04-01&flex=7
// All params optional except `from`. Defaults: to=Anywhere, nat=FR, flex=7,
// date=14 days from now.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { cities } from "@/data/cities";
import { searchRoutes } from "@/lib/route-engine";
import { googleFlightsUrl } from "@/lib/google-flights-url";
import { ddlog, ddflush } from "@/lib/datadog-server";
import { lookupAirportByCity } from "@/lib/travelpayouts-data";

async function lookupAirportCode(cityName: string): Promise<string> {
  if (!cityName) return "";
  const normalized = cityName.toLowerCase().trim();
  const match = cities.find((c) => c.name.toLowerCase() === normalized);
  if (match?.nearbyAirports[0]?.code) return match.nearbyAirports[0].code;
  return lookupAirportByCity(cityName);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const fromCity = params.get("from") ?? "";
  const targetCity = params.get("to") ?? "";
  const nationality = params.get("nat") ?? "FR";
  const flexDays = Number(params.get("flex") ?? "7");
  const longLandTransport = params.get("land") === "1";

  // Default date: 14 days from now
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  const deadlineDate = params.get("date") ?? defaultDate.toISOString().split("T")[0];

  if (!fromCity) {
    return NextResponse.json({
      error: "Missing 'from' parameter",
      usage: "/api/query?from=Bangkok&to=Paris&nat=FR&date=2026-04-01&flex=7",
      origins: cities.filter((c) => c.region === "sea" || c.region === "east_asia").map((c) => c.name),
      destinations: cities.filter((c) => c.region === "europe").map((c) => c.name),
    }, { status: 400 });
  }

  const fromAirport = await lookupAirportCode(fromCity);
  if (!fromAirport) {
    return NextResponse.json({
      error: `Unknown origin: "${fromCity}"`,
      origins: cities.filter((c) => c.region === "sea" || c.region === "east_asia").map((c) => c.name),
    }, { status: 400 });
  }

  const isAnywhere = !targetCity || targetCity.toLowerCase().includes("anywhere") || targetCity.toLowerCase().includes("europe");
  const targetAirport = isAnywhere ? "" : await lookupAirportCode(targetCity);

  if (!isAnywhere && !targetAirport) {
    return NextResponse.json({
      error: `Unknown destination: "${targetCity}"`,
      destinations: cities.filter((c) => c.region === "europe").map((c) => c.name),
    }, { status: 400 });
  }

  const { routes, metadata } = await searchRoutes({
    fromCity,
    fromAirport,
    targetCity: isAnywhere ? "Anywhere in Europe" : targetCity,
    targetAirport,
    nationality,
    deadlineDate,
    flexDays,
    longLandTransport,
  });

  // Flatten into LLM-friendly format using frontend display keys
  const results = routes.map((route, i) => ({
    rank: i + 1,
    tags: route.tags,
    tier: route.tier,
    price: `€${route.totalPrice}`,
    travelTime: route.estimatedTotalDuration,
    flyingTime: route.totalDuration,
    departure: route.departureDate,
    ticketType: route.ticketType,
    warnings: route.warnings,
    legs: route.legs.map((leg) => ({
      from: leg.from,
      fromCode: leg.fromCode,
      to: leg.to,
      toCode: leg.toCode,
      transport: leg.transport,
      airline: leg.airline ?? null,
      airlineCode: leg.airlineCode ?? null,
      hiddenStop: leg.hiddenStop ?? null,
      duration: leg.duration,
      price: `€${leg.price}`,
      visa: leg.visaStatus,
      visaNote: leg.visaNote ?? null,
      verifyUrl: leg.transport === "flight"
        ? googleFlightsUrl(leg.fromCode, leg.toCode, route.departureDate)
        : null,
    })),
  }));

  // Pick top 2 highlighted routes
  const highlighted = results.slice(0, 2);

  ddlog("info", "query", { from: fromCity, to: isAnywhere ? "Anywhere" : targetCity, nat: nationality, date: deadlineDate, flex: flexDays, routeCount: results.length });
  await ddflush();

  const response = NextResponse.json({
    query: { from: fromCity, to: isAnywhere ? "Anywhere in Europe" : targetCity, nat: nationality, date: deadlineDate, flex: flexDays },
    highlighted,
    count: results.length,
    routes: results,
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}
