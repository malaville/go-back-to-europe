// ---------------------------------------------------------------------------
// Travelpayouts static data API — cities & airports
// Fetched once and cached in memory. ~10k cities, ~10k airports.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
// ---------------------------------------------------------------------------

const BASE = "https://api.travelpayouts.com/data/en";

type RawCity = {
  code: string;
  name: string;
  country_code: string;
  coordinates: { lat: number; lon: number };
  has_flightable_airport: boolean;
  name_translations?: { en?: string };
};

type RawAirport = {
  code: string;
  name: string;
  city_code: string;
  country_code: string;
  coordinates: { lat: number; lon: number };
  flightable: boolean;
  iata_type: string;
};

export type CityResult = {
  code: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  airports: { code: string; name: string; lat: number; lng: number }[];
};

// In-memory cache
let citiesCache: CityResult[] | null = null;
let airportToCityCache: Map<string, CityResult> | null = null;

async function loadData(): Promise<{ cities: CityResult[]; airportToCity: Map<string, CityResult> }> {
  if (citiesCache && airportToCityCache) {
    return { cities: citiesCache, airportToCity: airportToCityCache };
  }

  const [citiesRes, airportsRes] = await Promise.all([
    fetch(`${BASE}/cities.json`, { next: { revalidate: 86400 } }),
    fetch(`${BASE}/airports.json`, { next: { revalidate: 86400 } }),
  ]);

  const rawCities: RawCity[] = await citiesRes.json();
  const rawAirports: RawAirport[] = await airportsRes.json();

  // Build city code → airports mapping
  const cityAirports = new Map<string, { code: string; name: string; lat: number; lng: number }[]>();
  for (const ap of rawAirports) {
    if (!ap.flightable || ap.iata_type !== "airport") continue;
    if (!ap.coordinates?.lat || !ap.coordinates?.lon) continue;
    const list = cityAirports.get(ap.city_code) ?? [];
    list.push({ code: ap.code, name: ap.name, lat: ap.coordinates.lat, lng: ap.coordinates.lon });
    cityAirports.set(ap.city_code, list);
  }

  // Build city results — only cities with at least one flightable airport
  const cities: CityResult[] = [];
  for (const c of rawCities) {
    if (!c.coordinates?.lat || !c.coordinates?.lon) continue;
    const airports = cityAirports.get(c.code) ?? [];
    if (airports.length === 0) continue;

    const name = c.name_translations?.en || c.name;
    if (!name) continue;

    cities.push({
      code: c.code,
      name,
      country: c.country_code,
      lat: c.coordinates.lat,
      lng: c.coordinates.lon,
      airports,
    });
  }

  // Build airport code → city lookup
  const airportToCity = new Map<string, CityResult>();
  for (const city of cities) {
    for (const ap of city.airports) {
      airportToCity.set(ap.code, city);
    }
  }

  citiesCache = cities;
  airportToCityCache = airportToCity;

  console.log(`[travelpayouts-data] Loaded ${cities.length} cities with ${airportToCity.size} airports`);
  return { cities, airportToCity };
}

/**
 * Search cities by name prefix. Returns up to `limit` matches.
 * Filters by region if provided.
 */
export async function searchCities(
  query: string,
  options?: { regions?: string[]; limit?: number }
): Promise<CityResult[]> {
  const { cities } = await loadData();
  const q = query.toLowerCase().trim();
  const limit = options?.limit ?? 10;

  if (!q) return [];

  // Region filtering — map region names to country codes
  const regionCountries: Record<string, Set<string>> = {
    sea: new Set(["TH", "VN", "KH", "LA", "MM", "MY", "SG", "ID", "PH", "BN", "TL"]),
    east_asia: new Set(["JP", "KR", "TW", "CN", "HK", "MO", "MN"]),
    south_asia: new Set(["IN", "LK", "NP", "BD", "PK", "MV", "BT"]),
    europe: new Set(["FR", "NL", "GB", "DE", "IT", "ES", "PT", "PL", "HU", "CZ", "AT", "BE",
      "SE", "DK", "FI", "IE", "RO", "BG", "HR", "SI", "SK", "LT", "LV", "EE",
      "LU", "MT", "CY", "GR", "NO", "IS", "CH"]),
  };

  let allowedCountries: Set<string> | null = null;
  if (options?.regions) {
    allowedCountries = new Set<string>();
    for (const r of options.regions) {
      const cc = regionCountries[r];
      if (cc) for (const c of cc) allowedCountries.add(c);
    }
  }

  const results: CityResult[] = [];

  // Exact prefix match first, then contains
  const prefixMatches: CityResult[] = [];
  const containsMatches: CityResult[] = [];

  for (const city of cities) {
    if (allowedCountries && !allowedCountries.has(city.country)) continue;
    const nameLower = city.name.toLowerCase();
    if (nameLower.startsWith(q)) {
      prefixMatches.push(city);
    } else if (nameLower.includes(q)) {
      containsMatches.push(city);
    }
  }

  results.push(...prefixMatches, ...containsMatches);
  return results.slice(0, limit);
}

/**
 * Look up a city by exact name (case-insensitive).
 * Returns the first airport code, or "" if not found.
 */
export async function lookupAirportByCity(cityName: string): Promise<string> {
  const { cities } = await loadData();
  const q = cityName.toLowerCase().trim();
  const match = cities.find(c => c.name.toLowerCase() === q);
  return match?.airports[0]?.code ?? "";
}

/**
 * Get city info from an airport code.
 */
export async function getCityByAirport(airportCode: string): Promise<CityResult | null> {
  const { airportToCity } = await loadData();
  return airportToCity.get(airportCode) ?? null;
}
