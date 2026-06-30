"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import { asphaltAttack, ASPHALT_ATTACK_DIMENSIONS } from "@/games/asphaltAttack";
import { getCabinet } from "@/data/games";

const KEY_MAP: Record<string, string> = {
  Space: "start",
  Enter: "start",
};

export default function AsphaltAttackPage() {
  const cab = getCabinet("asphalt-attack");
  return (
    <div className="space-y-6">
      <Link
        href="/arcade"
        className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>
      <header className="space-y-2">
        <h1 className="pixel-heading text-lg text-mamdani-ember sm:text-2xl">
          {cab?.title ?? "Asphalt Attack"}
        </h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          {cab?.howToPlay}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GameCanvas
          engine={asphaltAttack}
          width={ASPHALT_ATTACK_DIMENSIONS.width}
          height={ASPHALT_ATTACK_DIMENSIONS.height}
          keyMap={KEY_MAP}
          controls="tap"
          accentColor="#FF6B35"
        />
        <aside className="panel h-fit space-y-3 px-5 py-5">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            Mission Brief
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>☝ TAP a pothole to patch it (+25).</li>
            <li>🕳️ They redden as they near curing — be quick.</li>
            <li>⏱️ Survive the clock to bury the bureaucracy.</li>
            <li>⚠️ Let 12 cure into craters and the road wins.</li>
          </ul>
          <p className="font-terminal text-base text-mamdani-fog/70">
            Prototype loop — real sprites + power-ups land with the rebuild.
          </p>
        </aside>
      </div>
    </div>
  );
}
