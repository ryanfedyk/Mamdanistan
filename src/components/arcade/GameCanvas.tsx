"use client";

import { useEffect, useRef, useState } from "react";
import type { BaseGameState, GameEngine } from "@/lib/types";

type KeyMap = Record<string, string>;

/**
 * Generic arcade canvas host. Owns the requestAnimationFrame loop and the
 * keyboard bridge; the game's logic lives entirely in its GameEngine. Swap
 * engines and key maps to mount a different cabinet — the render layer is dumb.
 */
export function GameCanvas<TState extends BaseGameState>({
  engine,
  width,
  height,
  keyMap,
  accentColor = "#21D4FD",
}: {
  engine: GameEngine<TState>;
  width: number;
  height: number;
  /** Maps a KeyboardEvent.code to an engine input intent. */
  keyMap: KeyMap;
  accentColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TState>(engine.init());
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  // Mirror a little state into React purely for the HUD readout.
  const [hud, setHud] = useState({ score: 0, phase: "attract", timeLeft: null as number | null });

  // The animation loop: update → render → repeat.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const loop = (now: number) => {
      const last = lastRef.current || now;
      const delta = Math.min(now - last, 50); // clamp big tab-switch gaps
      lastRef.current = now;

      const next = engine.update(stateRef.current, delta);
      stateRef.current = next;
      engine.render(ctx, next);

      setHud((prev) =>
        prev.score === next.score &&
        prev.phase === next.phase &&
        prev.timeLeft === next.timeLeft
          ? prev
          : { score: next.score, phase: next.phase, timeLeft: next.timeLeft },
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine]);

  // Keyboard bridge → engine intents.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const intent = keyMap[e.code];
      if (!intent) return;
      e.preventDefault();
      stateRef.current = engine.handleInput(stateRef.current, intent);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine, keyMap]);

  const tap = (intent: string) => {
    stateRef.current = engine.handleInput(stateRef.current, intent);
  };

  return (
    <div className="space-y-3">
      {/* HUD readout */}
      <div className="flex items-center justify-between font-pixel text-[10px] uppercase">
        <span style={{ color: accentColor }}>SCORE {hud.score}</span>
        {hud.timeLeft !== null && (
          <span className="text-mamdani-gold">
            TIME {Math.max(0, Math.ceil(hud.timeLeft))}
          </span>
        )}
        <span className="text-mamdani-fog">{hud.phase.toUpperCase()}</span>
      </div>

      <div className="panel crt inline-block p-1">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block w-full max-w-full rounded-sm"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </div>

      {/* Touch / click controls so it's playable without a keyboard. */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => tap("start")}
          className="rounded-sm border-2 border-black bg-mamdani-gold px-3 py-1.5 font-pixel text-[9px] uppercase text-mamdani-ink shadow-pixel active:translate-y-[2px] active:shadow-none"
        >
          ▶ Insert Coin
        </button>
        <button
          onClick={() => tap("reset")}
          className="rounded-sm border-2 border-mamdani-steel px-3 py-1.5 font-pixel text-[9px] uppercase text-mamdani-fog hover:text-white"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
