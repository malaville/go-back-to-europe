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
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity || !deadlineDate) return;
    onSearch({ fromCity, targetCity, nationality, deadlineDate, flexDays });
  };

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => date.toISOString().split("T")[0];

  // Calculate deadline dates
  const today = new Date();
  const dateNow = formatDate(today);
  const date7Days = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return formatDate(d);
  })();
  const date14Days = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 14);
    return formatDate(d);
  })();
  const date30Days = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 30);
    return formatDate(d);
  })();

  // Min date for custom picker
  const defaultMinDate = new Date();
  defaultMinDate.setDate(defaultMinDate.getDate() + 1);
  const minDate = formatDate(defaultMinDate);

  // Handle quick-select button
  const handleQuickSelect = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    setDeadlineDate(formatDate(d));
    setFlexDays(7);
    setShowCustomDatePicker(false);
  };

  // Format deadline for display
  const deadlineDisplay = deadlineDate
    ? new Date(deadlineDate).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })
    : "";

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

      {/* Deadline Date - Quick Select Buttons */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          I need to be home by
          {deadlineDate && <span className="text-blue-600 font-semibold ml-2">{deadlineDisplay}</span>}
        </label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => handleQuickSelect(0)}
            className={`rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              deadlineDate === dateNow
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(7)}
            className={`rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              deadlineDate === date7Days
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Less than 7 days
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(14)}
            className={`rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              deadlineDate === date14Days
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            In two weeks
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(30)}
            className={`rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              deadlineDate === date30Days
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            In one month
          </button>
        </div>

        {/* Custom Date Picker */}
        <div>
          <button
            type="button"
            onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
            className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            {showCustomDatePicker ? "Close" : "Before a specific date..."}
          </button>
          {showCustomDatePicker && (
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => {
                setDeadlineDate(e.target.value);
                setFlexDays(7);
              }}
              min={minDate}
              className="w-full mt-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          )}
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
