import type { Metadata, Viewport } from "next";
import { Inter, Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import "./globals.css";

// Site type: one heavy grotesque, used 400–900.
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

// Arcade type (scoped to /arcade).
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
  title: "Mamdani-stan | Liberation Front",
  description:
    "The potholes are fixed. The pools are open. Panic accordingly. A tongue-in-cheek civic dashboard and retro arcade tracking New York's material wins.",
};

export const viewport: Viewport = {
  themeColor: "#0000FF",
  width: "device-width",
  initialScale: 1,
};

function NavBar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b-4 border-outline bg-secondary px-4 py-4 shadow-brutal md:px-12">
      <Link href="/" aria-label="Mamdanistan — home" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mamdanistan_logo.webp"
          alt="Mamdanistan"
          className="h-9 w-auto sm:h-11"
        />
      </Link>
      <nav className="flex items-center gap-3 sm:gap-5">
        <Link
          href="/"
          className="hidden border-2 border-outline bg-white px-4 py-1 text-sm font-black uppercase text-on-secondary brutal-shadow-blue transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none sm:inline-block"
        >
          Home
        </Link>
        <Link
          href="/grid"
          className="text-sm font-black uppercase text-on-secondary hover:border-b-4 hover:border-outline"
        >
          The Grid
        </Link>
        <Link
          href="/arcade"
          className="border-2 border-outline bg-primary px-3 py-1 text-sm font-black uppercase text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
        >
          Arcade
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-6 border-t-4 border-outline bg-primary px-4 py-10 text-white shadow-[0_-6px_0_0_#000] md:flex-row md:px-12">
      <div className="border-2 border-outline bg-secondary px-4 py-2 text-lg font-black uppercase text-on-secondary brutal-shadow-red">
        Mamdani-stan Liberation Front
      </div>
      <p className="max-w-[260px] text-center text-[10px] font-bold uppercase tracking-tighter opacity-80 md:text-right">
        © 1974 Mamdani-stan Liberation Front. Property of the People. Satire.
        Probably. <span className="animate-blink text-secondary">▮</span>
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
      className={`${sans.variable} ${pixel.variable} ${terminal.variable}`}
    >
      <body className="min-h-screen">
        <FirebaseAnalytics />
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
