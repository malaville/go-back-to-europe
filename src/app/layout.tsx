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
  title: "Go Back to Europe — Safe Flights Avoiding Conflict Zones",
  description:
    "Stuck in Southeast Asia? Find safe, affordable routes back to Europe that avoid Middle East conflict zones. Multi-leg flights from Bangkok, Bali, Ho Chi Minh City to Paris, Amsterdam, London. No overflights over war zones. Visa checks and safety alerts included.",
  keywords: [
    "flights avoiding middle east",
    "safe flights Asia to Europe",
    "avoid conflict zones flights",
    "cheap flights Asia to Europe no middle east",
    "budget flights Southeast Asia Europe",
    "multi-leg flights home safe route",
    "backpacker flights Europe avoid war zones",
    "safe travel routes Asia Europe",
    "Bangkok to Paris flights safe",
    "Bali to London flights avoid conflict",
    "visa-free transit countries",
    "go back to Europe",
  ],
  openGraph: {
    title: "Go Back to Europe — Safe Flights Avoiding Conflict Zones",
    description:
      "Find safe, affordable routes from Southeast Asia back to Europe — avoiding Middle East conflict zones. Visa checks, cost estimates, and safety alerts included.",
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
