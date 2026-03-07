"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { cities as allCities } from "@/data/cities";

type CityEntry = {
  name: string;
  country: string;
  aliases: string[];
};

type CityAutocompleteProps = {
  label: string;
  placeholder: string;
  region?: string;
  value: string;
  onChange: (value: string) => void;
  allowAnywhere?: boolean;
  id: string;
};

const COUNTRY_NAMES: Record<string, string> = {
  TH: "Thailand", VN: "Vietnam", KH: "Cambodia", LA: "Laos",
  MM: "Myanmar", MY: "Malaysia", SG: "Singapore", ID: "Indonesia",
  PH: "Philippines", KR: "South Korea", JP: "Japan", TW: "Taiwan",
  FR: "France", NL: "Netherlands", GB: "United Kingdom", DE: "Germany",
  IT: "Italy", ES: "Spain", PT: "Portugal", PL: "Poland",
  HU: "Hungary", CZ: "Czech Republic", AT: "Austria", BE: "Belgium",
};

// Alternate names, common misspellings, local names
const CITY_ALIASES: Record<string, string[]> = {
  "Ho Chi Minh City": ["Saigon", "HCMC", "HCM", "Ho Chi Min", "Hochi Minh", "Hochimin"],
  "Bangkok": ["Krung Thep", "BKK", "Bankok", "Bangok"],
  "Hanoi": ["Ha Noi"],
  "Da Lat": ["Dalat", "Da lat", "Đà Lạt"],
  "Chiang Mai": ["Chiangmai", "Chang Mai", "Chaing Mai", "Chiang Rai"],
  "Kuala Lumpur": ["KL", "Kualalumpur"],
  "Singapore": ["SG", "Singapour", "Singapur"],
  "Phnom Penh": ["Pnom Penh", "Phnompenh", "Phom Penh"],
  "Bali": ["Denpasar", "DPS"],
  "Seoul": ["Séoul"],
  "Tokyo": ["Tokio"],
  "Taipei": ["Taïpei", "Taipeï"],
  "Paris": ["CDG", "Orly"],
  "Amsterdam": ["AMS", "Schiphol"],
  "London": ["LHR", "Londres", "Gatwick", "Heathrow"],
  "Brussels": ["Bruxelles", "Brussel"],
  "Prague": ["Praha"],
  "Budapest": ["Buda"],
  "Warsaw": ["Varsovie", "Warszawa"],
  "Vienna": ["Vienne", "Wien"],
  "Rome": ["Roma"],
  "Milan": ["Milano"],
  "Barcelona": ["Barcelone", "Barca"],
  "Madrid": ["Madrd"],
  "Lisbon": ["Lisboa", "Lisbonne"],
  "Berlin": ["Berlín"],
  "Lyon": [],
  "Manila": ["Manille"],
  "Vientiane": ["Vientianne", "Vientiane"],
  "Yangon": ["Rangoon", "Rangoun"],
};

export default function CityAutocomplete({
  label,
  placeholder,
  region,
  value,
  onChange,
  allowAnywhere = false,
  id,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [apiResults, setApiResults] = useState<CityEntry[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const regionSet = useMemo(
    () => (region ? new Set(region.split(",")) : null),
    [region]
  );

  // Build the fuse index from static cities + aliases
  const { fuse, pool } = useMemo(() => {
    let filtered = allCities;
    if (regionSet) {
      filtered = filtered.filter((c) => regionSet.has(c.region));
    }
    const entries: CityEntry[] = filtered.map((c) => ({
      name: c.name,
      country: COUNTRY_NAMES[c.country] || c.country,
      aliases: CITY_ALIASES[c.name] || [],
    }));
    const f = new Fuse(entries, {
      keys: ["name", "aliases", "country"],
      threshold: 0.35,
      distance: 100,
      includeScore: true,
    });
    return { fuse: f, pool: entries };
  }, [regionSet]);

  const filteredCities = useMemo(() => {
    if (!query.trim()) return pool;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, pool]);

  // Fallback to API when <2 results and 2+ chars typed
  useEffect(() => {
    if (filteredCities.length >= 2 || query.trim().length < 2) {
      setApiResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.set("q", query);
        if (region) params.set("region", region);
        const res = await fetch(`/api/cities?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setApiResults(data.map((c: { name: string; country: string }) => ({
            name: c.name,
            country: COUNTRY_NAMES[c.country] || c.country,
            aliases: [],
          })));
        }
      } catch { /* silent */ }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filteredCities.length, region]);

  const displayCities = useMemo(() => {
    const names = new Set(filteredCities.map((c) => c.name));
    const extra = apiResults.filter((c) => !names.has(c.name));
    return [...filteredCities, ...extra];
  }, [filteredCities, apiResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (cityName: string) => {
    setQuery(cityName);
    onChange(cityName);
    setIsOpen(false);
  };

  // Find which alias matched (to show "aka Saigon" hint)
  const matchedAlias = (city: CityEntry): string | null => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    if (city.name.toLowerCase().includes(q)) return null;
    return city.aliases.find((a) => a.toLowerCase().includes(q)) || null;
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {isOpen && (displayCities.length > 0 || allowAnywhere) && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {allowAnywhere && (
            <li>
              <button
                type="button"
                onClick={() => handleSelect("Anywhere in Europe")}
                className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors text-blue-600 font-medium"
              >
                Anywhere in Europe
              </button>
            </li>
          )}
          {displayCities.map((city) => {
            const alias = matchedAlias(city);
            return (
              <li key={city.name}>
                <button
                  type="button"
                  onClick={() => handleSelect(city.name)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors"
                >
                  <span className="font-medium text-slate-900">{city.name}</span>
                  {alias && <span className="ml-1 text-slate-400 text-xs">({alias})</span>}
                  <span className="ml-2 text-slate-400">{city.country}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
