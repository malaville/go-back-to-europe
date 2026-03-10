import Link from "next/link";

const routes = [
  { href: "/manila-to-london-without-gulf", label: "Manila → London" },
  { href: "/bangkok-to-munich-without-gulf", label: "Bangkok → Munich" },
  { href: "/bangkok-to-geneva-without-gulf", label: "Bangkok → Geneva" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white py-6">
      <div className="max-w-lg mx-auto px-4">
        <nav className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Route guides
          </p>
          <ul className="flex flex-wrap gap-x-4">
            {routes.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="text-sm text-blue-600 hover:text-blue-800 py-2 inline-block"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-4">
            <Link
              href="/cancelled-flight-rights-eu261"
              className="text-sm text-blue-600 hover:text-blue-800 py-2 inline-block"
            >
              Your rights (EU261)
            </Link>
            <Link
              href="/community"
              className="text-sm text-blue-600 hover:text-blue-800 py-2 inline-block"
            >
              Community
            </Link>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 py-2 inline-block"
            >
              Search routes
            </Link>
          </div>
        </nav>
        <p className="text-xs text-slate-400">
          Skip the Gulf is a community tool. Always verify travel information
          with official sources before booking.
        </p>
      </div>
    </footer>
  );
}
