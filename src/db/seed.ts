import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { cities as cityData } from "../data/cities";
import { excludedRegions as excludedRegionData } from "../data/excluded-regions";
import { costOfLiving as costOfLivingData } from "../data/cost-of-living";
import { visaRules as visaRuleData } from "../data/visa-rules";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env.local");
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...\n");

  // ── Cities ──────────────────────────────────────────────────────
  console.log(`Inserting ${cityData.length} cities...`);
  for (const city of cityData) {
    await db
      .insert(schema.cities)
      .values({
        name: city.name,
        country: city.country,
        region: city.region,
        lat: city.lat,
        lng: city.lng,
        nearbyAirports: city.nearbyAirports,
      })
      .onConflictDoNothing();
  }
  console.log("  Done.\n");

  // ── Excluded regions ────────────────────────────────────────────
  console.log(`Inserting ${excludedRegionData.length} excluded regions...`);
  for (const region of excludedRegionData) {
    await db
      .insert(schema.excludedRegions)
      .values({
        countryCode: region.countryCode,
        countryName: region.countryName,
        reason: region.reason,
        isDefault: region.isDefault,
      })
      .onConflictDoNothing();
  }
  console.log("  Done.\n");

  // ── Cost of living ──────────────────────────────────────────────
  console.log(`Inserting ${costOfLivingData.length} cost-of-living entries...`);
  for (const col of costOfLivingData) {
    await db
      .insert(schema.costOfLiving)
      .values({
        countryCode: col.countryCode,
        countryName: col.countryName,
        dailyCostUsd: col.dailyCostUsd,
        source: col.source,
      })
      .onConflictDoNothing();
  }
  console.log("  Done.\n");

  // ── Visa rules ──────────────────────────────────────────────────
  console.log(`Inserting ${visaRuleData.length} visa rules...`);
  for (const rule of visaRuleData) {
    await db
      .insert(schema.visaRules)
      .values({
        nationality: rule.nationality,
        destinationCountry: rule.destinationCountry,
        category: rule.category,
        maxDays: rule.maxDays,
        notes: rule.notes,
      })
      .onConflictDoNothing();
  }
  console.log("  Done.\n");

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
