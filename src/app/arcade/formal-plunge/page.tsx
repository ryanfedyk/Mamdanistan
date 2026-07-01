"use client";

import { useEffect } from "react";
import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import {
  formalPlunge,
  FORMAL_PLUNGE_DIMENSIONS,
  preloadFormalPlunge,
} from "@/games/formalPlunge";
import { getCabinet } from "@/data/games";

const KEY_MAP: Record<string, string> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  Space: "start",
  Enter: "start",
};

export default function FormalPlungePage() {
  const cab = getCabinet("formal-plunge");

  // Preload every sprite + the background so nothing pops in mid-play.
  useEffect(() => {
    preloadFormalPlunge();
  }, []);

  return (
    <div className="space-y-6">
      <Link
        href="/arcade"
        className="inline-block font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>

      <header className="space-y-2">
        <h1 className="pixel-heading text-lg text-mamdani-mint sm:text-2xl">
          {cab?.title ?? "Formal Plunge"}
        </h1>
        <p className="max-w-2xl font-terminal text-xl leading-relaxed text-mamdani-fog">
          {cab?.howToPlay}
        </p>
      </header>

      {/* Full-width game on desktop, mission brief below. */}
      <div className="space-y-6">
        <GameCanvas
          engine={formalPlunge}
          width={FORMAL_PLUNGE_DIMENSIONS.width}
          height={FORMAL_PLUNGE_DIMENSIONS.height}
          keyMap={KEY_MAP}
          controls="updown"
          accentColor="#3DDC97"
          fluid
        />

        <aside className="panel space-y-3 px-5 py-5">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            Mission Brief
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>🤿 TAP (or the KICK OFF button) to dive off the board.</li>
            <li>🏊 Zohran swims on his own — you just steer.</li>
            <li>▲▼ Hold UP / DOWN (or ↑ / ↓ / W / S) to glide and dodge.</li>
            <li>🚀 Duck the rocket-suit bros, robber barons, cash-divers…</li>
            <li>🦢 …and the swan-float tycoons crashing the public pool.</li>
            <li>
              🤖 Their data centers are drinking the pool dry — every lap you
              swim is water the AI didn&apos;t guzzle.
            </li>
          </ul>
          <p className="font-terminal text-base text-mamdani-fog/70">
            One touch and they drag you under. The pool belongs to the people —
            not the server farms.
          </p>
        </aside>
      </div>
    </div>
  );
}
