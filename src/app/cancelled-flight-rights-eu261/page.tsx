import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Cancelled Flight Rights — EU261 & Gulf Airlines | Skip the Gulf",
  description:
    "Your Gulf carrier cancelled your flight. Find out what you're owed — EU261, rebooking rights, Montreal Convention, credit card insurance.",
  keywords: [
    "cancelled flight rights",
    "EU261",
    "EU261 Gulf airlines",
    "Etihad cancelled flight",
    "Emirates cancelled flight refund",
    "Qatar Airways cancellation rights",
    "Gulf airspace closure refund",
    "flight cancelled what am I owed",
    "Montreal Convention flight cancellation",
  ],
  alternates: {
    canonical: "https://skipthegulf.com/cancelled-flight-rights-eu261",
  },
  openGraph: {
    title: "Cancelled Flight? Know Your Rights",
    description:
      "Emirates, Etihad, Qatar cancelled on you? EU261 probably doesn't apply. Here's what actually does.",
    url: "https://skipthegulf.com/cancelled-flight-rights-eu261",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cancelled Flight? Know Your Rights — EU261 & Gulf Airlines",
    description:
      "Your Gulf carrier cancelled your flight. Here's what you're actually owed.",
  },
};

// Structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cancelled Flight Rights — EU261 & Gulf Airlines",
  description:
    "Your Gulf carrier cancelled your flight. Find out what you're owed — EU261, rebooking rights, Montreal Convention.",
  author: { "@type": "Person", name: "Marc-Antoine" },
  publisher: { "@type": "Organization", name: "Skip the Gulf" },
  url: "https://skipthegulf.com/cancelled-flight-rights-eu261",
  datePublished: "2026-03-08",
  dateModified: "2026-03-08",
};

const GULF_CARRIERS = [
  "Emirates",
  "Etihad",
  "Qatar Airways",
  "flydubai",
  "Gulf Air",
  "Oman Air",
  "Saudia",
  "flynas",
  "Air Arabia",
  "Kuwait Airways",
];

const EU_CARRIERS = [
  "Lufthansa",
  "Air France",
  "KLM",
  "Finnair",
  "Austrian",
  "SWISS",
  "Condor",
  "Eurowings",
  "ITA Airways",
  "Aegean",
  "LOT",
  "airBaltic",
  "Iberia",
  "Wizz Air",
];

export default function CancelledFlightRightsPage() {
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
            <p className="text-xs text-slate-500">
              Cancelled flight? Know your rights.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
            Your flight got cancelled.
            <br />
            What are you owed?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            I spent hours figuring this out after my own Etihad flight got
            cancelled. Saving you the research.
          </p>
        </div>

        {/* Section 1: Gulf carriers */}
        <section className="mb-8">
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
            <h3 className="text-lg font-bold text-red-900 mb-2">
              Gulf carrier cancelled on you?
            </h3>
            <p className="text-sm text-red-800 mb-3">
              If your flight was from <strong>outside the EU</strong> (Bangkok,
              Bali, Singapore...) on one of these airlines:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {GULF_CARRIERS.map((c) => (
                <span
                  key={c}
                  className="inline-block bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="text-sm font-bold text-red-900">
              EU261 does NOT protect you.
            </p>
            <p className="text-xs text-red-700 mt-1">
              These are not EU airlines, and your flight didn&apos;t depart from
              the EU.
            </p>
          </div>

          {/* What you CAN do */}
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              What you can do
            </h4>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Call the airline. Push for rebooking.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                They should rebook you on their next available flight under
                their conditions of carriage. Be specific: &quot;I want to be
                rebooked on [flight number] on [date].&quot; Trust me, a
                concrete request works way better than &quot;get me
                home.&quot;
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Check your credit card.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Many travel cards include trip interruption insurance. Call your
                bank.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Keep every receipt.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Hotel, food, transport, everything. The Montreal Convention lets
                you claim provable costs from any international airline, up to
                ~€5,800 per person. Boring but important: you need receipts for
                all of it.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: EU airlines */}
        <section className="mb-8">
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
            <h3 className="text-lg font-bold text-green-900 mb-2">
              EU airline or EU departure?
            </h3>
            <p className="text-sm text-green-800 mb-3">
              EU261 applies if <strong>either</strong> is true:
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      d="M4.5 12.75l6 6 9-13.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="text-sm text-green-800">
                  Your flight <strong>departs from an EU airport</strong> (any
                  airline)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      d="M4.5 12.75l6 6 9-13.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="text-sm text-green-800">
                  Your flight is <strong>operated by an EU airline</strong>{" "}
                  arriving to the EU
                </p>
              </div>
            </div>

            <p className="text-xs text-green-700 mb-3">
              EU airlines with Gulf routes:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EU_CARRIERS.map((c) => (
                <span
                  key={c}
                  className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-green-600 mt-2">
              British Airways is NOT EU since Brexit. Separate UK261 rules.
            </p>
          </div>

          {/* What EU261 gives you */}
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              What EU261 gives you
            </h4>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Rebooking on the next flight
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Even on another airline. Or a full refund within 7 days. Your
                choice.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Meals, hotel, transport
              </p>
              <p className="text-xs text-slate-500 mt-1">
                While you wait for your rebooked flight.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Up to €600/person cash
              </p>
              <p className="text-xs text-slate-500 mt-1">
                For long-haul cancellations. Family of 4 = up to €2,400. The
                airline may argue &quot;extraordinary circumstances&quot; (war,
                airspace closure) to avoid this. But they still must rebook you
                and provide care.
              </p>
            </div>
          </div>
        </section>

        {/* Return leg trick */}
        <section className="mb-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-sm font-bold text-amber-900 mb-1">
              The return leg trick
            </h3>
            <p className="text-xs text-amber-800">
              Have a <strong>return flight departing from an EU airport</strong>{" "}
              on your booking? That leg is covered by EU261 even on Gulf
              carriers, because it departs from the EU.
            </p>
          </div>
        </section>

        {/* Action steps */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Right now</h3>
          <div className="space-y-2">
            {[
              {
                step: "1",
                text: "Call your airline (not the airport)",
              },
              {
                step: "2",
                text: 'Say: "I\'m requesting rerouting to my final destination." EU airline? Add "under EU261, Article 8."',
              },
              {
                step: "3",
                text: "Find alternative routes yourself and tell the airline which flight you want",
              },
              {
                step: "4",
                text: "Document everything (screenshots, receipts, agent names)",
              },
              {
                step: "5",
                text: "If refused: file with AirHelp or your national aviation authority",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 rounded-xl bg-white border border-slate-200 p-4"
              >
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {item.step}
                </span>
                <p className="text-sm text-slate-700">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA to main tool */}
        <section className="mb-8">
          <Link
            href="/"
            className="block w-full rounded-2xl bg-blue-600 text-white text-center py-4 px-6 font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors"
          >
            Find alternative routes home
          </Link>
          <p className="text-xs text-slate-400 text-center mt-2">
            Free, no signup. Routes from SEA to Europe avoiding Gulf airspace.
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
            Check visa requirements for your new route
          </a>
          <p className="text-xs text-slate-400 text-center mt-2">
            Rebooked on a different route? Check transit visa rules before you
            go. Powered by Sherpa.
          </p>
        </section>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Built by a stranded traveler in Bangkok, not a lawyer. Always
          confirm with your airline or a consumer rights organization.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
