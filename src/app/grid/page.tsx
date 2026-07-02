"use client";

import dynamic from "next/dynamic";
import { CATEGORY_GLYPHS } from "@/data/pins";
import type { WinCategory } from "@/lib/types";
import { MobileMap } from "@/components/map/MobileMap";

// Desktop side-panel map (image-based; client-only state).
const ImpactMap = dynamic(
  () => import("@/components/map/ImpactMap").then((m) => m.ImpactMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[520px] place-items-center border-4 border-outline bg-white brutal-shadow">
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
  { cat: "labor", label: "Labor" },
  { cat: "health", label: "Health" },
  { cat: "food", label: "Food" },
  { cat: "climate", label: "Climate" },
  { cat: "consumer", label: "Consumer" },
  { cat: "campaign", label: "Campaign" },
  { cat: "culture", label: "Culture" },
];

export default function GridPage() {
  return (
    <>
      {/* Mobile (<lg): full-screen, page-locked map with floating UI. */}
      <MobileMap />

      {/* Desktop (lg+): blue section, header, and the side-panel map. */}
      <div className="hidden border-b-4 border-outline bg-primary py-12 text-white lg:block">
        <div className="mx-auto max-w-[1200px] space-y-8 px-4 md:px-12">
          <header className="space-y-4 border-b-4 border-white pb-6">
            <h1 className="brutal-heading text-5xl tracking-tight">
              Tactical Map: The Five Boroughs
            </h1>
            <div className="flex items-center gap-3 text-sm font-black uppercase text-secondary">
              <span className="h-4 w-4 animate-blink rounded-full bg-tertiary shadow-[2px_2px_0_0_#fff]" />
              Live Uplink: NYC Command Center
            </div>
            <p className="max-w-2xl text-lg font-bold leading-relaxed text-white">
              Every flag is a confirmed material win. Click one to pull the
              localized briefing — news clips, press, and the cold hard stats.
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
    </>
  );
}
