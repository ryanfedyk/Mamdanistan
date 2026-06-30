"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import {
  landlordInvaders,
  LANDLORD_INVADERS_DIMENSIONS,
} from "@/games/landlordInvaders";
import { getCabinet } from "@/data/games";

const KEY_MAP: Record<string, string> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyA: "left",
  KeyD: "right",
  Space: "fire",
  ArrowUp: "fire",
  Enter: "start",
};

export default function LandlordInvadersPage() {
  const cab = getCabinet("landlord-invaders");

  return (
    <div className="space-y-6">
      <Link
        href="/arcade"
        className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>

      <header className="space-y-2">
        <h1 className="pixel-heading text-lg text-mamdani-red sm:text-2xl">
          {cab?.title ?? "Landlord Invaders"}
        </h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          {cab?.howToPlay}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GameCanvas
          engine={landlordInvaders}
          width={LANDLORD_INVADERS_DIMENSIONS.width}
          height={LANDLORD_INVADERS_DIMENSIONS.height}
          keyMap={KEY_MAP}
          controls="shooter"
          accentColor="#FF2E4D"
        />

        <aside className="panel h-fit space-y-3 px-5 py-5">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            Mission Brief
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>💼 Landlords descend row by row, faster as they thin out.</li>
            <li>🔫 FIRE / SPACE launches an eviction notice (max 3 in flight).</li>
            <li>🧊 Clear the whole board to freeze the rent and win.</li>
            <li>⚠️ Let one reach street level and the rent gets hiked.</li>
          </ul>
          <p className="font-terminal text-base text-mamdani-fog/70">
            Prototype loop — power-ups, landlord fire, and waves incoming.
          </p>
        </aside>
      </div>
    </div>
  );
}
