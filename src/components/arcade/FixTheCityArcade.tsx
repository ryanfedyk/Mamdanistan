"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  fixTheCityRun,
  FIX_THE_CITY_RUN_DIMENSIONS,
  type FixTheCityRunState,
} from "@/games/fixTheCityRun";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { GameEngine } from "@/lib/types";

type Hud = { score: number; phase: string; fixed: number; hits: number; quota: number };

/**
 * Fix the City — full-screen mobile cabinet (<lg). The Mayor-runner takes over
 * the whole screen (map-style), with a floating top bar, big UP/DOWN lane
 * buttons, and draggable bottom sheets for the briefing + run results.
 * Swipe up/down or use the buttons to change lanes; tap to start.
 */
export function FixTheCityArcade({
  engine = fixTheCityRun,
  dims = FIX_THE_CITY_RUN_DIMENSIONS,
}: {
  engine?: GameEngine<FixTheCityRunState>;
  dims?: { width: number; height: number };
} = {}) {
  const W = dims.width;
  const H = dims.height;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(engine.init());
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const init = engine.init();
  const [hud, setHud] = useState<Hud>({
    score: 0,
    phase: "attract",
    fixed: 0,
    hits: 0,
    quota: init.quota,
  });
  const [infoOpen, setInfoOpen] = useState(true);

  const send = (intent: string) => {
    stateRef.current = engine.handleInput(stateRef.current, intent);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const loop = (now: number) => {
      const last = lastRef.current || now;
      const delta = Math.min(now - last, 50);
      lastRef.current = now;
      const next = engine.update(stateRef.current, delta);
      stateRef.current = next;
      engine.render(ctx, next);
      setHud((p) =>
        p.score === next.score &&
        p.phase === next.phase &&
        p.fixed === next.fixed &&
        p.hits === next.hits
          ? p
          : { score: next.score, phase: next.phase, fixed: next.fixed, hits: next.hits, quota: next.quota },
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine]);

  useEffect(() => {
    const map: Record<string, string> = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowRight: "boost",
      KeyD: "boost",
      ShiftLeft: "boost",
      ShiftRight: "boost",
      Space: "start",
      Enter: "start",
    };
    const onKey = (e: KeyboardEvent) => {
      const intent = map[e.code];
      if (!intent) return;
      e.preventDefault();
      if (e.repeat) return;
      if (intent === "start") setInfoOpen(false);
      send(intent);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (map[e.code] === "boost") send("boostoff");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const playing = hud.phase === "playing";
  const finished = hud.phase === "won" || hud.phase === "gameover";

  const startGame = () => {
    setInfoOpen(false);
    send("start");
  };
  const resetToAttract = () => {
    send("reset");
    setInfoOpen(true);
  };

  // Swipe up/down to change lanes; tap to start.
  const onBoardDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onBoardUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const THRESH = 22;
    if (Math.abs(dx) < THRESH && Math.abs(dy) < THRESH) {
      if (!playing) startGame();
      return;
    }
    if (Math.abs(dy) > Math.abs(dx)) send(dy > 0 ? "down" : "up");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-[60px] z-40 flex flex-col overflow-hidden bg-mamdani-ink lg:hidden">
      {/* Floating top bar */}
      <div className="flex items-center justify-between px-3 py-2 font-pixel text-[10px] uppercase">
        <Link href="/arcade" className="text-mamdani-fog hover:text-mamdani-cyan">
          ‹ Arcade
        </Link>
        <span className="text-mamdani-ember">Mayor Run</span>
        {playing ? (
          <span className="text-mamdani-mint">🛠 {hud.fixed}/{hud.quota}</span>
        ) : (
          <button onClick={() => setInfoOpen(true)} className="text-mamdani-cyan hover:text-mamdani-mint">
            ⓘ Help
          </button>
        )}
      </div>

      {/* Board — swipe up/down or tap to start. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={(e) => {
            e.preventDefault();
            onBoardDown(e);
          }}
          onPointerUp={onBoardUp}
          className="max-h-full max-w-full touch-none rounded-sm"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>

      {/* Lane + dash controls */}
      <div className="px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex max-w-md gap-3">
          <LaneBtn label="▲" sub="Lane Up" onPress={() => send("up")} />
          <LaneBtn label="▼" sub="Lane Down" onPress={() => send("down")} />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              send("boost");
            }}
            onPointerUp={() => send("boostoff")}
            onPointerLeave={() => send("boostoff")}
            onPointerCancel={() => send("boostoff")}
            aria-label="Dash forward"
            className="flex h-16 flex-[1.3] touch-none flex-col items-center justify-center rounded-md border-2 border-black bg-mamdani-ember font-pixel text-lg text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
          >
            ⏩
            <span className="mt-0.5 text-[8px] uppercase">Dash · hold</span>
          </button>
        </div>
      </div>

      {/* Briefing sheet (attract). */}
      {infoOpen && !finished && (
        <BottomSheet variant="arcade" onClose={() => setInfoOpen(false)}>
          <InfoContent onStart={startGame} />
        </BottomSheet>
      )}

      {/* Results sheet. */}
      {finished && (
        <BottomSheet variant="arcade" key={hud.phase} peek={0.62} onClose={resetToAttract}>
          <ResultContent hud={hud} onAgain={startGame} />
        </BottomSheet>
      )}
    </div>
  );
}

