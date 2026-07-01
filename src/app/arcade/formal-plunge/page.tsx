"use client";

import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import { formalPlunge, FORMAL_PLUNGE_DIMENSIONS } from "@/games/formalPlunge";
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

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <GameCanvas
          engine={formalPlunge}
          width={FORMAL_PLUNGE_DIMENSIONS.width}
          height={FORMAL_PLUNGE_DIMENSIONS.height}
          keyMap={KEY_MAP}
          controls="updown"
          accentColor="#3DDC97"
        />

        <aside className="panel h-fit space-y-3 px-5 py-5">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            Mission Brief
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>🤿 TAP (or the KICK OFF button) to dive off the board.</li>
            <li>🏊 Zohran swims on his own — you just steer.</li>
            <li>▲▼ Press UP / DOWN (or ↑ / ↓ / W / S) to glide and dodge.</li>
            <li>🚀 Duck the rocket-suit bros, robber barons, cash-divers…</li>
            <li>🦢 …and the swan-float tycoons crashing the public pool.</li>
          </ul>
          <p className="font-terminal text-base text-mamdani-fog/70">
            One touch and they drag you under. The pool belongs to the people.
          </p>
        </aside>
      </div>
    </div>
  );
}
