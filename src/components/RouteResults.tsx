"use client";

import type { RouteOption, RouteLeg } from "@/data/route-types";
import { activeAdvisories } from "@/data/advisories";
import { googleFlightsUrl } from "@/lib/google-flights-url";

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

function ticketTypeBadge(type: RouteOption["ticketType"]) {
  if (type === "single-carrier") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Protected connection
      </span>
    );
  }
  if (type === "alliance") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-700">
        Alliance — ask about through-booking
      </span>
    );
  }
  return null;
}

function formatLegDate(isoDate?: string): string | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(isoDate?: string): string | null {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "up to 1 day";
  return `up to ${days} days`;
}

function LegCard({ leg, isLast, departureDate, isFirstGround, firstFlightDate }: { leg: RouteLeg; isLast: boolean; departureDate?: string; isFirstGround?: boolean; firstFlightDate?: string }) {
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
              <span className="text-slate-400">
                / {leg.airline}
                {leg.airlineCode && <span className="text-slate-300 ml-0.5">({leg.airlineCode})</span>}
              </span>
            )}
            <span className="font-medium text-slate-600">{leg.duration}</span>
            <span className="font-semibold text-slate-800">€{leg.price}</span>
            {leg.transport === "flight" && leg.departDate && (
              <span className="text-slate-400">{formatLegDate(leg.departDate)}</span>
            )}
            {leg.transport !== "flight" && isFirstGround && firstFlightDate && (
              <span className="text-slate-400">now {daysUntil(firstFlightDate)}</span>
            )}
            {visaBadge(leg.visaStatus, leg.visaNote)}
          </div>
          {/* Hidden stop alert */}
          {leg.hiddenStop && (
            <p className="mt-1 text-xs text-amber-600 font-medium">
              {leg.hiddenStop}
            </p>
          )}
          <div className="mt-1 flex items-center gap-3">
            {leg.visaNote && leg.visaStatus !== "none" && (
              <p className="text-xs text-slate-400">{leg.visaNote}</p>
            )}
            {leg.transport === "flight" && (
              <>
                <a
                  href={googleFlightsUrl(leg.fromCode, leg.toCode, departureDate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 hover:underline shrink-0"
                >
                  Verify price
                </a>
                {leg.searchUrl && (
                  <a
                    href={leg.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-500 hover:text-orange-600 hover:underline shrink-0"
                  >
                    Book this leg
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route, rank }: { route: RouteOption; rank: number }) {
  const lastLeg = route.legs[route.legs.length - 1];
  const isRecommended = route.tags.includes("Recommended");

  // Format departure date
  const departDate = new Date(route.departureDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = departDate.toDateString() === today.toDateString();
  const isTomorrow = departDate.toDateString() === tomorrow.toDateString();
  const departDateStr = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : departDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className={`rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
      isRecommended ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200"
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3 border-b ${
        isRecommended
          ? "bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-100"
          : "bg-gradient-to-r from-blue-50 to-slate-50 border-slate-100"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold ${
            isRecommended ? "bg-emerald-500" : "bg-blue-500"
          }`}>
            {rank}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  tag === "Recommended"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {tag === "Recommended" ? "\u2605 " + tag : tag}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">~€{route.totalPrice}</div>
          <div className="text-xs text-slate-500">{route.estimatedTotalDuration}</div>
          <div className="text-[10px] text-slate-400">
            {departDateStr}
          </div>
          {route.legs.length > 1 && (
            <div className="text-[10px] text-slate-400">{route.totalDuration}</div>
          )}
        </div>
      </div>

      {/* Ticket type indicator */}
      <div className="px-5 pt-2 flex items-center gap-2">
        {ticketTypeBadge(route.ticketType)}
      </div>

      {/* Legs */}
      <div className="px-5 pt-3 pb-2">
        {route.legs.map((leg, i) => {
          const isFirstGround = leg.transport !== "flight" && !route.legs.slice(0, i).some(l => l.transport !== "flight");
          const firstFlightDate = route.legs.find(l => l.transport === "flight")?.departDate ?? route.departureDate;
          return (
            <LegCard key={`${leg.fromCode}-${leg.toCode}`} leg={leg} isLast={i === route.legs.length - 1} departureDate={route.departureDate} isFirstGround={isFirstGround} firstFlightDate={firstFlightDate} />
          );
        })}

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
        <div className="mx-5 mb-3 mt-2 rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1.5">
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

      {/* Pricing note */}
      <div className="px-5 pb-4 pt-1">
        <p className="text-[10px] text-slate-400 text-center">
          Prices are estimates based on recent cached fares — verify and book each leg separately above
        </p>
      </div>
    </div>
  );
}

function CrisisBanner() {
  const advisory = activeAdvisories.find((a) => a.active);
  if (!advisory) return null;

  const severityStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    high: "bg-amber-50 border-amber-200 text-amber-800",
    critical: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={`rounded-xl border p-3 mb-4 ${severityStyles[advisory.severity]}`}>
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-xs leading-relaxed">
          <span className="font-semibold">Travel Advisory: </span>
          {advisory.message}
          {advisory.link && (
            <a
              href={advisory.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline hover:no-underline"
            >
              Source
            </a>
          )}
        </div>
      </div>
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
      <CrisisBanner />

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

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mt-2">
        <p className="text-xs text-blue-700 text-center font-medium">
          All routes skip Gulf carriers (Emirates, Etihad, Qatar, flydubai, Kuwait Airways, etc.) and Middle East hubs
        </p>
      </div>
      <p className="text-center text-xs text-slate-400 pt-2">
        Prices are per-segment estimates from cached data. Click &quot;Search this route&quot; to see through-ticket pricing on Aviasales. Always confirm visa requirements before traveling.
      </p>
    </div>
  );
}
