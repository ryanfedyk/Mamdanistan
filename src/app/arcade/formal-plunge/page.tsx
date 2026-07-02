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

      {/* Cover art — desktop only; on mobile it just eats the screen the
          game should own. */}
      {cab?.hero && (
        <div className="panel hidden overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cab.hero}
            alt={`${cab.title} — title card`}
            className="max-h-64 w-full object-cover [image-rendering:pixelated]"
          />
        </div>
      )}

      <h1 className="pixel-heading text-base text-mamdani-mint sm:text-2xl">
        {cab?.title ?? "Formal Plunge"}
      </h1>

      {/* Full-width game; the how-to lives once, below it. */}
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

        <aside className="panel space-y-2 px-5 py-4">
          <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">
            How to Play
          </h2>
          <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
            <li>🤿 TAP the pool (or KICK OFF) to dive in — then you just steer.</li>
            <li>▲▼ Hold UP / DOWN (or ↑ ↓ / W S) to dodge the billionaires.</li>
            <li>🏁 Reach the finish line to win. One touch and they drag you under.</li>
            <li>
              🤖 Their data centers are drinking the pool dry — every lap is
              water the AI didn&apos;t guzzle.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
