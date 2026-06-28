import { Button } from "@/components/ui/Button";
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
    <div className="space-y-16">
      {/* ---- HERO ---- */}
      <section className="card-poster overflow-hidden">
        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          <div className="sunburst-bg" />
          <div className="space-y-6">
            <StatusBanner text="BUREAUCRACY LEVEL: DEFEATED" tone="victory" />
            <h1 className="poster-heading text-5xl leading-[0.95] sm:text-7xl">
              Welcome to
              <span className="mt-1 block text-campaign-blue">Mamdanistan</span>
            </h1>
            <p className="max-w-2xl font-display text-2xl font-bold leading-tight text-campaign-ink sm:text-3xl">
              The potholes are fixed. The pools are open.{" "}
              <span className="bg-campaign-sun px-1 text-campaign-navy">
                Panic accordingly.
              </span>
            </p>
            <p className="max-w-xl font-sans text-lg leading-relaxed text-campaign-ink/80">
              A neighborhood scoreboard for the most dangerous force in city
              politics: a government that actually works. Track the wins on The
              Grid, then prove your worth in The Arcade.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/grid" variant="blue">
                Open The Grid →
              </Button>
              <Button href="/arcade" variant="sun">
                Enter The Arcade →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- WAR ROOM STATS ---- */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Confirmed Wins" value={String(wins)} accent="bg-campaign-blue text-campaign-cream" />
        <StatCard label="Avg. Mission %" value={`${avgProgress}%`} accent="bg-campaign-sun text-campaign-navy" />
        <StatCard label="Panic Index" value="MAXIMUM" accent="bg-campaign-brick text-campaign-cream" />
      </section>

      {/* ---- THE GRID PREVIEW ---- */}
      <section className="space-y-6">
        <SectionHeading kicker="Spatial Intel" title="Latest from The Grid" />
        <div className="grid gap-5 sm:grid-cols-2">
          {MAP_PINS.map((pin) => {
            const color = CATEGORY_COLORS[pin.category];
            return (
              <Link
                key={pin.id}
                href="/grid"
                className="card-poster group block px-6 py-6 transition-transform hover:-translate-y-1"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-campaign-navy text-lg"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  >
                    {CATEGORY_GLYPHS[pin.category]}
                  </span>
                  <h3 className="font-display text-xl font-black text-campaign-navy">
                    {pin.title}
                  </h3>
                </div>
                <p className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-campaign-ink/60">
                  {pin.neighborhood} · {pin.borough}
                </p>
                <p className="mb-4 font-sans text-lg leading-snug text-campaign-ink">
                  {pin.tagline}
                </p>
                <ProgressBar value={pin.progress} color={color} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---- THE ARCADE PREVIEW ---- */}
      <section className="space-y-6">
        <SectionHeading kicker="Civic Engagement, Gamified" title="The Arcade" />
        <div className="grid gap-5 sm:grid-cols-2">
          {ARCADE_CABINETS.map((cab) => (
            <Link
              key={cab.id}
              href={`/arcade/${cab.id}`}
              className="card-poster group flex items-center gap-4 px-6 py-6 transition-transform hover:-translate-y-1"
            >
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-campaign-navy bg-campaign-blue text-3xl"
                aria-hidden
              >
                {cab.glyph}
              </span>
              <div>
                <h3 className="font-display text-xl font-black text-campaign-navy">
                  {cab.title}
                </h3>
                <p className="mt-1 font-sans text-lg text-campaign-ink/80">
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
    <div className={`card-poster overflow-hidden ${accent}`}>
      <div className="px-6 py-6">
        <p className="font-display text-sm font-bold uppercase tracking-wide opacity-80">
          {label}
        </p>
        <p className="mt-1 font-display text-4xl font-black">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="border-b-2 border-campaign-navy/30 pb-2">
      <p className="eyebrow">{kicker}</p>
      <h2 className="poster-heading mt-2 text-3xl sm:text-4xl">{title}</h2>
    </div>
  );
}
