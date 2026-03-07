"use client";

function SkeletonPulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

function SkeletonLeg({ isLast }: { isLast: boolean }) {
  return (
    <div className="relative">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
          <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-2 ring-slate-100" />
          {!isLast && <div className="w-0.5 h-full min-h-[3rem] bg-slate-100 mt-1" />}
        </div>
        <div className="flex-1 pb-4">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-4 w-8" />
            <div className="text-slate-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 12h14m-4-4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <SkeletonPulse className="h-4 w-20" />
            <SkeletonPulse className="h-4 w-8" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <SkeletonPulse className="h-3.5 w-14" />
            <SkeletonPulse className="h-3.5 w-20" />
            <SkeletonPulse className="h-3.5 w-10" />
            <SkeletonPulse className="h-3.5 w-8" />
            <SkeletonPulse className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ legCount }: { legCount: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 animate-pulse" />
          <SkeletonPulse className="h-5 w-20 rounded-full" />
        </div>
        <div className="text-right">
          <SkeletonPulse className="h-6 w-16 ml-auto" />
          <SkeletonPulse className="h-3.5 w-24 mt-1 ml-auto" />
        </div>
      </div>

      {/* Legs */}
      <div className="px-5 pt-4 pb-2">
        {Array.from({ length: legCount }).map((_, i) => (
          <SkeletonLeg key={i} isLast={i === legCount - 1} />
        ))}
        {/* Final destination */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-white ring-2 ring-slate-100" />
          <SkeletonPulse className="h-4 w-36" />
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}

type RouteSkeletonsProps = {
  fromCity: string;
  targetCity: string;
};

export default function RouteSkeletons({ fromCity, targetCity }: RouteSkeletonsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center pb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          Searching routes from {fromCity}
        </h2>
        <p className="text-sm text-slate-500">
          to {targetCity || "Europe"} — checking prices...
        </p>
      </div>

      {/* Show 3 skeleton cards with varying leg counts */}
      <SkeletonCard legCount={2} />
      <SkeletonCard legCount={3} />
      <SkeletonCard legCount={2} />
    </div>
  );
}
