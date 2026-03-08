import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Bangkok to Geneva Without Gulf Airspace — The Tbilisi Trick (2026)",
  description:
    "BKK→GVA via Tbilisi for €820, or via Chengdu+Zürich for €505. Real routes found for a real stranded traveler.",
  keywords: [
    "bangkok to geneva flights",
    "BKK GVA no gulf",
    "flights thailand switzerland avoid middle east",
    "tbilisi to geneva easyjet",
    "bangkok geneva without gulf airspace",
    "chengdu zurich flights",
    "tbilisi geneva easyjet",
  ],
  alternates: {
    canonical: "https://skipthegulf.com/bangkok-to-geneva-without-gulf",
  },
  openGraph: {
    title:
      "Bangkok to Geneva Without the Gulf — The Tbilisi Trick and More",
    description:
      "BKK→GVA via Tbilisi for €820, or via Chengdu+Zürich for €505. Real routes avoiding Gulf airspace.",
    url: "https://skipthegulf.com/bangkok-to-geneva-without-gulf",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Bangkok to Geneva Without Gulf Airspace — The Tbilisi Trick (2026)",
    description:
      "BKK→GVA via Tbilisi for €820, or via Chengdu+Zürich for €505. Real routes found for a real stranded traveler.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Bangkok to Geneva Without the Gulf — The Tbilisi Trick and More",
  description:
    "BKK→GVA via Tbilisi for €820, or via Chengdu+Zürich for €505. Real routes found for a real stranded traveler.",
  author: { "@type": "Person", name: "Marc-Antoine" },
  publisher: { "@type": "Organization", name: "Skip the Gulf" },
  url: "https://skipthegulf.com/bangkok-to-geneva-without-gulf",
  datePublished: "2026-03-08",
  dateModified: "2026-03-08",
};

const ROUTES = [
  {
    rank: 1,
    title: "Chengdu + Zürich + train",
    price: "~€505/person",
    color: "green" as const,
    legs: [
      { route: "BKK → Chengdu (CTU)", price: "€166" },
      { route: "Chengdu → Zürich (ZRH)", price: "€309" },
      { route: "Train ZRH → GVA", price: "~€30, 2h45" },
    ],
    notes: [
      "Cheapest option — under €510 all-in",
      "China 144h visa-free transit (no visa needed for most EU/EEA passports)",
      "Swiss trains are excellent — scenic ride along Lake Geneva",
    ],
  },
  {
    rank: 2,
    title: "Via Tbilisi + easyJet",
    price: "~€820/person",
    color: "blue" as const,
    legs: [
      { route: "BKK → Ürümqi (URC)", price: "€359" },
      {
        route: "Ürümqi → Tbilisi (TBS)",
        price: "€549 (China Southern nonstop)",
      },
      { route: "easyJet TBS → GVA", price: "€44" },
    ],
    notes: [
      "The €44 easyJet Tbilisi→Geneva is the secret weapon",
      "Georgia visa-free for most EU/EEA passports",
      "Tbilisi is worth a day or two — cheap food, incredible wine region",
    ],
  },
  {
    rank: 3,
    title: "Via Beijing",
    price: "~€704",
    color: "slate" as const,
    legs: [
      { route: "BKK → Beijing (PEK)", price: "varies" },
      { route: "Beijing → Geneva (GVA)", price: "varies" },
    ],
    notes: [
      "Chinese carriers, 1 stop",
      "China 144h visa-free transit",
      "Total around €704 depending on dates",
    ],
  },
  {
    rank: 4,
    title: "Via Guangzhou",
    price: "~€1,018",
    color: "slate" as const,
    legs: [
      { route: "BKK → Guangzhou (CAN)", price: "varies" },
      { route: "Guangzhou → Geneva (GVA)", price: "varies" },
    ],
    notes: [
      "China Southern connections",
      "Pricier but reliable routing",
    ],
  },
];

const colorMap = {
  green: {
    border: "border-green-200",
    bg: "bg-green-50",
    title: "text-green-900",
    badge: "bg-green-600",
    legBg: "bg-green-100",
    legText: "text-green-700",
    noteText: "text-green-800",
  },
  blue: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    title: "text-blue-900",
    badge: "bg-blue-600",
    legBg: "bg-blue-100",
    legText: "text-blue-700",
    noteText: "text-blue-800",
  },
  slate: {
    border: "border-slate-200",
    bg: "bg-slate-50",
    title: "text-slate-900",
    badge: "bg-slate-600",
    legBg: "bg-slate-100",
    legText: "text-slate-700",
    noteText: "text-slate-600",
  },
};

