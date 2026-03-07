import { db } from "@/db";
import { cities } from "@/db/schema";
import { ilike, or, eq, and, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function sanitizeLikePattern(input: string): string {
  return input.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const region = searchParams.get("region"); // comma-separated: "sea" | "europe" | "east_asia"

  try {
    let results;

    const regionCondition = region
      ? region.includes(",")
        ? inArray(cities.region, region.split(","))
        : eq(cities.region, region)
      : null;

    if (query.length > 0) {
      const sanitized = sanitizeLikePattern(query);
      const nameCondition = ilike(cities.name, `%${sanitized}%`);
      const whereClause = regionCondition
        ? and(nameCondition, regionCondition)
        : nameCondition;
      results = await db.select().from(cities).where(whereClause);
    } else if (regionCondition) {
      results = await db.select().from(cities).where(regionCondition);
    } else {
      results = await db.select().from(cities);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
