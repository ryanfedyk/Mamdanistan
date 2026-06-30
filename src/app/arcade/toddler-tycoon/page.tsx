"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import { toddlerTycoon, TODDLER_TYCOON_DIMENSIONS } from "@/games/toddlerTycoon";
import { getCabinet } from "@/data/games";

const KEY_MAP: Record<string, string> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyA: "left",
  KeyD: "right",
  Space: "start",
  Enter: "start",
};

export default function ToddlerTycoonPage() {
  const cab = getCabinet("toddler-tycoon");
  return (
    <div className="space-y-6">
      <Link
        href="/arcade"
        className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>
      <header className="space-y-2">
        <h1 className="pixel-heading text-lg text-mamdani-gold sm:text-2xl">
          {cab?.title ?? "Toddler Tycoon"}
        </h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          {cab?.howToPlay}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GameCanvas
          engine={toddlerTycoon}
          width={TODDLER_TYCOON_DIMENSIONS.width}
          height={TODDLER_TYCOON_DIMENSIONS.height}
          keyMap={KEY_MAP}
          controls="dpad"
          accentColor="#FFD23F"
        />
        <aside className="panel h-fit space-y-3 px-5 py-5">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            Mission Brief
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>🧺 ◀ ▶ (or the D-pad) slides the Toddler Oasis.</li>
            <li>🧒 Catch toddlers for free childcare (+20 each).</li>
            <li>⏱️ Survive the clock to lock in universal care.</li>
            <li>⚠️ Drop 6 and the program is under review.</li>
          </ul>
          <p className="font-terminal text-base text-mamdani-fog/70">
            Prototype loop — real sprites + power-ups land with the rebuild.
          </p>
        </aside>
      </div>
    </div>
  );
}
