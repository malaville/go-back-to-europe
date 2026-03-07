"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import SearchForm, { type SearchFormData } from "@/components/SearchForm";

function HomePage() {
  const router = useRouter();

  const handleSearch = (data: SearchFormData) => {
    const params = new URLSearchParams();
    params.set("from", data.fromCity);
    if (data.targetCity) params.set("to", data.targetCity);
    params.set("nat", data.nationality);
    params.set("date", data.deadlineDate);
    params.set("flex", String(data.flexDays));
    if (data.longLandTransport) params.set("land", "1");
    router.push(`/search?${params.toString()}`);
  };

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
              Skip the Gulf
            </h1>
            <p className="text-xs text-slate-500">Fly Asia to Europe — no Gulf carriers</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
            Fly home — skip the Gulf
          </h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
            Safe, affordable multi-leg routes from Southeast Asia
            to Europe. No Gulf carriers or Middle East hubs. Visa checks included.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <SearchForm onSearch={handleSearch} isSearching={false} />
        </div>

        {/* Trust signals */}
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
      <HomePage />
    </Suspense>
  );
}
