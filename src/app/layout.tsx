import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Go Back to Europe — Find Safe, Cheap Flights Home",
  description:
    "Stuck in Southeast Asia? Find safe, affordable multi-leg routes back to Europe. Compare cheap flights from Bangkok, Bali, Ho Chi Minh City, and more to Paris, Amsterdam, London, Berlin. Budget travel routing with visa checks and safety alerts.",
  keywords: [
    "cheap flights Asia to Europe",
    "budget flights Southeast Asia Europe",
    "multi-leg flights home",
    "backpacker flights Europe",
    "safe travel routes",
    "Bangkok to Paris flights",
    "Bali to London flights",
    "visa-free transit countries",
    "go back to Europe",
  ],
  openGraph: {
    title: "Go Back to Europe — Find Safe, Cheap Flights Home",
    description:
      "Find safe, affordable multi-leg routes from Southeast Asia back to Europe. Visa checks, cost estimates, and safety alerts included.",
    type: "website",
    locale: "en_US",
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
        {children}
      </body>
    </html>
  );
}
