import type { Metadata } from "next";
import Link from "next/link";
import { googleFlightsUrl } from "@/lib/google-flights-url";

export const metadata: Metadata = {
  title:
    "Bangkok to Munich Without Gulf Airspace — Routes for Families (2026)",
  description:
    "Etihad cancelled your BKK→MUC flight? The Chengdu trick gets you there for €750/person. Plus Condor nonstop, Tbilisi gateway, and more.",
  keywords: [
    "bangkok to munich flights",
    "BKK MUC no gulf",
    "etihad cancelled bangkok munich",
    "flights thailand germany avoid middle east",
    "bangkok munich without gulf airspace",
    "condor bangkok frankfurt",
    "chengdu munich flights",
  ],
  alternates: {
    canonical: "https://skipthegulf.com/bangkok-to-munich-without-gulf",
  },
  openGraph: {
    title: "Bangkok to Munich Without the Gulf — What Actually Works",
    description:
      "Etihad cancelled your BKK→MUC flight? The Chengdu trick gets you there for €750/person. Plus Condor nonstop, Tbilisi gateway, and more.",
    url: "https://skipthegulf.com/bangkok-to-munich-without-gulf",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bangkok to Munich Without the Gulf — What Actually Works",
    description:
      "Etihad cancelled your BKK→MUC flight? Here are 5 routes that actually work, from €750/person.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Bangkok to Munich Without the Gulf — What Actually Works",
  description:
    "Etihad cancelled your BKK→MUC flight? The Chengdu trick gets you there for €750/person. Plus Condor nonstop, Tbilisi gateway, and more.",
  author: { "@type": "Person", name: "Marc-Antoine" },
  publisher: { "@type": "Organization", name: "Skip the Gulf" },
  url: "https://skipthegulf.com/bangkok-to-munich-without-gulf",
  datePublished: "2026-03-08",
  dateModified: "2026-03-08",
};

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export default function BangkokToMunichPage() {
  const today = dateStr(0);
  const inAWeek = dateStr(7);

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                d="M12 19V5m0 0l-4 4m4-4l4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Skip the Gulf
            </h1>
            <p className="text-xs text-slate-500">BKK to MUC without Gulf airspace</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
            Bangkok to Munich
            <br />
            Without the Gulf
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            I helped a family of 4 with two kids find a route after their Etihad
            BKK&rarr;AUH&rarr;MUC flight got cancelled. Etihad, Emirates, Qatar
            &mdash; all the usual BKK&rarr;Europe connections are down. Munich is
            trickier than Frankfurt or London because it&apos;s smaller, with
            fewer direct non-Gulf options from Asia. Here&apos;s what actually
            works.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Prices for March 2026. Always verify on Google Flights.
          </p>
        </div>

        {/* Route 1: Chengdu */}
        <section className="mb-6">
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">
                1
              </span>
              <h3 className="text-lg font-bold text-green-900">
                The Chengdu Trick &mdash; ~&euro;750–1,070/person
              </h3>
            </div>
            <div className="space-y-2 mb-3">
              <div className="rounded-xl bg-white border border-green-200 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  BKK &rarr; Chengdu (CTU)
                </p>
                <p className="text-xs text-slate-500">~&euro;167–325, Chinese carriers</p>
              </div>
              <div className="rounded-xl bg-white border border-green-200 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  Chengdu &rarr; Munich (via PVG or PEK)
                </p>
                <p className="text-xs text-slate-500">
                  ~&euro;585–743, Chinese carriers (Air China, Sichuan Airlines)
                </p>
              </div>
            </div>
            <p className="text-sm text-green-800 mb-2">
              Family of 4: <strong>~&euro;3,000–4,300 total</strong>. Best
              budget option by far.
            </p>
            <p className="text-xs text-green-700 mb-2">
              China 144-hour visa-free transit applies &mdash; no visa needed if
              you&apos;re transiting through.
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> This route doesn&apos;t show on any
                flight search engine. You have to book it as 2 separate tickets.
                Works best with flexible dates (cheapest-of-month prices).
              </p>
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href={googleFlightsUrl("BKK", "CTU", inAWeek)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-green-600 text-white text-center py-2.5 px-3 text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                BKK&rarr;CTU flights
              </a>
              <a
                href={googleFlightsUrl("CTU", "MUC", inAWeek)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-green-100 text-green-800 text-center py-2.5 px-3 text-xs font-semibold border border-green-300 hover:bg-green-200 transition-colors"
              >
                CTU&rarr;MUC flights
              </a>
            </div>
          </div>
        </section>

        {/* Route 2: Taipei */}
        <section className="mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                2
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Via Taipei &mdash; ~&euro;573
              </h3>
            </div>
            <div className="space-y-2 mb-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  BKK &rarr; TPE + TPE &rarr; MUC
                </p>
                <p className="text-xs text-slate-500">
                  Single booking possible on some dates
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Taiwan is visa-free for most EU/EEA passport holders. Reliable connection,
              slightly more expensive than Chengdu but simpler booking.
            </p>
            <a
              href={googleFlightsUrl("TPE", "MUC", inAWeek)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-blue-600 text-white text-center py-2.5 px-3 text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Check TPE&rarr;MUC flights
            </a>
          </div>
        </section>

        {/* Route 3: Condor nonstop */}
        <section className="mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                3
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Condor Nonstop + Train
              </h3>
            </div>
            <div className="space-y-2 mb-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  BKK &rarr; FRA nonstop (Condor DE2361, A330)
                </p>
                <p className="text-xs text-slate-500">
                  Then ICE train Frankfurt &rarr; Munich, 3h15
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              Walk-up price is <strong>&euro;5,000+</strong> but drops to{" "}
              <strong>~&euro;450/person</strong> if you can wait a few days for
              availability to open up.
            </p>
            <p className="text-xs text-slate-500 mb-2">
              Kids under 15 ride free on Deutsche Bahn ICE trains when traveling
              with a parent. That&apos;s a real saving for families.
            </p>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-800">
                <strong>Call Condor:</strong>{" "}
                <a
                  href="tel:+4961716988988"
                  className="underline font-semibold"
                >
                  +49 6171 69889 88
                </a>{" "}
                (24h) or{" "}
                <a
                  href="https://wa.me/4961716988916"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  WhatsApp
                </a>
                . Phone fares are sometimes better than the website.
              </p>
            </div>
            <a
              href={googleFlightsUrl("BKK", "FRA", inAWeek)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-blue-600 text-white text-center py-2.5 px-3 text-xs font-semibold hover:bg-blue-700 transition-colors mt-3"
            >
              Check BKK&rarr;FRA flights
            </a>
          </div>
        </section>

        {/* Route 4: Tbilisi */}
        <section className="mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                4
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Via Tbilisi
              </h3>
            </div>
            <div className="space-y-2 mb-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  BKK &rarr; TBS + TBS &rarr; MUC
                </p>
                <p className="text-xs text-slate-500">
                  Pegasus via Istanbul, or Wizz Air direct TBS&rarr;MUC
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Georgia is visa-free for most passport holders. Tbilisi is cheap to
              hang out in if you need to wait a day or two for a better fare on
              the second leg.
            </p>
          </div>
        </section>

        {/* Route 5: Ürümqi + Doha */}
        <section className="mb-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold">
                5
              </span>
              <h3 className="text-lg font-bold text-amber-900">
                Via Urumqi + Doha &mdash; ~&euro;600/person
              </h3>
            </div>
            <div className="space-y-2 mb-3">
              <div className="rounded-xl bg-white border border-amber-200 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  BKK &rarr; Urumqi (&euro;226) + URC &rarr; Doha (&euro;250) +
                  DOH &rarr; MUC (~&euro;150)
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-800">
              <strong>Caveat:</strong> This goes through Doha, which IS a Gulf
              hub. Only works if Qatar Airways flights resume. Including this as
              an &quot;if Gulf opens partially&quot; option.
            </p>
          </div>
        </section>

        {/* What doesn't work */}
        <section className="mb-8">
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
            <h3 className="text-lg font-bold text-red-900 mb-3">
              What doesn&apos;t work
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-white border border-red-200 p-3">
                <p className="text-sm font-semibold text-red-800">
                  BKK &rarr; Istanbul (IST)
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Every &quot;direct&quot; BKK&rarr;IST flight actually transits
                  via DOH or SHJ. It&apos;s a fake non-Gulf route. Check the
                  flight path before booking.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-red-200 p-3">
                <p className="text-sm font-semibold text-red-800">
                  BKK &rarr; MUC direct (non-Gulf carrier)
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Starts at &euro;3,268 &mdash; Air France via CDG. Not realistic
                  for most families.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-red-200 p-3">
                <p className="text-sm font-semibold text-red-800">
                  Expecting Munich to have Asian non-Gulf connections
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Frankfurt is the real gateway for non-Gulf flights from Asia.
                  Munich is too small. Accept the FRA + train combo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Traveling with kids */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Traveling with kids
          </h3>
          <div className="space-y-3">
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Fewer stops wins
              </p>
              <p className="text-xs text-slate-500 mt-1">
                With toddlers, every connection is a stress multiplier. The
                Chengdu route means 2 flights instead of 3. Condor nonstop +
                train is the least stressful but most expensive.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                The Chengdu route is 2 flights, not 3
              </p>
              <p className="text-xs text-slate-500 mt-1">
                BKK&rarr;CTU, then CTU&rarr;MUC (with a domestic Chinese
                connection at PVG or PEK). Two boarding passes, two security
                checks. Manageable.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                EU261 does NOT apply to Etihad from BKK
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Non-EU airline, non-EU departure. You have Montreal Convention
                rights only.{" "}
                <Link
                  href="/cancelled-flight-rights-eu261"
                  className="text-blue-600 underline"
                >
                  Read the full breakdown of your rights
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8">
          <Link
            href="/?from=BKK&to=MUC"
            className="block w-full rounded-2xl bg-blue-600 text-white text-center py-4 px-6 font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors"
          >
            Search BKK &rarr; MUC routes now
          </Link>
          <p className="text-xs text-slate-400 text-center mt-2">
            Free, no signup. We&apos;ll find routes that skip the Gulf.
          </p>
        </section>

        {/* Visa check */}
        <section className="mb-8">
          <a
            href="https://apply.joinsherpa.com/travel-restrictions?affiliateId=skipthegulf"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-2xl border-2 border-slate-200 bg-white text-center py-4 px-6 font-semibold text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            Check visa requirements for your route
          </a>
          <p className="text-xs text-slate-400 text-center mt-2">
            Powered by Sherpa. Especially useful if you&apos;re transiting
            through China (144h rule) or Georgia.
          </p>
        </section>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Written by a traveler who helped a real family get home, not a travel
          agent. Prices change daily, always verify before booking.
        </p>
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
