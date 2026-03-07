"use client";

import { useState, useEffect, useRef } from "react";

type City = {
  id: string;
  name: string;
  country: string;
  region: string;
};

type CityAutocompleteProps = {
  label: string;
  placeholder: string;
  region?: string; // filter by region, e.g., "sea" | "europe"
  value: string;
  onChange: (value: string) => void;
  allowAnywhere?: boolean; // show "Anywhere in Europe" option
  id: string;
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
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastFetchedQuery = useRef<string | null>(null);

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

  const fetchCities = async (searchQuery: string, { skipCache = false } = {}) => {
    if (!skipCache && lastFetchedQuery.current === searchQuery && suggestions.length > 0) {
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (region) params.set("region", region);
      const response = await fetch(`/api/cities?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        lastFetchedQuery.current = searchQuery;
      }
    } catch {
      // Silently fail — user can still type
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCities(val);
    }, 200);
  };

  const handleFocus = () => {
    setIsOpen(true);
    fetchCities(query);
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
      {isOpen && (suggestions.length > 0 || allowAnywhere || isLoading) && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {isLoading && (
            <li className="px-4 py-3 text-sm text-slate-400">Searching...</li>
          )}
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
          {suggestions.map((city) => (
            <li key={city.id}>
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
