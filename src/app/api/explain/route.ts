// ---------------------------------------------------------------------------
// GET /api/explain — Debug route engine reasoning
//
// Same params as /api/query but returns step-by-step trace of the algorithm.
// Usage: /api/explain?from=Da+Lat&to=Paris&nat=FR&date=2026-03-21&flex=7
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { cities } from "@/data/cities";
import { searchRoutesWithExplain } from "@/lib/route-engine";

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

  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  const deadlineDate = params.get("date") ?? defaultDate.toISOString().split("T")[0];

  if (!fromCity) {
    return NextResponse.json({
      error: "Missing 'from' parameter",
      usage: "/api/explain?from=Bangkok&to=Paris&nat=FR&date=2026-04-01&flex=7",
    }, { status: 400 });
  }

  const fromAirport = lookupAirportCode(fromCity);
  if (!fromAirport) {
    return NextResponse.json({ error: `Unknown origin: "${fromCity}"` }, { status: 400 });
  }

  const isAnywhere = !targetCity || targetCity.toLowerCase().includes("anywhere") || targetCity.toLowerCase().includes("europe");
  const targetAirport = isAnywhere ? "" : lookupAirportCode(targetCity);

  if (!isAnywhere && !targetAirport) {
    return NextResponse.json({ error: `Unknown destination: "${targetCity}"` }, { status: 400 });
  }

  const departMonth = getDepartMonth(deadlineDate, flexDays);

  const { routes, explain } = await searchRoutesWithExplain({
    fromCity,
    fromAirport,
    targetCity: isAnywhere ? "Anywhere in Europe" : targetCity,
    targetAirport,
    nationality,
    departMonth,
    deadlineDate,
    flexDays,
  });

  const response = NextResponse.json({
    query: { from: fromCity, fromAirport, to: isAnywhere ? "Anywhere in Europe" : targetCity, targetAirport, nat: nationality, date: deadlineDate, flex: flexDays, departMonth },
    explain,
    routeCount: routes.length,
    routes: routes.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      path: r.legs.map(l => `${l.fromCode}(${l.transport})`).join("→") + "→" + r.legs[r.legs.length - 1].toCode,
      price: `€${r.totalPrice}`,
      time: r.estimatedTotalDuration,
      departure: r.departureDate,
      tags: r.tags,
      warnings: r.warnings,
    })),
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}
