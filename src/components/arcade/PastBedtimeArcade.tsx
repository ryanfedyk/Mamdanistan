"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  pastBedtime,
  isGoalTap,
  PAST_BEDTIME_DIMENSIONS,
  type PastBedtimeState,
} from "@/games/pastBedtime";

/**
 * Past Bedtime v2 — dribble with arrows/WASD (or the D-pad on mobile),
 * tap the goal (or SHOOT / Space) to let it fly.
 * Mobile (<lg): fixed full-window layer. Desktop (lg+): centered column.
 */
const W = PAST_BEDTIME_DIMENSIONS.width;
const H = PAST_BEDTIME_DIMENSIONS.height;

const KEYS: Record<string, [string, string]> = {
  ArrowLeft: ["left", "leftoff"],
  KeyA: ["left", "leftoff"],
  ArrowRight: ["right", "rightoff"],
  KeyD: ["right", "rightoff"],
  ArrowUp: ["up", "upoff"],
  KeyW: ["up", "upoff"],
  ArrowDown: ["down", "downoff"],
  KeyS: ["down", "downoff"],
};

export function PastBedtimeArcade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PastBedtimeState>(pastBedtime.init());
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const [hud, setHud] = useState({ phase: "attract", score: 0 });

  const send = (intent: string) => {
    stateRef.current = pastBedtime.handleInput(stateRef.current, intent);
  };

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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        send("shoot");
        return;
      }
      const m = KEYS[e.code];
      if (!m) return;
      e.preventDefault();
      if (!e.repeat) send(m[0]);
    };
    const up = (e: KeyboardEvent) => {
      const m = KEYS[e.code];
      if (m) send(m[1]);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Tap the goal to shoot (anywhere in the hoop zone at the top).
  const onCanvasTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const el = canvasRef.current;
    if (!el) return;
    if (stateRef.current.phase !== "playing") return send("start");
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    if (isGoalTap(px, py)) send("shoot");
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

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onCanvasTap}
          className="max-h-full max-w-full touch-none rounded-sm"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>

      {/* D-pad + shoot. Buttons hold-to-move (pointer down/up). */}
      <div className="flex items-center justify-between gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="grid grid-cols-3 grid-rows-2 gap-1.5">
          <span />
          <PadBtn label="▲" on="up" off="upoff" send={send} />
          <span />
          <PadBtn label="◀" on="left" off="leftoff" send={send} />
          <PadBtn label="▼" on="down" off="downoff" send={send} />
          <PadBtn label="▶" on="right" off="rightoff" send={send} />
        </div>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            send(hud.phase === "playing" ? "shoot" : "start");
          }}
          className="h-[88px] flex-1 touch-none rounded-md border-2 border-black bg-mamdani-gold font-pixel text-sm uppercase text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
        >
          🏀 Shoot
        </button>
      </div>
    </div>
  );
}

function PadBtn({
  label,
  on,
  off,
  send,
}: {
  label: string;
  on: string;
  off: string;
  send: (i: string) => void;
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        send(on);
      }}
      onPointerUp={() => send(off)}
      onPointerCancel={() => send(off)}
      onPointerLeave={() => send(off)}
      aria-label={on}
      className="h-11 w-11 touch-none rounded-md border-2 border-black bg-mamdani-steel font-pixel text-base text-mamdani-gold shadow-pixel active:translate-y-[2px] active:shadow-none"
    >
      {label}
    </button>
  );
}
