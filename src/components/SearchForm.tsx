"use client";

import { useState } from "react";
import CityAutocomplete from "./CityAutocomplete";
import { euNationalities } from "@/data/nationalities";

export type SearchFormData = {
  fromCity: string;
  targetCity: string;
  nationality: string;
  deadlineDate: string;
  flexDays: number;
};

type SearchFormProps = {
  onSearch: (data: SearchFormData) => void;
  isSearching: boolean;
  initialData?: SearchFormData | null;
};

export default function SearchForm({ onSearch, isSearching, initialData }: SearchFormProps) {
  const [fromCity, setFromCity] = useState(initialData?.fromCity ?? "");
  const [targetCity, setTargetCity] = useState(initialData?.targetCity ?? "");
  const [nationality, setNationality] = useState(initialData?.nationality ?? "FR");
  const [deadlineDate, setDeadlineDate] = useState(initialData?.deadlineDate ?? "");
  const [flexDays, setFlexDays] = useState(initialData?.flexDays ?? 7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity || !deadlineDate) return;
    onSearch({ fromCity, targetCity, nationality, deadlineDate, flexDays });
  };

  // Default date: 14 days from now
  const defaultMinDate = new Date();
  defaultMinDate.setDate(defaultMinDate.getDate() + 1);
  const minDate = defaultMinDate.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* From City */}
      <CityAutocomplete
        id="from-city"
        label="Where are you now?"
        placeholder="e.g., Ho Chi Minh City, Bangkok..."
        region="sea,east_asia"
        value={fromCity}
        onChange={setFromCity}
      />

      {/* Target City */}
      <CityAutocomplete
        id="target-city"
        label="Where in Europe?"
        placeholder="e.g., Paris, Amsterdam..."
        region="europe"
        value={targetCity}
        onChange={setTargetCity}
        allowAnywhere
      />

      {/* Nationality */}
      <div>
        <label htmlFor="nationality" className="block text-sm font-medium text-slate-700 mb-1.5">
          Your nationality
        </label>
        <select
          id="nationality"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
        >
          {euNationalities.map((nat) => (
            <option key={nat.code} value={nat.code}>
              {nat.name} ({nat.code})
            </option>
          ))}
        </select>
      </div>

      {/* Deadline Date */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1.5">
          I need to be home by
        </label>
        <input
          id="deadline"
          type="date"
          value={deadlineDate}
          onChange={(e) => setDeadlineDate(e.target.value)}
          min={minDate}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Flexibility Window */}
      <div>
        <label htmlFor="flex-days" className="block text-sm font-medium text-slate-700 mb-1.5">
          Flexibility: I can leave up to{" "}
          <span className="font-semibold text-blue-600">{flexDays} days</span> before deadline
        </label>
        <input
          id="flex-days"
          type="range"
          min={1}
          max={30}
          value={flexDays}
          onChange={(e) => setFlexDays(Number(e.target.value))}
          className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>1 day</span>
          <span>15 days</span>
          <span>30 days</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!fromCity || !deadlineDate || isSearching}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isSearching ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching routes...
          </span>
        ) : (
          "Find my way home"
        )}
      </button>
    </form>
  );
}
