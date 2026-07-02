"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import { FixTheCityArcade } from "@/components/arcade/FixTheCityArcade";
import { fixTheCity, FIX_THE_CITY_DIMENSIONS } from "@/games/fixTheCity";
import { getCabinet } from "@/data/games";

const KEY_MAP: Record<string, string> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  Space: "start",
  Enter: "start",
};

export default function FixTheCityPage() {
  const cab = getCabinet("fix-the-city");

  return (
    <>
      {/* Mobile (<lg): the game takes over the whole screen, map-style, with
          draggable bottom sheets for the briefing + results. */}
      <FixTheCityArcade />

      {/* Desktop (lg+): the standard cabinet page. */}
      <div className="hidden space-y-6 lg:block">
        <Link
          href="/arcade"
          className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
        >
          ‹ Back to The Arcade
        </Link>

        {cab?.hero && (
          <div className="panel overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cab.hero}
              alt={`${cab.title} — title card`}
              className="max-h-64 w-full object-cover [image-rendering:pixelated]"
            />
          </div>
        )}

        <h1 className="pixel-heading text-base text-mamdani-ember sm:text-2xl">
          {cab?.title ?? "Fix the City"}
        </h1>

        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="mx-auto w-full max-w-[420px]">
            <GameCanvas
              engine={fixTheCity}
              width={FIX_THE_CITY_DIMENSIONS.width}
              height={FIX_THE_CITY_DIMENSIONS.height}
              keyMap={KEY_MAP}
              controls="dpad"
              accentColor="#FF6B35"
              fluid
              tapToStart
            />
          </div>

          <aside className="panel h-fit space-y-3 px-5 py-4">
            <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
              ⚠ Wireframe prototype — art incoming
            </p>
            <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
              How to Play
            </h2>
            <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
              <li>🎮 TAP the board (or press any arrow) to start — no coin needed.</li>
              <li>⬆️⬇️⬅️➡️ Hop across the lanes with the D-PAD / arrows / WASD.</li>
              <li>🛠️ Stop on a hazard to patch it. New jobs keep popping up.</li>
              <li>🚗 A car clips you → bumped back a lane, minus a few seconds.</li>
              <li>🏁 Clear the whole repair quota before the clock dies to win.</li>
            </ul>
            <div className="space-y-1 border-t border-mamdani-steel/40 pt-3 font-terminal text-base text-mamdani-fog/80">
              <p className="font-pixel text-[8px] uppercase text-mamdani-fog">Hazard key</p>
              <p>🕳️ pothole · 🚧 construction · 🪨 debris · 🚒 hydrant · 🚦 signal</p>
              <p className="text-mamdani-cyan/70">
                → cyan cars run right · ← amber cars run left.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
