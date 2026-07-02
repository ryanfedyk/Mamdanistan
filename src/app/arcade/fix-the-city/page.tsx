"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameCanvas } from "@/components/arcade/GameCanvas";
import { FixTheCityArcade } from "@/components/arcade/FixTheCityArcade";
import { fixTheCity, FIX_THE_CITY_DIMENSIONS } from "@/games/fixTheCity";
import { fixTheCityFlow, FIX_THE_CITY_FLOW_DIMENSIONS } from "@/games/fixTheCityFlow";
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

type Mode = "classic" | "flow";

export default function FixTheCityPage() {
  const cab = getCabinet("fix-the-city");
  const [mode, setMode] = useState<Mode>("classic");

  // Pick the variant from ?mode=flow (client-only; keeps one static page).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "flow") {
      setMode("flow");
    }
  }, []);

  const flow = mode === "flow";
  const engine = flow ? fixTheCityFlow : fixTheCity;
  const dims = flow ? FIX_THE_CITY_FLOW_DIMENSIONS : FIX_THE_CITY_DIMENSIONS;

  return (
    <>
      {/* Mobile (<lg): the game takes over the whole screen, map-style. */}
      <FixTheCityArcade key={mode} engine={engine} dims={dims} mode={mode} />

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="pixel-heading text-base text-mamdani-ember sm:text-2xl">
            {cab?.title ?? "Fix the City"}
          </h1>
          {/* A/B toggle between the two prototypes. */}
          <a
            href={flow ? "/arcade/fix-the-city" : "/arcade/fix-the-city?mode=flow"}
            className="rounded-sm border-2 border-mamdani-cyan px-3 py-1.5 font-pixel text-[9px] uppercase text-mamdani-cyan hover:bg-mamdani-cyan hover:text-mamdani-ink"
          >
            {flow ? "◀ Classic dodge" : "▶ Try Traffic-Flow"}
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="mx-auto w-full max-w-[420px]">
            <GameCanvas
              key={mode}
              engine={engine}
              width={dims.width}
              height={dims.height}
              keyMap={KEY_MAP}
              controls="dpad"
              accentColor="#FF6B35"
              fluid
              tapToStart
            />
          </div>

          <aside className="panel h-fit space-y-3 px-5 py-4">
            <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
              ⚠ Wireframe prototype — {flow ? "traffic-flow variant" : "classic dodge"}
            </p>
            <h2 className="font-pixel text-[10px] uppercase text-mamdani-gold">How to Play</h2>
            {flow ? (
              <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
                <li>🚦 A hazard stops its lane — cars pile up (they glow red).</li>
                <li>📈 Every jam pumps the GRIDLOCK meter. Max it out and the city seizes.</li>
                <li>🛠️ Park on a jam and HOLD (just stay put) to clear it — the lane flows again.</li>
                <li>🚗 Cars won&apos;t kill you — a bad crossing just makes you stumble a beat.</li>
                <li>🏁 Clear the whole repair quota to win — keep the city moving.</li>
              </ul>
            ) : (
              <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
                <li>🎮 TAP the board (or press any arrow) to start — no coin needed.</li>
                <li>⬆️⬇️⬅️➡️ Hop across the lanes with the D-PAD / arrows / WASD.</li>
                <li>🛠️ Stop on a hazard to patch it. New jobs keep popping up.</li>
                <li>🚗 A car clips you → bumped back a lane, minus a few seconds.</li>
                <li>🏁 Clear the whole repair quota before the clock dies to win.</li>
              </ul>
            )}
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