function LaneBtn({ label, sub, onPress }: { label: string; sub: string; onPress: () => void }) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      aria-label={sub}
      className="flex h-16 flex-1 touch-none flex-col items-center justify-center rounded-md border-2 border-black bg-mamdani-steel font-pixel text-xl text-mamdani-gold shadow-pixel active:translate-y-[3px] active:shadow-none"
    >
      {label}
      <span className="mt-0.5 text-[8px] uppercase text-mamdani-fog">{sub}</span>
    </button>
  );
}

function InfoContent({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-3 px-4 py-3">
      <div>
        <p className="font-pixel text-[8px] uppercase text-mamdani-cyan">
          ⚠ Wireframe prototype — art incoming
        </p>
        <h2 className="pixel-heading text-base text-mamdani-ember">Fix the City</h2>
      </div>
      <button
        onClick={onStart}
        className="h-14 w-full rounded-md border-2 border-black bg-mamdani-mint font-pixel text-sm uppercase text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
      >
        🏃 Start the Shift
      </button>
      <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
        <li>🏃 You&apos;re the Mayor — you jog down the street on your own.</li>
        <li>⬆️⬇️ Swipe up/down (or the buttons) to change lanes.</li>
        <li>🛠️ Line up on a pothole and it patches — a car is racing it from behind.</li>
        <li>⏩ Hold DASH to sprint ahead and buy space — but you skip potholes while sprinting.</li>
        <li>🚗 Beat the car and the lane flows; lose the race and it jams (📈 gridlock).</li>
        <li>🏁 Finish the shift&apos;s patches before GRIDLOCK maxes out.</li>
      </ul>
      <div className="space-y-1 border-t border-mamdani-steel/40 pt-3 font-terminal text-base text-mamdani-fog/80">
        <p className="font-pixel text-[8px] uppercase text-mamdani-fog">Hazard key</p>
        <p>🕳️ pothole · 🚧 construction · 🪨 debris · 🚒 hydrant · 🚦 signal</p>
      </div>
    </div>
  );
}

function ResultContent({ hud, onAgain }: { hud: Hud; onAgain: () => void }) {
  const won = hud.phase === "won";
  return (
    <div className="space-y-4 px-4 py-3">
      <div>
        <p className="font-pixel text-[8px] uppercase text-mamdani-fog">
          {won ? "Shift complete" : "The city seized up"}
        </p>
        <h2 className={`pixel-heading text-lg ${won ? "text-mamdani-mint" : "text-mamdani-red"}`}>
          {won ? "City Moving!" : "Gridlock"}
        </h2>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Patched" value={`${hud.fixed}/${hud.quota}`} />
        <Stat label="Jams" value={`${hud.hits}`} />
        <Stat label="Score" value={`${hud.score}`} />
      </dl>
      <button
        onClick={onAgain}
        className="h-14 w-full rounded-md border-2 border-black bg-mamdani-mint font-pixel text-sm uppercase text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
      >
        ↻ Run It Back
      </button>
      <Link
        href="/arcade"
        className="block text-center font-pixel text-[9px] uppercase text-mamdani-fog hover:text-mamdani-cyan"
      >
        ‹ Back to The Arcade
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-mamdani-steel bg-mamdani-ink/60 py-2">
      <div className="font-pixel text-sm text-mamdani-gold">{value}</div>
      <div className="font-pixel text-[7px] uppercase text-mamdani-fog">{label}</div>
    </div>
  );
}
