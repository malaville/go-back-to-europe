"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchForm, { type SearchFormData } from "@/components/SearchForm";
import RouteResults from "@/components/RouteResults";
import RouteSkeletons from "@/components/RouteSkeletons";
import ExplainPanel from "@/components/ExplainPanel";
import type { RouteOption } from "@/data/route-types";
import type { ExplainTrace } from "@/lib/route-engine";

function useExplainToggle() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+Shift+F (Mac) or Ctrl+Shift+F (Windows)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (params.get("explain") === "true") {
          params.delete("explain");
        } else {
          params.set("explain", "true");
        }
        const qs = params.toString();
        router.replace(qs ? `?${qs}` : "/", { scroll: false });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchParams, router]);
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

function useSearchState() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const explainMode = searchParams.get("explain") === "true";

  const getInitialData = useCallback((): SearchFormData | null => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const nat = searchParams.get("nat");
    const date = searchParams.get("date");
    const flex = searchParams.get("flex");
    const land = searchParams.get("land");
    if (!from || !date) return null;
    return {
      fromCity: from,
      targetCity: to || "",
      nationality: nat || "FR",
      deadlineDate: date,
      flexDays: flex ? Number(flex) : 7,
      longLandTransport: land === "1",
    };
  }, [searchParams]);

  const setParams = useCallback((data: SearchFormData) => {
    const params = new URLSearchParams();
    params.set("from", data.fromCity);
    if (data.targetCity) params.set("to", data.targetCity);
    params.set("nat", data.nationality);
    params.set("date", data.deadlineDate);
    params.set("flex", String(data.flexDays));
    if (data.longLandTransport) params.set("land", "1");
    if (explainMode) params.set("explain", "true");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, explainMode]);

  const clearParams = useCallback(() => {
    router.replace(explainMode ? "/?explain=true" : "/", { scroll: false });
  }, [router, explainMode]);

  return { getInitialData, setParams, clearParams, explainMode };
}

function Home() {
  useExplainToggle();
  const { getInitialData, setParams, clearParams, explainMode } = useSearchState();
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchData, setSearchData] = useState<SearchFormData | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [explainTrace, setExplainTrace] = useState<ExplainTrace | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Re-run search from URL params on mount
  useEffect(() => {
    const initial = getInitialData();
    if (initial && !hasSearched && !isSearching) {
      handleSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (data: SearchFormData) => {
    setIsSearching(true);
    setSearchData(data);
    setSearchError(null);
    setExplainTrace(null);
    setParams(data);

    try {
      if (explainMode) {
        // Fetch from explain endpoint
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

        // Also fetch normal search results for the route cards
        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!searchRes.ok) throw new Error("Search failed");
        setRoutes(await searchRes.json());
      } else {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Search failed");
        setRoutes(await res.json());
      }
    } catch {
      setSearchError("Could not search routes. Please try again.");
      setRoutes([]);
      setExplainTrace(null);
    }

    setHasSearched(true);
    setIsSearching(false);
  };

  // Explain mode: side-by-side layout
  if (explainMode) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 19V5m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Go Back to Europe
                <span className="ml-2 text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">DEBUG</span>
              </h1>
              <p className="text-xs text-slate-500">Explain mode — route engine reasoning trace</p>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {/* Back button */}
          {(hasSearched || isSearching) && (
            <button
              onClick={() => {
                setHasSearched(false);
                setSearchData(null);
                setIsSearching(false);
                setExplainTrace(null);
                clearParams();
              }}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New search
            </button>
          )}

          {/* Search Form (centered, narrower) */}
          {!hasSearched && !isSearching && (
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <SearchForm onSearch={handleSearch} isSearching={isSearching} initialData={getInitialData()} />
              </div>
            </div>
          )}

          {/* Skeleton */}
          {isSearching && searchData && (
            <div className="max-w-lg mx-auto">
              <RouteSkeletons fromCity={searchData.fromCity} targetCity={searchData.targetCity} />
            </div>
          )}

          {/* Split view: routes left, explain right */}
          {hasSearched && !isSearching && searchData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: routes */}
              <div className="min-w-0">
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
              </div>

              {/* Right: explain panel */}
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

  // Normal mode (unchanged)
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 19V5m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Go Back to Europe
            </h1>
            <p className="text-xs text-slate-500">Fly home safe — avoid conflict zones</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Hero — only before search */}
        {!hasSearched && !isSearching && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 leading-snug">
              Fly home — avoid conflict zones
            </h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
              Safe, affordable multi-leg routes from Southeast Asia
              to Europe. No Middle East overflights. Visa checks included.
            </p>
          </div>
        )}

        {/* Back button when showing results or searching */}
        {(hasSearched || isSearching) && (
          <button
            onClick={() => {
              setHasSearched(false);
              setSearchData(null);
              setIsSearching(false);
              clearParams();
            }}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New search
          </button>
        )}

        {/* Search Form */}
        {!hasSearched && !isSearching && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <SearchForm onSearch={handleSearch} isSearching={isSearching} initialData={getInitialData()} />
          </div>
        )}

        {/* Skeleton loader while searching */}
        {isSearching && searchData && (
          <RouteSkeletons fromCity={searchData.fromCity} targetCity={searchData.targetCity} />
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
          </>
        )}

        {/* Trust signals */}
        {!hasSearched && !isSearching && (
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white border border-slate-100 p-3">
              <div className="text-blue-600 flex justify-center mb-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-700">Safety checked</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Avoids conflict zones</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-3">
              <div className="text-blue-600 flex justify-center mb-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-700">Budget-friendly</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Multi-leg savings</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-100 p-3">
              <div className="text-blue-600 flex justify-center mb-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-700">Visa-aware</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Per-country checks</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-4">
        <div className="max-w-lg mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            Go Back to Europe is a community tool. Always verify travel information
            with official sources before booking.
          </p>
        </div>
      </footer>
    </div>
  );
}
