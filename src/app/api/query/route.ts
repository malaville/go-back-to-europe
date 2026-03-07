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

function lookupAirportCode(cityName: string): string {
  if (!cityName) return "";
  const normalized = cityName.toLowerCase().trim();
  const match = cities.find((c) => c.name.toLowerCase() === normalized);
  return match?.nearbyAirports[0]?.code ?? "";
}

function getDepartMonth(deadlineDate: string, flexDays: number): string {
  const deadline = new Date(deadlineDate);
  const earliest = new Date(deadline);
  earliest.setDate(earliest.getDate() - flexDays);
  return `${earliest.getFullYear()}-${String(earliest.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const fromCity = params.get("from") ?? "";
  const targetCity = params.get("to") ?? "";
  const nationality = params.get("nat") ?? "FR";
  const flexDays = Number(params.get("flex") ?? "7");

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

  const fromAirport = lookupAirportCode(fromCity);
  if (!fromAirport) {
    return NextResponse.json({
      error: `Unknown origin: "${fromCity}"`,
      origins: cities.filter((c) => c.region === "sea" || c.region === "east_asia").map((c) => c.name),
    }, { status: 400 });
  }

  const isAnywhere = !targetCity || targetCity.toLowerCase().includes("anywhere") || targetCity.toLowerCase().includes("europe");
  const targetAirport = isAnywhere ? "" : lookupAirportCode(targetCity);

  if (!isAnywhere && !targetAirport) {
    return NextResponse.json({
      error: `Unknown destination: "${targetCity}"`,
      destinations: cities.filter((c) => c.region === "europe").map((c) => c.name),
    }, { status: 400 });
  }

  const departMonth = getDepartMonth(deadlineDate, flexDays);

  const routes = await searchRoutes({
    fromCity,
    fromAirport,
    targetCity: isAnywhere ? "Anywhere in Europe" : targetCity,
    targetAirport,
    nationality,
    departMonth,
    deadlineDate,
    flexDays,
  });

  // Flatten into LLM-friendly format using frontend display keys
  const results = routes.map((route, i) => ({
    rank: i + 1,
    tags: route.tags,
    price: `€${route.totalPrice}`,
    travelTime: route.estimatedTotalDuration,
    flyingTime: route.totalDuration,
    departure: route.departureDate,
    ticketType: route.ticketType,
    bookUrl: route.searchUrl,
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

  const response = NextResponse.json({
    query: { from: fromCity, to: isAnywhere ? "Anywhere in Europe" : targetCity, nat: nationality, date: deadlineDate, flex: flexDays },
    count: results.length,
    routes: results,
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}
