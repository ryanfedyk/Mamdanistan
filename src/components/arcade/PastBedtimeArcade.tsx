"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  pastBedtime,
  PAST_BEDTIME_DIMENSIONS,
  type PastBedtimeState,
} from "@/games/pastBedtime";

/**
 * Past Bedtime — one-thumb cabinet. The whole game is a single tap (lock the
 * meter, take the shot), so the shell is just the canvas plus a top bar.
 * Mobile (<lg): fixed full-window layer. Desktop (lg+): centered column.
 */
const W = PAST_BEDTIME_DIMENSIONS.width;
const H = PAST_BEDTIME_DIMENSIONS.height;

export function PastBedtimeArcade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PastBedtimeState>(pastBedtime.init());
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const [hud, setHud] = useState({ phase: "attract", score: 0 });

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const loop = (now: number) => {
      const last = lastRef.current || now;
      const delta = Math.min(now - last, 50);
      lastRef.current = now;
      const next = pastBedtime.update(stateRef.current, delta);
      stateRef.current = next;
      pastBedtime.render(ctx, next);
      setHud((p) =>
        p.phase === next.phase && p.score === next.score
          ? p
          : { phase: next.phase, score: next.score },
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const tap = (e: React.PointerEvent) => {
    e.preventDefault();
    stateRef.current = pastBedtime.handleInput(stateRef.current, "tap");
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-x-0 bottom-0 top-[60px] z-40 flex select-none flex-col overflow-hidden bg-mamdani-ink [-webkit-touch-callout:none] lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:mx-auto lg:h-auto lg:max-w-[460px] lg:rounded-lg lg:border-2 lg:border-black lg:shadow-brutal"
    >
      <div className="flex items-center justify-between px-3 py-2 font-pixel text-[10px] uppercase">
        <Link href="/arcade" className="text-mamdani-fog hover:text-mamdani-cyan">
          ‹ Arcade
        </Link>
        <span className="text-mamdani-gold">Past Bedtime</span>
        <span className="text-mamdani-mint">🏀 {hud.score}</span>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={tap}
          className="max-h-full max-w-full touch-none rounded-sm"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>
    </div>
  );
}
