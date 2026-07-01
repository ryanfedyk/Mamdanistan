"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
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
    <div className="space-y-6">
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
            alt={`${cab.title} — title art`}
            className="max-h-72 w-full object-cover [image-rendering:pixelated]"
          />
        </div>
      )}

      <header className="space-y-2">
        <h1 className="pixel-heading text-lg text-mamdani-ember sm:text-2xl">
          {cab?.title ?? "Fix the City"}
        </h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          {cab?.howToPlay}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GameCanvas
          engine={fixTheCity}
          width={FIX_THE_CITY_DIMENSIONS.width}
          height={FIX_THE_CITY_DIMENSIONS.height}
          keyMap={KEY_MAP}
          controls="dpad"
          accentColor="#FF6B35"
        />

        <aside className="panel h-fit space-y-3 px-5 py-5">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            Mission Brief
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>🚧 Use the on-screen D-PAD (or ARROWS / WASD).</li>
            <li>🕳️ Stop on a hazard to clear it (+25).</li>
            <li>⏱️ Clear the whole grid before the clock dies.</li>
            <li>🚲 Gridlock is the final boss. Defeat it.</li>
          </ul>
          <p className="font-terminal text-base text-mamdani-fog/70">
            Prototype loop — combos, angry drivers, and tougher grids incoming.
          </p>
        </aside>
      </div>
    </div>
  );
}
