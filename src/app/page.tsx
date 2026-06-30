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
    <div>
      {/* ---- HERO ---- */}
      <section className="border-b-4 border-outline bg-secondary py-14 sm:py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 px-4 md:px-12 lg:grid-cols-12">
          <div className="space-y-7 lg:col-span-7">
            <StatusBanner text="BUREAUCRACY LEVEL: DEFEATED" tone="neutral" />
            <h1 className="brutal-heading text-5xl leading-[0.9] text-primary sm:text-7xl">
              Citizens of{" "}
              <span className="bg-primary px-2 italic text-white">
                New York City
              </span>{" "}
              rejoice!
            </h1>
            <p className="max-w-xl text-lg font-bold leading-relaxed text-black sm:text-xl">
              You&apos;ve entered the liberated zone of{" "}
              <span className="underline decoration-tertiary decoration-4">
                Mamdani-stan
              </span>
              . The potholes are fixed. The pools are open.{" "}
              <span className="bg-tertiary px-1 text-white">
                Panic accordingly.
              </span>
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button href="/grid" variant="white">
                Open The Grid →
              </Button>
              <Button href="/arcade" variant="blue">
                Enter The Arcade →
              </Button>
            </div>
          </div>

          {/* Hero stat block */}
          <div className="lg:col-span-5">
            <div className="rotate-2 border-4 border-outline bg-primary p-3 brutal-shadow-blue">
              <div className="grid grid-cols-2 gap-3 border-4 border-outline bg-white p-4">
                <HeroStat value={String(wins)} label="Confirmed Wins" color="text-primary" />
                <HeroStat value={`${avgProgress}%`} label="Avg. Mission" color="text-tertiary" />
                <HeroStat value="42" label="Liberated Blocks" color="text-primary" />
                <HeroStat value="MAX" label="Panic Index" color="text-tertiary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-16 px-4 py-16 md:px-12">
        {/* ---- THE GRID PREVIEW ---- */}
        <section className="space-y-6">
          <SectionHeading kicker="Spatial Intel" title="Latest from The Grid" />
          <div className="grid gap-6 sm:grid-cols-2">
            {MAP_PINS.map((pin) => {
              const color = CATEGORY_COLORS[pin.category];
              return (
                <Link
                  key={pin.id}
                  href="/grid"
                  className="brutal-card group block p-6 transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center border-4 border-outline text-lg"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    >
                      {CATEGORY_GLYPHS[pin.category]}
                    </span>
                    <h3 className="brutal-heading text-xl text-black">
                      {pin.title}
                    </h3>
                  </div>
                  <p className="mb-1 text-xs font-black uppercase tracking-wide text-black/50">
                    {pin.neighborhood} · {pin.borough}
                  </p>
                  <p className="mb-4 text-lg font-bold leading-snug text-black">
                    {pin.tagline}
                  </p>
                  <ProgressBar value={pin.progress} color={color} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---- MAYOR'S MESSAGE + ACTION ---- */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col justify-center gap-6 border-4 border-outline bg-secondary p-8 brutal-shadow-blue lg:col-span-7">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary">
                The People&apos;s Choice
              </div>
              <h3 className="brutal-heading mt-1 text-3xl leading-none text-black sm:text-4xl">
                Mayor&apos;s Message
              </h3>
            </div>
            <blockquote className="text-lg font-bold italic leading-relaxed text-black sm:text-xl">
              &ldquo;Friends, neighbors, and subway-dwellers. Mamdani-stan
              isn&apos;t just a place on a map — it&apos;s the feeling of finding
              an empty seat on the N-train during rush hour.&rdquo;
            </blockquote>
            <div className="text-sm font-black uppercase text-primary">
              — Z. Mamdani, Supreme Connector
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex flex-1 flex-col justify-between gap-4 border-4 border-outline bg-tertiary p-7 text-white brutal-shadow">
              <div className="text-6xl font-black">12.4K</div>
              <div className="text-xs font-black uppercase tracking-tight">
                Active Volunteers
              </div>
            </div>
            <Link
              href="/grid"
              className="group flex flex-1 flex-col justify-between gap-3 border-4 border-outline bg-white p-7 brutal-shadow-yellow transition-colors hover:bg-secondary"
            >
              <div>
                <div className="text-xs font-black uppercase text-primary">
                  Latest Dispatch
                </div>
                <div className="brutal-heading mt-1 text-2xl">
                  New Policy Guidelines Released
                </div>
              </div>
              <span className="self-end text-4xl font-black text-tertiary transition-transform group-hover:translate-x-2">
                →
              </span>
            </Link>
          </div>
        </section>

        {/* ---- FEATURED: HOT MIC ---- */}
        <section className="border-4 border-outline bg-primary text-white brutal-shadow-yellow">
          <div className="grid gap-6 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-5">
              <span className="inline-block border-2 border-outline bg-secondary px-2 py-0.5 text-xs font-black uppercase text-on-secondary">
                Featured Mission
              </span>
              <h2 className="brutal-heading text-4xl leading-[0.95] sm:text-6xl">
                Can you survive the press?
              </h2>
              <p className="max-w-xl text-lg font-bold leading-relaxed">
                National reporters want a gaffe. Dodge the noise, pivot every
                trap back to pools, rent, and buses — and don&apos;t become the
                story. <span className="bg-tertiary px-1">Hot Mic</span> is the
                press gauntlet.
              </p>
              <div className="max-w-sm space-y-2">
                <FeatureMeter label="Momentum" pct={72} color="bg-secondary" />
                <FeatureMeter label="Noise" pct={18} color="bg-tertiary" />
              </div>
              <Button href="/arcade/hot-mic" variant="orange">
                🎙️ Play Hot Mic
              </Button>
            </div>
            <div className="hidden text-[140px] leading-none lg:block" aria-hidden>
              🎙️
            </div>
          </div>
        </section>

        {/* ---- THE ARCADE PREVIEW ---- */}
        <section className="space-y-6">
          <SectionHeading kicker="Civic Engagement, Gamified" title="The Arcade" />
          <div className="grid gap-6 sm:grid-cols-2">
            {ARCADE_CABINETS.map((cab) => (
              <Link
                key={cab.id}
                href={`/arcade/${cab.id}`}
                className="brutal-card group flex items-center gap-4 p-6 transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
              >
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center border-4 border-outline bg-primary text-3xl"
                  aria-hidden
                >
                  {cab.glyph}
                </span>
                <div>
                  <h3 className="brutal-heading text-xl text-black">
                    {cab.title}
                  </h3>
                  <p className="mt-1 text-base font-bold text-black/70">
                    {cab.blurb}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ---- NEWSLETTER / CTA ---- */}
        <section className="border-4 border-outline bg-tertiary p-10 text-white brutal-shadow-blue sm:p-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 text-center">
            <h2 className="brutal-heading text-4xl leading-[0.9] sm:text-6xl">
              Join the Liberation Front
            </h2>
            <p className="text-lg font-bold">
              Weekly radio-frequency updates and secret mission locations,
              delivered to your pneumatic tube (or inbox).
            </p>
            <form className="flex w-full flex-col gap-4 pt-2 sm:flex-row">
              <input
                type="email"
                required
                placeholder="YOUR_IDENTITY@CITIZEN.COM"
                className="flex-grow border-4 border-outline bg-white px-6 py-4 text-sm font-black uppercase text-black placeholder:opacity-50 focus:outline-none focus:ring-4 focus:ring-secondary"
              />
              <button
                type="submit"
                className="btn-brutal bg-secondary text-on-secondary brutal-shadow hover:bg-white"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroStat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="border-2 border-outline bg-surface p-3">
      <div className={`text-3xl font-black leading-none ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-tight text-black">
        {label}
      </div>
    </div>
  );
}

function FeatureMeter({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-black uppercase">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-4 overflow-hidden border-2 border-outline bg-white">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="border-b-4 border-outline pb-3">
      <span className="inline-block border-2 border-outline bg-primary px-2 py-0.5 text-xs font-black uppercase tracking-wide text-white">
        {kicker}
      </span>
      <h2 className="brutal-heading mt-2 text-3xl sm:text-4xl">{title}</h2>
    </div>
  );
}