export default function BangkokToGenevaPage() {
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
              BKK to Geneva without the Gulf
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
            Bangkok to Geneva
            <br />
            Without the Gulf
          </h2>
          <p className="text-base font-semibold text-slate-700 mt-2">
            The Tbilisi Trick and More
          </p>
          <p className="text-sm text-slate-500 mt-3">
            I found these routes for a traveler who was stranded after their
            Etihad BKK&rarr;AUH&rarr;GVA flight got cancelled. Geneva
            isn&apos;t a huge airport, so direct non-Gulf flights from Asia are
            rare. But there&apos;s a trick via Tbilisi that gets you there
            for under &euro;1,000 &mdash; and a Chengdu+train combo that does
            it for &euro;505.
          </p>
        </div>

        {/* Routes */}
        {ROUTES.map((route) => {
          const c = colorMap[route.color];
          return (
            <section key={route.rank} className="mb-6">
              <div
                className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${c.badge} text-white text-xs font-bold`}
                  >
                    {route.rank}
                  </span>
                  <h3 className={`text-lg font-bold ${c.title}`}>
                    {route.title}
                  </h3>
                  <span
                    className={`ml-auto text-sm font-bold ${c.title}`}
                  >
                    {route.price}
                  </span>
                </div>

                {/* Legs */}
                <div className="space-y-1.5 mb-4">
                  {route.legs.map((leg) => (
                    <div
                      key={leg.route}
                      className={`flex items-center justify-between rounded-lg ${c.legBg} px-3 py-2`}
                    >
                      <span
                        className={`text-xs font-medium ${c.legText}`}
                      >
                        {leg.route}
                      </span>
                      <span
                        className={`text-xs font-bold ${c.legText} ml-2 flex-shrink-0`}
                      >
                        {leg.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <ul className="space-y-1">
                  {route.notes.map((note) => (
                    <li
                      key={note}
                      className={`text-xs ${c.noteText} flex items-start gap-1.5`}
                    >
                      <span className="mt-0.5 flex-shrink-0">&bull;</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}

        {/* Why Tbilisi */}
        <section className="mb-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-lg font-bold text-amber-900 mb-2">
              Why Tbilisi is the gateway to Switzerland
            </h3>
            <div className="space-y-2 text-sm text-amber-800">
              <p>
                <strong>easyJet TBS&rarr;GVA nonstop at &euro;44</strong> is
                absurdly cheap. That&apos;s not a typo &mdash; it&apos;s a
                regular easyJet fare on a direct route.
              </p>
              <p>
                <strong>Wizz Air TBS&rarr;Basel</strong> exists too, if
                you&apos;re flexible on destination.
              </p>
              <p>
                Tbilisi has <strong>no visa requirement</strong> for most
                passport holders (EU, UK, US, and many more).
              </p>
              <p>
                The Caucasus is the price bridge between Asian carriers and
                European low-cost carriers. Asian airlines fly to Central Asia
                cheaply. European LCCs connect Georgia to Western Europe
                cheaply. Tbilisi sits right in the middle.
              </p>
            </div>
          </div>
        </section>

        {/* What doesn't work */}
        <section className="mb-8">
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
            <h3 className="text-lg font-bold text-red-900 mb-2">
              What doesn&apos;t work
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-white border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Direct BKK&rarr;GVA non-Gulf
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Basically doesn&apos;t exist under &euro;3,000. Geneva is too
                  small for Asian carriers to fly direct.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Via Istanbul
                </p>
                <p className="text-xs text-red-600 mt-1">
                  BKK&rarr;IST looks promising, but most connections are
                  &quot;fake&quot; &mdash; they transit through Gulf hubs
                  (Dubai, Doha) on the way.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Via India
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Most India&rarr;Europe flights are Gulf-locked. The onward
                  connections route through Dubai, Abu Dhabi, or Doha.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-8">
          <Link
            href="/?from=BKK&to=GVA"
            className="block w-full rounded-2xl bg-blue-600 text-white text-center py-4 px-6 font-semibold text-sm shadow-sm hover:bg-blue-700 transition-colors"
          >
            Find routes from Bangkok to Geneva
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
            Check visa requirements for your route
          </a>
          <p className="text-xs text-slate-400 text-center mt-2">
            Powered by Sherpa. Check transit visas for China, Georgia, and
            every stop along the way.
          </p>
        </section>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Prices are approximate and change frequently. Verify on Google
          Flights or the airline&apos;s website before booking. Built by a
          stranded traveler in Bangkok, not a travel agent.
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
