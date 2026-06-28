import { PixelButton } from "@/components/ui/PixelButton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MAP_PINS, CATEGORY_COLORS, CATEGORY_GLYPHS } from "@/data/pins";
import { ARCADE_CABINETS } from "@/data/games";
import Link from "next/link";

export default function HomePage() {
  const wins = MAP_PINS.length;
  const avgProgress = Math.round(
    MAP_PINS.reduce((sum, p) => sum + p.progress, 0) / Math.max(1, wins),
  );

  return (
    <div className="space-y-14">
      {/* ---- HERO ---- */}
      <section className="panel crt overflow-hidden">
        <div className="space-y-6 bg-gradient-to-br from-mamdani-red/15 via-transparent to-mamdani-cyan/10 px-6 py-10 sm:px-10 sm:py-14">
          <StatusBanner text="BUREAUCRACY LEVEL: DEFEATED" tone="victory" />
          <h1 className="pixel-heading text-2xl leading-relaxed sm:text-4xl">
            Welcome to
            <br />
            <span className="text-mamdani-red">Mamdanistan</span>
          </h1>
          <p className="max-w-2xl font-body text-2xl leading-snug text-white sm:text-3xl">
            The potholes are fixed. The pools are open.{" "}
            <span className="text-mamdani-ember">Panic accordingly.</span>
          </p>
          <p className="max-w-2xl font-body text-xl leading-relaxed text-mamdani-fog">
            A high-stakes retro dashboard for the most dangerous force in modern
            politics: a city that works. Track the wins on The Grid, then prove
            your worth in The Arcade.
          </p>
          <div className="flex flex-wrap gap-3">
            <PixelButton href="/grid" variant="cyan">
              ▸ Open The Grid
            </PixelButton>
            <PixelButton href="/arcade" variant="mint">
              ▸ Enter The Arcade
            </PixelButton>
          </div>
        </div>
      </section>

      {/* ---- WAR ROOM STATS ---- */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Confirmed Wins" value={String(wins)} accent="#3DDC97" />
        <StatCard label="Avg. Mission %" value={`${avgProgress}%`} accent="#21D4FD" />
        <StatCard label="Panic Index" value="MAXIMUM" accent="#FF2E4D" />
      </section>

      {/* ---- THE GRID PREVIEW ---- */}
      <section className="space-y-5">
        <SectionHeading kicker="Spatial Intel" title="Latest from The Grid" />
        <div className="grid gap-4 sm:grid-cols-2">
          {MAP_PINS.map((pin) => {
            const color = CATEGORY_COLORS[pin.category];
            return (
              <Link
                key={pin.id}
                href="/grid"
                className="panel group block px-5 py-5 transition-transform hover:-translate-y-1"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {CATEGORY_GLYPHS[pin.category]}
                  </span>
                  <h3
                    className="font-pixel text-[11px] uppercase"
                    style={{ color }}
                  >
                    {pin.title}
                  </h3>
                </div>
                <p className="mb-1 font-pixel text-[8px] uppercase text-mamdani-fog">
                  {pin.neighborhood} · {pin.borough}
                </p>
                <p className="mb-4 font-body text-xl leading-snug text-white">
                  {pin.tagline}
                </p>
                <ProgressBar value={pin.progress} color={color} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---- THE ARCADE PREVIEW ---- */}
      <section className="space-y-5">
        <SectionHeading kicker="Civic Engagement, Gamified" title="The Arcade" />
        <div className="grid gap-4 sm:grid-cols-2">
          {ARCADE_CABINETS.map((cab) => (
            <Link
              key={cab.id}
              href={`/arcade/${cab.id}`}
              className="panel group flex items-center gap-4 px-5 py-5 transition-transform hover:-translate-y-1"
            >
              <span className="text-4xl group-hover:animate-press-start" aria-hidden>
                {cab.glyph}
              </span>
              <div>
                <h3 className="font-pixel text-[11px] uppercase text-mamdani-mint">
                  {cab.title}
                </h3>
                <p className="mt-1 font-body text-xl text-mamdani-fog">
                  {cab.blurb}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="panel px-5 py-5">
      <p className="font-pixel text-[8px] uppercase text-mamdani-fog">{label}</p>
      <p
        className="mt-2 font-pixel text-xl"
        style={{ color: accent, textShadow: "2px 2px 0 rgba(0,0,0,0.7)" }}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b-2 border-mamdani-steel pb-2">
      <div>
        <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
          {kicker}
        </p>
        <h2 className="pixel-heading mt-1 text-sm sm:text-base">{title}</h2>
      </div>
    </div>
  );
}
