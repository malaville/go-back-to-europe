"use client";

import { useState } from "react";
import Link from "next/link";

const INTERESTS = [
  {
    id: "route_alerts",
    label: "Route alerts",
    desc: "Get notified when cheaper or faster routes open for your trip",
  },
  {
    id: "beta_tester",
    label: "Beta tester",
    desc: "Help shape the tool — test new features before anyone else",
  },
  {
    id: "community",
    label: "Connect with travelers",
    desc: "Find others flying the same route — share tips, split taxis",
  },
];

export default function CommunityPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [nationality, setNationality] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string[]>(["route_alerts"]);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "exists" | "error">("idle");

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          fromCity: fromCity || undefined,
          toCity: toCity || undefined,
          nationality: nationality || undefined,
          interests: selected,
          message: message || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data.message === "already_signed_up" ? "exists" : "done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 19V5m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Skip the Gulf</h1>
              <p className="text-xs text-slate-500">Fly Asia to Europe — no Gulf carriers</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Back link */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to search
        </Link>

        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
            You&apos;re not alone in this
          </h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
            Hundreds of travelers are searching for the same routes right now.
            Stay in the loop — and help us build a better tool.
          </p>
        </div>

        {/* Success state */}
        {(status === "done" || status === "exists") && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
            <div className="text-blue-600 flex justify-center mb-3">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {status === "exists" ? "You're already signed up!" : "You're in!"}
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              {status === "exists"
                ? "We already have your email. We'll be in touch soon."
                : "We'll reach out soon. In the meantime, find your route home."}
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Search routes
            </Link>
          </div>
        )}

        {/* Form */}
        {status !== "done" && status !== "exists" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Interest cards */}
            <div className="space-y-2.5">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggle(interest.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selected.includes(interest.id)
                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected.includes(interest.id)
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300"
                      }`}
                    >
                      {selected.includes(interest.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{interest.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{interest.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Email (required) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email <span className="text-slate-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Name (optional) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                First name <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Trip info row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="from" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Stuck in
                </label>
                <input
                  id="from"
                  type="text"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  placeholder="e.g. Bangkok"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Heading to
                </label>
                <input
                  id="to"
                  type="text"
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  placeholder="e.g. Paris"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Nationality */}
            <div>
              <label htmlFor="nat" className="block text-sm font-medium text-slate-700 mb-1.5">
                Passport <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="nat"
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g. FR, NL, GB"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="msg" className="block text-sm font-medium text-slate-700 mb-1.5">
                Anything we should know? <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Your situation, what you need, ideas for the tool..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Error */}
            {status === "error" && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                Something went wrong. Try again?
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "sending" || !email}
              className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "sending" ? "Joining..." : "Join the community"}
            </button>

            <p className="text-xs text-slate-400 text-center">
              No spam, ever. Just route updates and an occasional question from us.
            </p>
          </form>
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
