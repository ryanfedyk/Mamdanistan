import { ArcadeGrid } from "@/components/arcade/ArcadeGrid";

export const metadata = {
  // The root layout appends " · Mamdanistan" via the title template.
  title: "The Arcade",
  description:
    "Democracy is a team sport and the floor is sticky. Pick a cabinet and lower the barrier to civic engagement, one pixel at a time.",
  alternates: { canonical: "/arcade" },
  openGraph: {
    type: "website",
    url: "/arcade",
    title: "The Arcade · Mamdanistan",
    description: "A retro arcade of civic wins. Pick a cabinet, insert an imaginary quarter.",
    images: [{ url: "/mamdanistan-postcard.webp", width: 1000, height: 652, alt: "Mamdanistan" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Arcade · Mamdanistan",
    description: "A retro arcade of civic wins. Pick a cabinet, insert an imaginary quarter.",
    images: ["/mamdanistan-postcard.webp"],
  },
};

export default function ArcadePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-pixel text-[8px] uppercase text-mamdani-mint">
          Civic Engagement · Gamified
        </p>
        <h1 className="pixel-heading text-lg sm:text-2xl">The Arcade</h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          Democracy is a team sport and the floor is sticky. Pick a cabinet,
          insert an imaginary quarter, and do your part to lower the barrier to
          civic engagement — one pixel at a time.
        </p>
        <div className="inline-flex items-center gap-2 rounded-sm border-2 border-mamdani-cyan bg-mamdani-ink/70 px-3 py-1.5">
          <span className="animate-blink text-mamdani-cyan">▮</span>
          <span className="font-pixel text-[9px] uppercase tracking-wider text-mamdani-cyan">
            Insert Coin To Continue
          </span>
        </div>
      </header>

      <ArcadeGrid />
    </div>
  );
}
