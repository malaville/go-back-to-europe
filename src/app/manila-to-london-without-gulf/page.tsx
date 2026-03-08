import type { Metadata } from "next";
import Link from "next/link";
import { googleFlightsUrl } from "@/lib/google-flights-url";

export const metadata: Metadata = {
  title:
    "Manila to London Without Gulf Airspace — 4 Routes That Work in 2026",
  description:
    "Stranded in Manila? Here are 4 non-Gulf routes to London, from €772 via the Baku Express to Taipei connections from €960.",
  keywords: [
    "manila to london flights",
    "manila london no gulf",
    "flights philippines to uk avoid middle east",
    "MNL LHR alternative routes",
    "manila to london without gulf airspace",
    "philippines to europe flights 2026",
    "manila london non-gulf route",
  ],
  alternates: {
    canonical: "https://skipthegulf.com/manila-to-london-without-gulf",
  },
  openGraph: {
    title: "Manila to London Without the Gulf — 4 Routes That Actually Work",
    description:
      "Gulf airspace closed, MNL→LHR cancelled? Here are 4 tested non-Gulf routes from €772.",
    url: "https://skipthegulf.com/manila-to-london-without-gulf",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Manila to London Without Gulf Airspace — 4 Routes That Work in 2026",
    description:
      "Stranded in Manila? 4 non-Gulf routes to London, from the €772 Baku Express to Taipei connections.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Manila to London Without Gulf Airspace — 4 Routes That Work in 2026",
  description:
    "4 tested non-Gulf routes from Manila to London, from the €772 Baku Express via Xi'An and Baku to Taipei connections from €960.",
  author: { "@type": "Person", name: "Marc-Antoine" },
  publisher: { "@type": "Organization", name: "Skip the Gulf" },
  url: "https://skipthegulf.com/manila-to-london-without-gulf",
  datePublished: "2026-03-08",
  dateModified: "2026-03-08",
};

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export default function ManilaToLondonPage() {
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
            <p className="text-xs text-slate-500">
              Manila to London without the Gulf
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
            Manila to London
            <br />
            Without the Gulf
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Routes that actually work.
          </p>
        </div>

        {/* Context */}
        <section className="mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-700 leading-relaxed">
              Most Manila to London flights route through Doha or Dubai. When
              Gulf airspace closes, those flights get cancelled or rerouted
              indefinitely. I helped a British traveler find alternatives after
              his March 10 flight was cancelled — here&apos;s everything we
              found.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              Prices are approximate and change daily. Always verify on Google
              Flights before booking.
            </p>
          </div>
        </section>

        {/* Route 1: Via Taipei */}
        <section className="mb-6">
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">
                1
              </span>
              <h3 className="text-lg font-bold text-green-900">
                Via Taipei
              </h3>
            </div>
            <p className="text-sm text-green-800 font-medium mb-2">
              MNL &rarr; TPE &rarr; LHR &middot; multiple transit options
            </p>
            <p className="text-sm text-green-800 mb-3">
              Fly Manila to Taipei, then pick your onward connection. Prices
              vary wildly depending on transit hub, so check each option.
            </p>

            <p className="text-xs text-green-700 font-semibold mb-2">
              TPE &rarr; LHR options (non-Gulf only):
            </p>
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between rounded-lg bg-green-100 px-3 py-2">
                <span className="text-xs text-green-800">
                  via Shenzhen (SZX) &middot; Shenzhen Airlines &middot; 33h
                </span>
                <span className="text-xs font-bold text-green-900">~&euro;960</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-100 px-3 py-2">
                <span className="text-xs text-green-800">
                  via Tokyo/Vienna &middot; EVA+ANA+Austrian &middot; 49h
                </span>
                <span className="text-xs font-bold text-green-900">~&euro;1,085</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-100 px-3 py-2">
                <span className="text-xs text-green-800">
                  via Beijing (PEK) &middot; Air China &middot; 29–31h
                </span>
                <span className="text-xs font-bold text-green-900">&euro;1,250–1,440</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-100 px-3 py-2">
                <span className="text-xs text-green-800">
                  via Istanbul (IST) &middot; Turkish Airlines &middot; 20–25h
                </span>
                <span className="text-xs font-bold text-green-900">&euro;1,700–4,700</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-100 px-3 py-2">
                <span className="text-xs text-green-800">
                  via Frankfurt (FRA) &middot; China Airlines+LH &middot; 19h
                </span>
                <span className="text-xs font-bold text-green-900">~&euro;1,860</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-100 px-3 py-2">
                <span className="text-xs text-green-800">
                  via San Francisco (SFO) &middot; United &middot; 29h
                </span>
                <span className="text-xs font-bold text-green-900">~&euro;2,790</span>
              </div>
            </div>

            <div className="rounded-xl bg-green-100 p-3 mb-3">
              <p className="text-xs text-green-700">
                <strong>Visa:</strong> Taiwan is visa-free for most EU/EEA
                passports. China transit needs 144h visa-free (onward ticket
                to a third country).
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={googleFlightsUrl("TPE", "LHR", today)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-green-600 text-white text-center py-2.5 px-3 text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                Check TPE&rarr;LHR today
              </a>
              <a
                href={googleFlightsUrl("TPE", "LHR", inAWeek)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-green-100 text-green-800 text-center py-2.5 px-3 text-xs font-semibold border border-green-300 hover:bg-green-200 transition-colors"
              >
                Check in a week
              </a>
            </div>
          </div>
        </section>

        {/* Route 2: The Baku Express */}
        <section className="mb-6">
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold">
                2
              </span>
              <h3 className="text-lg font-bold text-amber-900">
                The Baku Express
              </h3>
            </div>
            <p className="text-xs text-amber-700 font-medium mb-3">
              The creative one
            </p>
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between rounded-xl bg-amber-100 px-3 py-2">
                <span className="text-xs text-amber-800">
                  MNL &rarr; XIY (Xi&apos;An)
                </span>
                <span className="text-xs font-bold text-amber-900">~€133</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-100 px-3 py-2">
                <span className="text-xs text-amber-800">
                  XIY &rarr; GYD (Baku)
                </span>
                <span className="text-xs font-bold text-amber-900">~€433</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-100 px-3 py-2">
                <span className="text-xs text-amber-800">
                  GYD &rarr; LGW (London Gatwick)
                </span>
                <span className="text-xs font-bold text-amber-900">~€206</span>
              </div>
            </div>
            <div className="rounded-xl bg-amber-100 p-3 mb-3">
              <p className="text-sm font-bold text-amber-900">
                Total: ~€772
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Cheapest non-Gulf option we found
              </p>
            </div>
            <div className="space-y-2 text-sm text-amber-800">
              <p>
                3 flights over 4 days with stopovers. Visit the Terracotta
                Warriors in Xi&apos;An and the Old City in Baku while
                you&apos;re at it.
              </p>
              <p>
                <strong>China:</strong> 144-hour visa-free transit (must have
                onward ticket to a third country).
              </p>
              <p>
                <strong>Azerbaijan:</strong> e-visa, ~$26, processed in a few
                hours.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 mt-3">
              <a
                href={googleFlightsUrl("MNL", "XIY", inAWeek)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-amber-600 text-white text-center py-2 px-3 text-xs font-semibold hover:bg-amber-700 transition-colors"
              >
                Check MNL&rarr;XIY flights
              </a>
              <a
                href={googleFlightsUrl("XIY", "GYD", inAWeek)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-amber-100 text-amber-800 text-center py-2 px-3 text-xs font-semibold border border-amber-300 hover:bg-amber-200 transition-colors"
              >
                Check XIY&rarr;GYD flights
              </a>
              <a
                href={googleFlightsUrl("GYD", "LGW", inAWeek)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-amber-100 text-amber-800 text-center py-2 px-3 text-xs font-semibold border border-amber-300 hover:bg-amber-200 transition-colors"
              >
                Check GYD&rarr;LGW flights
              </a>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-100/50 p-3 mt-3">
              <p className="text-xs text-amber-700">
                No flight search engine shows this route. You have to search
                hop-by-hop — that&apos;s exactly what our tool does.
              </p>
            </div>
          </div>
        </section>

        {/* Route 3: Via Singapore */}
        <section className="mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                3
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Via Singapore
              </h3>
            </div>
            <p className="text-sm text-slate-600 font-medium mb-2">
              MNL &rarr; SIN &rarr; LHR
            </p>
            <p className="text-sm text-slate-600 mb-3">
              Singapore Airlines runs SIN&rarr;LHR daily. You can book it as
              one ticket through SQ, or split-ticket Manila to Singapore on a
              budget carrier and then SQ to London.
            </p>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                <strong>Price:</strong> Varies widely, check SQ and split
                options
              </p>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Visa:</strong> Singapore is visa-free for most passports
              </p>
            </div>
          </div>
        </section>

        {/* Route 4: Via Bangkok + Royal Brunei */}
        <section className="mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                4
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Via Bangkok + Royal Brunei
              </h3>
            </div>
            <p className="text-sm text-slate-600 font-medium mb-2">
              MNL &rarr; BKK (~€117) + BKK &rarr; LHR via Brunei (~€1,155)
            </p>
            <p className="text-sm text-slate-600 mb-3">
              Royal Brunei flies Bangkok to London via Bandar Seri Begawan.
              It&apos;s not the cheapest, but it works and availability is
              usually decent.
            </p>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                <strong>Total:</strong> ~€1,272
              </p>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Visa:</strong> Thailand is visa-free for most EU passports
              </p>
            </div>
          </div>
        </section>

        {/* What doesn't work */}
        <section className="mb-8">
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
            <h3 className="text-lg font-bold text-red-900 mb-3">
              What doesn&apos;t work
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-red-100 p-3">
                <p className="text-sm font-semibold text-red-800">
                  Philippine Airlines &quot;nonstop&quot;
                </p>
                <p className="text-xs text-red-700 mt-1">
                  PAL MNL&rarr;LHR routes through Doha. Not a true nonstop,
                  and cancelled when Gulf airspace closes.
                </p>
              </div>
              <div className="rounded-xl bg-red-100 p-3">
                <p className="text-sm font-semibold text-red-800">
                  Hong Kong &rarr; London (non-Gulf)
                </p>
                <p className="text-xs text-red-700 mt-1">
                  €2,300+ and no Cathay Pacific nonstop available at time of
                  writing. Way too expensive for what you get.
                </p>
              </div>
              <div className="rounded-xl bg-red-100 p-3">
                <p className="text-sm font-semibold text-red-800">
                  India routes
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Completely Gulf-locked. DEL, BOM, CCU to London — almost all
                  connections go through the Gulf.
                </p>
              </div>
              <div className="rounded-xl bg-red-100 p-3">
                <p className="text-sm font-semibold text-red-800">
                  Chengdu trick
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Sichuan Airlines runs Chengdu to Europe, but only works if
                  you have flexible dates. Not useful when you need to get home
                  urgently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8">
          <Link
            href="/?from=MNL&to=LON"
            className="block w-full rounded-2xl bg-blue-600 text-white text-center py-4 px-6 font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors"
          >
            Search Manila &rarr; London routes now
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
            Powered by Sherpa. Check transit visas for China, Azerbaijan, and
            every stop along the way.
          </p>
        </section>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Prices and routes change constantly. Always verify on Google Flights
          before booking. Built by a fellow stranded traveler, not a travel
          agent.
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
