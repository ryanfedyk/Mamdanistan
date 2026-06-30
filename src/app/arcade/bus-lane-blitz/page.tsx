"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import { busLaneBlitz, BUS_LANE_BLITZ_DIMENSIONS } from "@/games/busLaneBlitz";
import { getCabinet } from "@/data/games";

const KEY_MAP: Record<string, string> = {
  ArrowUp: "up",
  ArrowDown: "down",
  KeyW: "up",
  KeyS: "down",
  Space: "start",
  Enter: "start",
};

export default function BusLaneBlitzPage() {
  const cab = getCabinet("bus-lane-blitz");
  return (
    <div className="space-y-6">
      <Link
        href="/arcade"
        className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>
      <header className="space-y-2">
        <h1 className="pixel-heading text-lg text-mamdani-cyan sm:text-2xl">
          {cab?.title ?? "Bus Lane Blitz"}
        </h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          {cab?.howToPlay}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GameCanvas
          engine={busLaneBlitz}
          width={BUS_LANE_BLITZ_DIMENSIONS.width}
          height={BUS_LANE_BLITZ_DIMENSIONS.height}
          keyMap={KEY_MAP}
          controls="dpad"
          accentColor="#21D4FD"
        />
        <aside className="panel h-fit space-y-3 px-5 py-5">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            Mission Brief
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>🚌 UP / DOWN (or the D-pad) switches lanes.</li>
            <li>🚧 Dodge cars, cones, and dead fare boxes.</li>
            <li>⏱️ Survive the clock to win — speed ramps up.</li>
            <li>💥 One collision ends the run.</li>
          </ul>
          <p className="font-terminal text-base text-mamdani-fog/70">
            Prototype loop — real sprites + power-ups land with the rebuild.
          </p>
        </aside>
      </div>
    </div>
  );
}
