"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import { FixTheCityArcade } from "@/components/arcade/FixTheCityArcade";
import { fixTheCityRun, FIX_THE_CITY_RUN_DIMENSIONS } from "@/games/fixTheCityRun";
import { getCabinet } from "@/data/games";

const KEY_MAP: Record<string, string> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  Space: "start",
  Enter: "start",
};

export default function FixTheCityPage() {
  const cab = getCabinet("fix-the-city");

  return (
    <>
      {/* Mobile (<lg): the Mayor-runner takes over the whole screen. */}
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
          <div className="mx-auto w-full max-w-2xl">
            <GameCanvas
              engine={fixTheCityRun}
              width={FIX_THE_CITY_RUN_DIMENSIONS.width}
              height={FIX_THE_CITY_RUN_DIMENSIONS.height}
              keyMap={KEY_MAP}
              controls="updown"
              accentColor="#FF6B35"
              fluid
            />
          </div>

          <aside className="panel h-fit space-y-3 px-5 py-4">
            <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
              ⚠ Wireframe prototype — art incoming
            </p>
            <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">How to Play</h2>
            <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
              <li>🏃 You&apos;re the Mayor — you jog down the street on your own.</li>
              <li>⬆️⬇️ Press UP / DOWN (or ▲ ▼ / W S) to change lanes.</li>
              <li>🛠️ Line up on a pothole and it patches — a car is racing it from behind.</li>
              <li>🚗 Beat the car and the lane flows; lose the race and it jams (📈 gridlock).</li>
              <li>🏁 Finish the shift&apos;s patches before GRIDLOCK maxes out.</li>
            </ul>
            <div className="space-y-1 border-t border-mamdani-steel/40 pt-3 font-terminal text-base text-mamdani-fog/80">
              <p className="font-pixel text-[8px] uppercase text-mamdani-fog">Hazard key</p>
              <p>🕳️ pothole · 🚧 construction · 🪨 debris · 🚒 hydrant · 🚦 signal</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
