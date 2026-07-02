"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fixTheCity, FIX_THE_CITY_DIMENSIONS } from "@/games/fixTheCity";
import { BottomSheet } from "@/components/ui/BottomSheet";

const { width: W, height: H } = FIX_THE_CITY_DIMENSIONS;

type Hud = {
  score: number;
  phase: string;
  timeLeft: number | null;
  fixed: number;
  hits: number;
  quota: number;
};

/**
 * Fix the City — full-screen mobile cabinet (<lg). The board takes over the
 * whole screen (Google-Maps style, like the tactical map), with floating HUD
 * + D-pad and draggable bottom sheets for the briefing and the run results.
 * Swipe the board or use the D-pad to move; tap it to start.
 */
export function FixTheCityArcade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(fixTheCity.init());
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const init = fixTheCity.init();
  const [hud, setHud] = useState<Hud>({
    score: 0,
    phase: "attract",
    timeLeft: init.timeLeft,
    fixed: 0,
    hits: 0,
    quota: init.quota,
  });
  const [infoOpen, setInfoOpen] = useState(true);

  const send = (intent: string) => {
    stateRef.current = fixTheCity.handleInput(stateRef.current, intent);
  };

  // Render loop.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const loop = (now: number) => {
      const last = lastRef.current || now;
      const delta = Math.min(now - last, 50);
      lastRef.current = now;
      const next = fixTheCity.update(stateRef.current, delta);
      stateRef.current = next;
      fixTheCity.render(ctx, next);
      setHud((p) =>
        p.score === next.score &&
        p.phase === next.phase &&
        p.timeLeft === next.timeLeft &&
        p.fixed === next.fixed &&
        p.hits === next.hits
          ? p
          : {
              score: next.score,
              phase: next.phase,
              timeLeft: next.timeLeft,
              fixed: next.fixed,
              hits: next.hits,
              quota: next.quota,
            },
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Keyboard (hybrid devices).
  useEffect(() => {
    const map: Record<string, string> = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  // Swipe to move; tap (no drag) to start.
  const onBoardDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onBoardUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const THRESH = 24;
    if (Math.abs(dx) < THRESH && Math.abs(dy) < THRESH) {
      if (!playing) startGame(); // a tap
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) send(dx > 0 ? "right" : "left");
    else send(dy > 0 ? "down" : "up");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-[60px] z-40 flex flex-col overflow-hidden bg-mamdani-ink lg:hidden">
      {/* Floating HUD */}
      <div className="flex items-center justify-between px-3 py-2 font-pixel text-[10px] uppercase">
        <Link href="/arcade" className="text-mamdani-fog hover:text-mamdani-cyan">
          ‹ Arcade
        </Link>
        <span className={hud.timeLeft !== null && hud.timeLeft <= 10 ? "text-mamdani-red" : "text-mamdani-gold"}>
          ⏱ {Math.max(0, Math.ceil(hud.timeLeft ?? 0))}
        </span>
        {playing ? (
          <span className="text-mamdani-mint">🛠 {hud.fixed}/{hud.quota}</span>
        ) : (
          <button
            onClick={() => setInfoOpen(true)}
            className="text-mamdani-cyan hover:text-mamdani-mint"
          >
            ⓘ Help
          </button>
        )}
      </div>

      {/* Board — fills the space; swipe or tap. */}
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

      {/* D-pad */}
      <div className="px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <DPad onMove={send} />
      </div>

      {/* Briefing sheet (attract). */}
      {infoOpen && !finished && (
        <BottomSheet variant="arcade" onClose={() => setInfoOpen(false)}>
          <InfoContent onStart={startGame} />
        </BottomSheet>
      )}

      {/* Results sheet (win / game over). */}
      {finished && (
        <BottomSheet variant="arcade" key={hud.phase} peek={0.62} onClose={resetToAttract}>
          <ResultContent hud={hud} onAgain={startGame} />
        </BottomSheet>
      )}
    </div>
  );
}

function DPad({ onMove }: { onMove: (intent: string) => void }) {
  const cell =
    "flex h-16 w-16 touch-none items-center justify-center rounded-md border-2 border-black bg-mamdani-steel font-pixel text-lg text-mamdani-gold shadow-pixel active:translate-y-[3px] active:shadow-none";
  const press = (dir: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onMove(dir);
    },
  });
  return (
    <div className="mx-auto grid w-fit grid-cols-3 grid-rows-3 gap-2">
      <span />
      <button {...press("up")} aria-label="Up" className={cell}>
        ▲
      </button>
      <span />
      <button {...press("left")} aria-label="Left" className={cell}>
        ◀
      </button>
      <span />
      <button {...press("right")} aria-label="Right" className={cell}>
        ▶
      </button>
      <span />
      <button {...press("down")} aria-label="Down" className={cell}>
        ▼
      </button>
      <span />
    </div>
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
        🛠 Start Repairs
      </button>
      <ul className="space-y-2 font-terminal text-lg text-mamdani-fog">
        <li>⬆️ Swipe the board or use the D-pad to hop between lanes.</li>
        <li>🛠️ Stop on a hazard to patch it. New jobs keep popping up.</li>
        <li>🚗 A car clips you → bumped back a lane, minus a couple seconds.</li>
        <li>🏁 Clear the whole repair quota before the clock dies to win.</li>
      </ul>
      <div className="space-y-1 border-t border-mamdani-steel/40 pt-3 font-terminal text-base text-mamdani-fog/80">
        <p className="font-pixel text-[8px] uppercase text-mamdani-fog">Hazard key</p>
        <p>🕳️ pothole · 🚧 construction · 🪨 debris · 🚒 hydrant · 🚦 signal</p>
        <p className="text-mamdani-cyan/70">→ cyan cars run right · ← amber cars run left.</p>
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
          {won ? "Route cleared" : "Gridlock wins"}
        </p>
        <h2 className={`pixel-heading text-lg ${won ? "text-mamdani-mint" : "text-mamdani-red"}`}>
          {won ? "City Fixed!" : "Out of Time"}
        </h2>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Repairs" value={`${hud.fixed}/${hud.quota}`} />
        <Stat label="Hits" value={`${hud.hits}`} />
        <Stat label="Score" value={`${hud.score}`} />
      </dl>
      <button
        onClick={onAgain}
        className="h-14 w-full rounded-md border-2 border-black bg-mamdani-mint font-pixel text-sm uppercase text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
      >
        ↻ Play Again
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
