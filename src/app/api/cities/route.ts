import { db } from "@/db";
import { cities } from "@/db/schema";
import { ilike, or, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const region = searchParams.get("region"); // "sea" | "europe" | "east_asia"

  try {
    let results;

    if (query.length > 0) {
      const conditions = [ilike(cities.name, `%${query}%`)];
      if (region) {
        results = await db
          .select()
          .from(cities)
          .where(or(...conditions))
          .then((rows) => rows.filter((r) => r.region === region));
      } else {
        results = await db.select().from(cities).where(or(...conditions));
      }
    } else if (region) {
      results = await db.select().from(cities).where(eq(cities.region, region));
    } else {
      results = await db.select().from(cities);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
