"use client";

import dynamic from "next/dynamic";
import { CATEGORY_GLYPHS } from "@/data/pins";
import type { WinCategory } from "@/lib/types";

// Leaflet reaches for `window`, so the map is client-only.
const ImpactMap = dynamic(
  () => import("@/components/map/ImpactMap").then((m) => m.ImpactMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[60vh] place-items-center border-4 border-outline bg-white brutal-shadow sm:h-[520px]">
        <p className="animate-blink font-display text-lg font-black uppercase text-primary">
          Deploying Tactical Map…
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
    <div className="border-b-4 border-outline bg-primary py-12 text-white sm:py-16">
      <div className="mx-auto max-w-[1200px] space-y-8 px-4 md:px-12">
        <header className="space-y-4 border-b-4 border-white pb-6">
          <h1 className="brutal-heading text-4xl tracking-tight sm:text-5xl">
            Tactical Map: The Five Boroughs
          </h1>
          <div className="flex items-center gap-3 text-sm font-black uppercase text-secondary">
            <span className="h-4 w-4 animate-blink rounded-full bg-tertiary shadow-[2px_2px_0_0_#fff]" />
            Live Uplink: NYC Command Center
          </div>
          <p className="max-w-2xl text-lg font-bold leading-relaxed text-white">
            Every flag is a confirmed material win. Tap one to pull the localized
            briefing — news clips, press, and the cold hard stats.
          </p>
          <ul className="flex flex-wrap gap-3">
            {LEGEND.map(({ cat, label }) => (
              <li
                key={cat}
                className="flex items-center gap-1 border-2 border-white bg-primary px-2 py-1 text-xs font-black uppercase"
              >
                <span aria-hidden>{CATEGORY_GLYPHS[cat]}</span>
                {label}
              </li>
            ))}
          </ul>
        </header>

        <ImpactMap />
      </div>
    </div>
  );
}
