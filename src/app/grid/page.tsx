"use client";

import dynamic from "next/dynamic";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { CATEGORY_GLYPHS } from "@/data/pins";
import type { WinCategory } from "@/lib/types";

// Leaflet reaches for `window`, so the map is client-only.
const ImpactMap = dynamic(
  () => import("@/components/map/ImpactMap").then((m) => m.ImpactMap),
  {
    ssr: false,
    loading: () => (
      <div className="card-poster grid h-[60vh] place-items-center sm:h-[520px]">
        <p className="animate-blink font-display text-lg font-bold text-campaign-blue">
          DEPLOYING TACTICAL MAP…
        </p>
      </div>
    ),
  },
);

const LEGEND: Array<{ cat: WinCategory; label: string }> = [
  { cat: "pools", label: "Pools" },
  { cat: "infrastructure", label: "Infrastructure" },
  { cat: "housing", label: "Housing" },
  { cat: "transit", label: "Transit" },
  { cat: "parks", label: "Parks" },
];

export default function GridPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="eyebrow">Spatial Intel · Five Boroughs</p>
        <h1 className="poster-heading text-4xl sm:text-5xl">The Grid</h1>
        <p className="max-w-2xl font-sans text-lg leading-relaxed text-campaign-ink/80">
          Every flag is a confirmed material win. Tap one to pull the localized
          briefing — news clips, press, and the cold hard stats. Yes, the map is
          this clean on purpose.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBanner text="GRID STATUS: ONLINE" tone="neutral" />
          <ul className="flex flex-wrap gap-3">
            {LEGEND.map(({ cat, label }) => (
              <li
                key={cat}
                className="flex items-center gap-1 font-display text-sm font-bold text-campaign-ink/70"
              >
                <span aria-hidden>{CATEGORY_GLYPHS[cat]}</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <ImpactMap />
    </div>
  );
}
