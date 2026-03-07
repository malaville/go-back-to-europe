"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import SearchForm, { type SearchFormData } from "@/components/SearchForm";
import RouteResults from "@/components/RouteResults";
import RouteSkeletons from "@/components/RouteSkeletons";
import ExplainPanel from "@/components/ExplainPanel";
import type { RouteOption } from "@/data/route-types";
import type { ExplainTrace } from "@/lib/route-engine";

function useSearchState() {
  const searchParams = useSearchParams();

  const explainMode = searchParams.get("explain") === "true";

  const getFormData = useCallback((): SearchFormData | null => {
    const from = searchParams.get("from");
    const date = searchParams.get("date");
    if (!from || !date) return null;
    return {
      fromCity: from,
      targetCity: searchParams.get("to") || "",
      nationality: searchParams.get("nat") || "FR",
      deadlineDate: date,
      flexDays: searchParams.get("flex") ? Number(searchParams.get("flex")) : 7,
      longLandTransport: searchParams.get("land") === "1",
    };
  }, [searchParams]);

  return { getFormData, explainMode };
}

function SearchPage() {
  const router = useRouter();
  const { getFormData, explainMode } = useSearchState();

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchData, setSearchData] = useState<SearchFormData | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [highlighted, setHighlighted] = useState<RouteOption[]>([]);
  const [explainTrace, setExplainTrace] = useState<ExplainTrace | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const runSearch = useCallback(async (data: SearchFormData, explain: boolean) => {
    setIsSearching(true);
    setSearchData(data);
    setSearchError(null);
    setExplainTrace(null);

    try {
      if (explain) {
        const params = new URLSearchParams({
          from: data.fromCity,
          to: data.targetCity || "",
          nat: data.nationality,
          date: data.deadlineDate,
          flex: String(data.flexDays),
          ...(data.longLandTransport ? { land: "1" } : {}),
        });
        const res = await fetch(`/api/explain?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const json = await res.json();
        setExplainTrace(json.explain ?? null);

        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!searchRes.ok) throw new Error("Search failed");
        const searchJson = await searchRes.json();
        setRoutes(searchJson.routes ?? searchJson);
        setHighlighted(searchJson.highlighted ?? []);
      } else {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Search failed");
        const json = await res.json();
        setRoutes(json.routes ?? json);
        setHighlighted(json.highlighted ?? []);
      }
    } catch {
      setSearchError("Could not search routes. Please try again.");
      setRoutes([]);
      setHighlighted([]);
      setExplainTrace(null);
    }

    setHasSearched(true);
    setIsSearching(false);
  }, []);

  // Run search from URL params on mount
  useEffect(() => {
    const data = getFormData();
    if (data && !hasSearched && !isSearching) {
      runSearch(data, explainMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewSearch = (data: SearchFormData) => {
    // Update URL, then re-run
    const params = new URLSearchParams();
    params.set("from", data.fromCity);
    if (data.targetCity) params.set("to", data.targetCity);
    params.set("nat", data.nationality);
    params.set("date", data.deadlineDate);
    params.set("flex", String(data.flexDays));
    if (data.longLandTransport) params.set("land", "1");
    if (explainMode) params.set("explain", "true");
    router.replace(`/search?${params.toString()}`, { scroll: false });
    runSearch(data, explainMode);
  };

  const formData = getFormData();

  // Explain mode layout
  if (explainMode) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 19V5m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Skip the Gulf
                  <span className="ml-2 text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">DEBUG</span>
                </h1>
                <p className="text-xs text-slate-500">Explain mode — route engine reasoning trace</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New search
          </Link>

          {isSearching && searchData && (
            <div className="max-w-lg mx-auto">
              <RouteSkeletons fromCity={searchData.fromCity} targetCity={searchData.targetCity} />
            </div>
          )}

          {hasSearched && !isSearching && searchData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="min-w-0">
                {searchError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 text-sm text-red-700">
                    {searchError}
                  </div>
                )}
                <RouteResults
                  routes={routes}
                  highlighted={highlighted}
                  fromCity={searchData.fromCity}
                  targetCity={searchData.targetCity}
                />
              </div>
              <div className="min-w-0">
                <ExplainPanel trace={explainTrace} />
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-slate-100 bg-white py-4">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs text-slate-400">
              Debug mode — showing route engine reasoning. Remove &explain=true from URL for normal view.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Normal mode
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 19V5m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Skip the Gulf
              </h1>
              <p className="text-xs text-slate-500">Fly Asia to Europe — no Gulf carriers</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Refine search — collapsed form at top */}
        {hasSearched && !isSearching && (
          <div className="mb-4">
            <details className="group">
              <summary className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 cursor-pointer transition-colors list-none">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refine search
              </summary>
              <div className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SearchForm onSearch={handleNewSearch} isSearching={false} initialData={formData} />
              </div>
            </details>
          </div>
        )}

        {/* Skeleton loader while searching */}
        {isSearching && searchData && (
          <RouteSkeletons fromCity={searchData.fromCity} targetCity={searchData.targetCity} />
        )}

        {/* No params — redirect home */}
        {!formData && !isSearching && !hasSearched && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm mb-4">No search parameters provided.</p>
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Go to search
            </Link>
          </div>
        )}

        {/* Results */}
        {hasSearched && !isSearching && searchData && (
          <>
            {searchError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 text-sm text-red-700">
                {searchError}
              </div>
            )}
            <RouteResults
              routes={routes}
              fromCity={searchData.fromCity}
              targetCity={searchData.targetCity}
            />

            {/* Community CTA */}
            {routes.length > 0 && (
              <Link href="/community" className="block mt-6">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 hover:bg-blue-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Others are searching this route too</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Get price alerts, connect with travelers on the same route, or help us improve the tool.
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-2">Join the community &rarr;</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-4">
        <div className="max-w-lg mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            Skip the Gulf is a community tool. Always verify travel information
            with official sources before booking.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
