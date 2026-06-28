import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import "./globals.css";

// ---- Campaign type: warm 70s serif display + clean grotesque body ----
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// ---- Arcade type: 16-bit display + terminal (scoped to /arcade) ----
const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});
const terminal = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-terminal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Welcome to Mamdanistan",
  description:
    "The potholes are fixed. The pools are open. Panic accordingly. A tongue-in-cheek civic dashboard and retro arcade tracking New York's material wins.",
};

export const viewport: Viewport = {
  themeColor: "#1B3A9C",
  width: "device-width",
  initialScale: 1,
};

function NavBar() {
  return (
    <header className="sticky top-0 z-[1000] border-b-2 border-campaign-navy bg-campaign-blue text-campaign-cream">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-campaign-navy bg-campaign-sun text-base">
            🗽
          </span>
          <span className="font-display text-lg font-black tracking-tight sm:text-xl">
            Mamdanistan
          </span>
        </Link>
        <div className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide sm:gap-3 sm:text-base">
          <Link
            href="/grid"
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-campaign-navy/40"
          >
            The Grid
          </Link>
          <Link
            href="/arcade"
            className="rounded-full border-2 border-campaign-navy bg-campaign-sun px-3 py-1.5 text-campaign-navy transition-transform hover:-translate-y-0.5"
          >
            The Arcade
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-campaign-navy bg-campaign-blue px-4 py-10 text-center text-campaign-cream">
      <p className="font-display text-lg font-bold">
        Made in the five boroughs.
      </p>
      <p className="mt-1 font-sans text-sm text-campaign-cream/80">
        No potholes were spared in the making of this site. Satire. Probably.{" "}
        <span className="animate-blink text-campaign-sun">▮</span>
      </p>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${pixel.variable} ${terminal.variable}`}
    >
      <body className="min-h-screen">
        <FirebaseAnalytics />
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
