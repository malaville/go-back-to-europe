import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import DatadogInit from "@/lib/datadog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skip the Gulf — Fly Asia to Europe Without Gulf Carriers",
  description:
    "Find safe, affordable routes from Southeast Asia to Europe that skip Gulf carriers and Middle East hubs. Multi-leg flights from Bangkok, Bali, Ho Chi Minh City to Paris, Amsterdam, London. No Emirates, Etihad, Qatar routes. Visa checks and safety alerts included.",
  keywords: [
    "skip the gulf",
    "flights avoiding middle east",
    "safe flights Asia to Europe",
    "avoid gulf carriers",
    "no emirates flights",
    "cheap flights Asia to Europe no middle east",
    "budget flights Southeast Asia Europe",
    "multi-leg flights safe route",
    "backpacker flights Europe avoid war zones",
    "safe travel routes Asia Europe",
    "Bangkok to Paris flights safe",
    "Bali to London flights avoid conflict",
    "visa-free transit countries",
  ],
  metadataBase: new URL("https://skipthegulf.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Skip the Gulf — Fly Asia to Europe Without Gulf Carriers",
    description:
      "Find safe, affordable routes from Southeast Asia to Europe — skipping Gulf carriers and Middle East hubs. Visa checks, cost estimates, and safety alerts included.",
    type: "website",
    locale: "en_US",
    url: "https://skipthegulf.com",
    siteName: "Skip the Gulf",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skip the Gulf — Fly Asia to Europe Without Gulf Carriers",
    description:
      "Safe, affordable routes from Southeast Asia to Europe. No Gulf carriers. Visa checks included.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <DatadogInit />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
