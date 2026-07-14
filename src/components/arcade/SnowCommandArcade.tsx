"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  snowCommand,
  snowTileAt,
  SNOW_COMMAND_DIMENSIONS,
  type DirectorPose,
  type SnowCommandState,
} from "@/games/snowCommand";

/**
 * Snow Command — plow-desk shell. The canvas board takes the screen; the
 * Mayor sits at the bottom DIRECTING the fleet (poses reuse the Hot Take
 * sprite set), barking the orders the engine emits in state.director.
 *
 * Mobile (<lg): fixed full-window layer, like the other cabinets.
 * Desktop (lg+): centered column.
 */
const W = SNOW_COMMAND_DIMENSIONS.width;
const H = SNOW_COMMAND_DIMENSIONS.height;

/** Director poses → Hot Take frames (already normalized + cache-busted). */
const POSE_SRC: Record<DirectorPose, string> = {
  idle: "/sprites/hot-take/neutral.webp?v=2",
  order: "/sprites/hot-take/speakgest_1.webp?v=2", // pointing the order
  good: "/sprites/hot-take/speakgest_3.webp?v=2", // thumbs-up
  bad: "/sprites/hot-take/commgest_0.webp?v=2", // fuming at the drifts
  win: "/sprites/hot-take/smiling_1.webp?v=2",
  lose: "/sprites/hot-take/commgest_2.webp?v=2", // palm out — enough
};

type Hud = {
  phase: string;
  pose: DirectorPose;
  line: string;
  score: number;
  clear: number;
};

export function SnowCommandArcade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SnowCommandState>(snowCommand.init());
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const [hud, setHud] = useState<Hud>({
    phase: "attract",
    pose: "idle",
    line: "Storm's coming in. Ready the fleet.",
    score: 0,
    clear: 0,
  });

  const send = (intent: string) => {
    stateRef.current = snowCommand.handleInput(stateRef.current, intent);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const loop = (now: number) => {
      const last = lastRef.current || now;
      const delta = Math.min(now - last, 50);
      lastRef.current = now;
      const next = snowCommand.update(stateRef.current, delta);
      stateRef.current = next;
      snowCommand.render(ctx, next);
      setHud((p) =>
        p.phase === next.phase &&
        p.pose === next.director.pose &&
        p.line === next.director.line &&
        p.score === next.score &&
        p.clear === Math.round(next.clearFrac * 100)
          ? p
          : {
              phase: next.phase,
              pose: next.director.pose,
              line: next.director.line,
              score: next.score,
              clear: Math.round(next.clearFrac * 100),
            },
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Preload the director poses so they don't pop on first order.
  useEffect(() => {
    Object.values(POSE_SRC).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const tile = snowTileAt(px, py);
    if (stateRef.current.phase !== "playing") return send("start");
    if (tile) send(`tap:${tile[0]},${tile[1]}`);
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-x-0 bottom-0 top-[60px] z-40 flex select-none flex-col overflow-hidden bg-mamdani-ink [-webkit-touch-callout:none] lg:relative lg:inset-auto lg:top-auto lg:z-auto lg:mx-auto lg:h-auto lg:max-w-[460px] lg:rounded-lg lg:border-2 lg:border-black lg:shadow-brutal"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 font-pixel text-[10px] uppercase">
        <Link href="/arcade" className="text-mamdani-fog hover:text-mamdani-cyan">
          ‹ Arcade
        </Link>
        <span className="text-mamdani-cyan">Snow Command</span>
        <span className="text-mamdani-mint">☃ {hud.clear}%</span>
      </div>

      {/* Board */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onTap}
          className="max-h-full max-w-full touch-none rounded-sm"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>

      {/* The Mayor's plow desk: portrait + barked orders */}
      <div className="flex items-center gap-3 border-t-2 border-mamdani-steel bg-mamdani-slate/90 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 border-black bg-[#5a6a80]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSE_SRC[hud.pose]}
            alt="Mayor Mamdani directing the plow fleet"
            className="h-full w-full scale-[1.6] object-cover object-top"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[7px] uppercase text-mamdani-cyan">
            Mayor&apos;s plow desk
          </p>
          <p className="font-sans text-[13px] font-semibold leading-snug text-white">
            “{hud.line}”
          </p>
        </div>
        {(hud.phase === "won" || hud.phase === "gameover") && (
          <button
            onClick={() => send("start")}
            className="shrink-0 rounded-sm border-2 border-black bg-mamdani-gold px-3 py-2 font-pixel text-[9px] uppercase text-mamdani-ink shadow-pixel active:translate-y-[2px] active:shadow-none"
          >
            ↺ Again
          </button>
        )}
      </div>
    </div>
  );
}
