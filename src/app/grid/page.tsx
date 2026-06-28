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
      <div className="panel crt grid h-[420px] place-items-center sm:h-[520px]">
        <p className="animate-blink font-pixel text-xs text-mamdani-cyan">
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
        <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
          Spatial Intel · Five Boroughs
        </p>
        <h1 className="pixel-heading text-lg sm:text-2xl">The Grid</h1>
        <p className="max-w-2xl font-body text-xl leading-relaxed text-mamdani-fog">
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
                className="flex items-center gap-1 font-pixel text-[8px] uppercase text-mamdani-fog"
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
