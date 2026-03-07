import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Users (optional accounts) ──────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  neonAuthId: text("neon_auth_id").unique(),
  email: text("email"),
  nationality: text("nationality"), // ISO 3166-1 alpha-2
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Search queries (for rate limiting + analytics) ─────────────
export const searches = pgTable(
  "searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    ipHash: text("ip_hash"), // hashed IP for anonymous rate limiting
    fromCity: text("from_city").notNull(),
    fromCountry: text("from_country").notNull(),
    targetCity: text("target_city"), // null = "anywhere in Europe"
    nationality: text("nationality").notNull(),
    deadlineDate: timestamp("deadline_date").notNull(),
    flexibleFromDate: timestamp("flexible_from_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("searches_ip_hash_idx").on(table.ipHash),
    index("searches_created_at_idx").on(table.createdAt),
  ]
);

// ── Flight cache (segment-level deduplication) ─────────────────
export const flightCache = pgTable(
  "flight_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cacheKey: text("cache_key").notNull(), // e.g., "SGN-ICN-2026-03-07-2026-03-12"
    departureAirport: text("departure_airport").notNull(),
    arrivalAirport: text("arrival_airport").notNull(),
    dateWindowStart: timestamp("date_window_start").notNull(),
    dateWindowEnd: timestamp("date_window_end").notNull(),
    results: jsonb("results").notNull(), // cached flight options
    source: text("source").notNull(), // "kiwi" | "amadeus"
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [
    uniqueIndex("flight_cache_key_idx").on(table.cacheKey),
    index("flight_cache_expires_idx").on(table.expiresAt),
  ]
);

// ── Excluded regions (admin-curated, crowd-signaled) ───────────
export const excludedRegions = pgTable("excluded_regions", {
  id: uuid("id").defaultRandom().primaryKey(),
  countryCode: text("country_code").notNull().unique(), // ISO 3166-1 alpha-2
  countryName: text("country_name").notNull(),
  reason: text("reason"), // e.g., "Armed conflict"
  isDefault: boolean("is_default").default(true).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Safety signals (logged-in users flagging countries) ────────
export const safetySignals = pgTable(
  "safety_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    countryCode: text("country_code").notNull(),
    flaggedUnsafe: boolean("flagged_unsafe").default(true).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("safety_signals_country_idx").on(table.countryCode),
    index("safety_signals_created_idx").on(table.createdAt),
  ]
);

// ── Visa rules (curated for EU nationalities) ──────────────────
export const visaRules = pgTable(
  "visa_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nationality: text("nationality").notNull(), // passport country code
    destinationCountry: text("destination_country").notNull(),
    category: text("category").notNull(), // "free" | "evisa" | "warning" | "easy" | "hard"
    maxDays: integer("max_days"), // visa-free stay duration
    notes: text("notes"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("visa_rules_nat_dest_idx").on(
      table.nationality,
      table.destinationCountry
    ),
  ]
);

// ── Cost of living (daily estimate for foreigners) ─────────────
export const costOfLiving = pgTable("cost_of_living", {
  id: uuid("id").defaultRandom().primaryKey(),
  countryCode: text("country_code").notNull().unique(),
  countryName: text("country_name").notNull(),
  dailyCostUsd: real("daily_cost_usd").notNull(), // budget traveler daily cost
  source: text("source"), // e.g., "numbeo", "manual"
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Community signups ────────────────────────────────────────────
export const signups = pgTable(
  "signups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    fromCity: text("from_city"),
    toCity: text("to_city"),
    nationality: text("nationality"),
    interests: jsonb("interests"), // ["route_alerts", "beta_tester", "community"]
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("signups_email_idx").on(table.email),
  ]
);

// ── Cities + airports mapping ──────────────────────────────────
export const cities = pgTable(
  "cities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    country: text("country").notNull(), // ISO 3166-1 alpha-2
    region: text("region").notNull(), // "sea" | "europe" | "east_asia" | etc.
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    nearbyAirports: jsonb("nearby_airports").notNull(), // [{code, name, distanceKm, travelTimeHours}]
  },
  (table) => [
    index("cities_region_idx").on(table.region),
    index("cities_country_idx").on(table.country),
  ]
);
