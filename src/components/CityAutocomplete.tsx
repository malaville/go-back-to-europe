"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { cities as allCities } from "@/data/cities";

type CityOption = {
  name: string;
  country: string;
};

type CityAutocompleteProps = {
  label: string;
  placeholder: string;
  region?: string; // comma-separated: "sea" | "europe" | "east_asia"
  value: string;
  onChange: (value: string) => void;
  allowAnywhere?: boolean;
  id: string;
};

// Country code → display name
const COUNTRY_NAMES: Record<string, string> = {
  TH: "Thailand", VN: "Vietnam", KH: "Cambodia", LA: "Laos",
  MM: "Myanmar", MY: "Malaysia", SG: "Singapore", ID: "Indonesia",
  PH: "Philippines", KR: "South Korea", JP: "Japan", TW: "Taiwan",
  FR: "France", NL: "Netherlands", GB: "United Kingdom", DE: "Germany",
  IT: "Italy", ES: "Spain", PT: "Portugal", PL: "Poland",
  HU: "Hungary", CZ: "Czech Republic", AT: "Austria", BE: "Belgium",
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
  const [apiResults, setApiResults] = useState<CityOption[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter cities client-side — instant, no API call
  const regionSet = useMemo(
    () => (region ? new Set(region.split(",")) : null),
    [region]
  );

  const filteredCities = useMemo(() => {
    let pool = allCities;
    if (regionSet) {
      pool = pool.filter((c) => regionSet.has(c.region));
    }
    if (!query.trim()) return pool.map((c) => ({ name: c.name, country: COUNTRY_NAMES[c.country] || c.country }));

    const q = query.toLowerCase();
    return pool
      .filter((c) => c.name.toLowerCase().includes(q))
      .map((c) => ({ name: c.name, country: COUNTRY_NAMES[c.country] || c.country }));
  }, [query, regionSet]);

  // Fallback to API when static list has <2 results and user typed 2+ chars
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
          })));
        }
      } catch { /* silent */ }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filteredCities.length, region]);

  // Merge: static first, then API results not already in static
  const displayCities = useMemo(() => {
    const staticNames = new Set(filteredCities.map((c) => c.name));
    const extra = apiResults.filter((c) => !staticNames.has(c.name));
    return [...filteredCities, ...extra];
  }, [filteredCities, apiResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleSelect = (cityName: string) => {
    setQuery(cityName);
    onChange(cityName);
    setIsOpen(false);
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
        onFocus={handleFocus}
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
          {displayCities.map((city) => (
            <li key={city.name}>
              <button
                type="button"
                onClick={() => handleSelect(city.name)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-slate-900">{city.name}</span>
                <span className="ml-2 text-slate-400">{city.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
