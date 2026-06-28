import Link from "next/link";
import { ARCADE_CABINETS } from "@/data/games";

export const metadata = {
  title: "The Arcade · Mamdanistan",
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

      <div className="grid gap-5 sm:grid-cols-2">
        {ARCADE_CABINETS.map((cab) => (
          <Link
            key={cab.id}
            href={`/arcade/${cab.id}`}
            className="panel crt group block overflow-hidden transition-transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center bg-mamdani-ink/60 py-8 text-6xl">
              <span className="group-hover:animate-press-start" aria-hidden>
                {cab.glyph}
              </span>
            </div>
            <div className="space-y-2 border-t-2 border-mamdani-steel px-5 py-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-pixel text-xs uppercase text-mamdani-mint">
                  {cab.title}
                </h2>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 font-pixel text-[7px] uppercase ${
                    cab.status === "playable"
                      ? "border-mamdani-mint text-mamdani-mint"
                      : "border-mamdani-gold text-mamdani-gold"
                  }`}
                >
                  {cab.status === "playable" ? "Playable" : "Prototype"}
                </span>
              </div>
              <p className="font-terminal text-xl text-white">{cab.blurb}</p>
              <p className="font-terminal text-lg leading-relaxed text-mamdani-fog">
                {cab.howToPlay}
              </p>
              <span className="inline-block pt-1 font-pixel text-[9px] uppercase text-mamdani-cyan group-hover:text-white">
                ▸ Play now
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
