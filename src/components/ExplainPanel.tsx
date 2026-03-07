"use client";

import { useState } from "react";
import type { ExplainTrace, ExplainStep } from "@/lib/route-engine";

// Step labels and colors for visual distinction
const STEP_META: Record<string, { label: string; color: string }> = {
  "1_dates": { label: "Dates & Config", color: "bg-slate-500" },
  "2_ground_bfs": { label: "Ground BFS", color: "bg-amber-500" },
  "3_layer1": { label: "Layer 1 — Direct flights", color: "bg-blue-500" },
  "4_layer2": { label: "Layer 2 — 1-stop", color: "bg-indigo-500" },
  "5_layer3": { label: "Layer 3 — 2-stop", color: "bg-purple-500" },
  "6_pricing": { label: "Price Fetching", color: "bg-emerald-500" },
  "7_assembly": { label: "Route Assembly", color: "bg-orange-500" },
  "8_scoring": { label: "Scoring & Ranking", color: "bg-rose-500" },
  "8b_fifth_freedom": { label: "5th Freedom Routes", color: "bg-pink-500" },
};

function StepCard({ step, defaultOpen }: { step: ExplainStep; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = STEP_META[step.step] ?? { label: step.step, color: "bg-gray-500" };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${meta.color}`} />
        <span className="text-xs font-semibold text-slate-700 flex-1">{meta.label}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-slate-100">
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{step.detail}</p>
          {step.data !== undefined && step.data !== null ? (
            <pre className="mt-2 text-[11px] leading-snug text-slate-500 bg-slate-50 rounded-md p-2 overflow-x-auto max-h-[400px] overflow-y-auto">
              {JSON.stringify(step.data, null, 2)}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function ExplainPanel({ trace }: { trace: ExplainTrace | null }) {
  if (!trace) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-700 font-medium">No explain trace available</p>
        <p className="text-xs text-amber-500 mt-1">Run a search to see the algorithm reasoning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-amber-800">Engine Trace</span>
          <span className="text-[10px] font-mono text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
            {trace.summary.wallTimeMs}ms
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-slate-800">{trace.summary.candidatePaths}</div>
            <div className="text-[10px] text-slate-500">candidates</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{trace.summary.uniqueEdges}</div>
            <div className="text-[10px] text-slate-500">edges</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600">{trace.summary.edgesPriced}</div>
            <div className="text-[10px] text-slate-500">priced</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{trace.summary.routesReturned}</div>
            <div className="text-[10px] text-slate-500">returned</div>
          </div>
        </div>
        {trace.summary.edgesMissing > 0 && (
          <div className="mt-1 text-[10px] text-red-600 text-center">
            {trace.summary.edgesMissing} edge(s) had no price
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {trace.steps.map((step, i) => (
          <StepCard key={step.step + i} step={step} defaultOpen={false} />
        ))}
      </div>
    </div>
  );
}
