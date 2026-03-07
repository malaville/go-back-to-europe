"use client";

import type { RouteOption, RouteLeg } from "@/data/mock-routes";

function transportIcon(transport: RouteLeg["transport"]) {
  switch (transport) {
    case "flight":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M12 19V5m0 0l-4 4m4-4l4 4" />
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      );
    case "bus":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="4" y="3" width="16" height="14" rx="2" />
          <path d="M4 11h16M8 17v2m8-2v2" strokeLinecap="round" />
        </svg>
      );
    case "train":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="5" y="2" width="14" height="16" rx="2" />
          <path d="M12 18v4m-4-4l-2 4m10-4l-2 4M9 14h.01M15 14h.01" strokeLinecap="round" />
        </svg>
      );
    case "ferry":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M2 20s3-2 5-2 4 2 5 2 3-2 5-2 5 2 5 2M4 16l1.5-9h13L20 16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function visaBadge(status: RouteLeg["visaStatus"], note?: string) {
  const configs = {
    free: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Visa-free" },
    evisa: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "E-visa" },
    easy: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Easy visa" },
    warning: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Warning" },
    hard: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Hard visa" },
    none: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", label: "Home" },
  };

  const config = configs[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
      title={note}
    >
      {config.label}
    </span>
  );
}

function LegCard({ leg, isLast }: { leg: RouteLeg; isLast: boolean }) {
  return (
    <div className="relative">
      <div className="flex items-start gap-3">
        {/* Timeline dot + line */}
        <div className="flex flex-col items-center pt-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm ring-2 ring-blue-200" />
          {!isLast && <div className="w-0.5 h-full min-h-[3rem] bg-blue-200 mt-1" />}
        </div>

        {/* Leg details */}
        <div className="flex-1 pb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <span>{leg.from}</span>
            <span className="text-slate-300">{leg.fromCode}</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14m-4-4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{leg.to}</span>
            <span className="text-slate-300">{leg.toCode}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 capitalize">
              {transportIcon(leg.transport)}
              {leg.transport}
            </span>
            {leg.airline && (
              <span className="text-slate-400">/ {leg.airline}</span>
            )}
            <span className="font-medium text-slate-600">{leg.duration}</span>
            <span className="font-semibold text-slate-800">${leg.price}</span>
            {visaBadge(leg.visaStatus, leg.visaNote)}
          </div>
          {leg.visaNote && leg.visaStatus !== "none" && (
            <p className="mt-1 text-xs text-slate-400">{leg.visaNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route, rank }: { route: RouteOption; rank: number }) {
  const lastLeg = route.legs[route.legs.length - 1];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold">
            {rank}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">${route.totalPrice}</div>
          <div className="text-xs text-slate-500">{route.totalDuration}</div>
        </div>
      </div>

      {/* Legs */}
      <div className="px-5 pt-4 pb-2">
        {route.legs.map((leg, i) => (
          <LegCard key={`${leg.fromCode}-${leg.toCode}`} leg={leg} isLast={i === route.legs.length - 1} />
        ))}

        {/* Final destination dot */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-2 ring-emerald-200" />
          </div>
          <span className="text-sm font-medium text-emerald-700">
            {lastLeg.to} — You made it!
          </span>
        </div>
      </div>

      {/* Warnings */}
      {route.warnings.length > 0 && (
        <div className="mx-5 mb-4 mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          {route.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type RouteResultsProps = {
  routes: RouteOption[];
  fromCity: string;
  targetCity: string;
};

export default function RouteResults({ routes, fromCity, targetCity }: RouteResultsProps) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">...</div>
        <h3 className="text-lg font-semibold text-slate-700">No routes found</h3>
        <p className="text-sm text-slate-500 mt-1">Try adjusting your dates or destination.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center pb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          {routes.length} routes from {fromCity}
        </h2>
        <p className="text-sm text-slate-500">
          to {targetCity || "Europe"} — sorted by best value
        </p>
      </div>

      {routes.map((route, i) => (
        <RouteCard key={route.id} route={route} rank={i + 1} />
      ))}

      <p className="text-center text-xs text-slate-400 pt-2">
        Prices are estimates and may vary. Always check visa requirements with your embassy before traveling.
      </p>
    </div>
  );
}
