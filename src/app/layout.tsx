import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// 16-bit display face for headings + HUD.
const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Readable terminal-ish face for body copy.
const body = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Welcome to Mamdanistan",
  description:
    "The potholes are fixed. The pools are open. Panic accordingly. A tongue-in-cheek civic dashboard and retro arcade tracking New York's material wins.",
};

export const viewport: Viewport = {
  themeColor: "#0B0E1A",
  width: "device-width",
  initialScale: 1,
};

function NavBar() {
  return (
    <header className="sticky top-0 z-[1000] border-b-2 border-mamdani-steel bg-mamdani-ink/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="animate-flag-wave text-xl" aria-hidden>
            🚩
          </span>
          <span className="pixel-heading text-xs sm:text-sm">Mamdanistan</span>
        </Link>
        <div className="flex items-center gap-3 font-pixel text-[10px] uppercase sm:gap-5 sm:text-xs">
          <Link
            href="/grid"
            className="text-mamdani-cyan transition-colors hover:text-white"
          >
            The Grid
          </Link>
          <Link
            href="/arcade"
            className="text-mamdani-mint transition-colors hover:text-white"
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
    <footer className="mt-16 border-t-2 border-mamdani-steel px-4 py-8 text-center font-body text-lg text-mamdani-fog/70">
      <p>
        Made in the five boroughs. No potholes were spared in the making of this
        site.
      </p>
      <p className="mt-1 text-sm">
        Satire. Probably. <span className="animate-blink text-mamdani-red">▮</span>
      </p>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
