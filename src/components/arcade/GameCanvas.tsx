"use client";

import { useEffect, useRef, useState } from "react";
import type { BaseGameState, GameEngine } from "@/lib/types";

type KeyMap = Record<string, string>;
type ControlScheme = "flap" | "dpad" | "shooter" | "tap" | "updown";

/**
 * Generic arcade canvas host. Owns the requestAnimationFrame loop, the
 * keyboard bridge, AND mobile-first on-screen touch controls. The game's
 * logic lives entirely in its GameEngine; swap engines + control scheme to
 * mount a different cabinet.
 */
export function GameCanvas<TState extends BaseGameState>({
  engine,
  width,
  height,
  keyMap,
  controls,
  accentColor = "#21D4FD",
}: {
  engine: GameEngine<TState>;
  width: number;
  height: number;
  keyMap: KeyMap;
  /** Which touch-control layout to render under the canvas. */
  controls: ControlScheme;
  accentColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TState>(engine.init());
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const [hud, setHud] = useState({ score: 0, phase: "attract", timeLeft: null as number | null });

  // The animation loop: update → render → repeat.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const loop = (now: number) => {
      const last = lastRef.current || now;
      const delta = Math.min(now - last, 50);
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

  // Keyboard bridge → engine intents (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const intent = keyMap[e.code];
      if (!intent) return;
      e.preventDefault();
      if (e.repeat) return; // hold is modelled by the engine, not key-repeat
      stateRef.current = engine.handleInput(stateRef.current, intent);
    };
    // Releasing a held ▲/▼ direction stops the glide.
    const onKeyUp = (e: KeyboardEvent) => {
      const intent = keyMap[e.code];
      if (intent === "up" || intent === "down") {
        stateRef.current = engine.handleInput(stateRef.current, "stopy");
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [engine, keyMap]);

  const send = (intent: string) => {
    stateRef.current = engine.handleInput(stateRef.current, intent);
  };

  return (
    <div className="no-touch-callout w-full max-w-md space-y-3">
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

      {/* Canvas — tap to flap on the diving game. */}
      <div className="panel inline-block w-full p-1">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={
            controls === "flap" || controls === "tap" || controls === "updown"
              ? (e) => {
                  e.preventDefault();
                  if (controls === "flap") {
                    send("flap");
                    return;
                  }
                  if (controls === "updown") {
                    // Tap the pool to kick off the dive.
                    send("start");
                    return;
                  }
                  const el = canvasRef.current;
                  if (!el) return;
                  const r = el.getBoundingClientRect();
                  const x = (e.clientX - r.left) / r.width;
                  const y = (e.clientY - r.top) / r.height;
                  send(`tap:${x.toFixed(4)},${y.toFixed(4)}`);
                }
              : undefined
          }
          className={`block w-full touch-none rounded-sm ${controls === "tap" ? "cursor-pointer" : ""}`}
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </div>

      {/* Touch controls */}
      {controls === "flap" ? (
        <FlapControls onFlap={() => send("flap")} />
      ) : controls === "shooter" ? (
        <ShooterControls onMove={send} />
      ) : controls === "updown" ? (
        <UpDownControls
          onMove={send}
          onStart={() => send("start")}
          playing={hud.phase === "playing"}
        />
      ) : controls === "tap" ? (
        <p className="text-center font-pixel text-[9px] uppercase text-mamdani-fog">
          ☝ Tap the potholes
        </p>
      ) : (
        <DPad onMove={send} />
      )}

      {/* Coin slot */}
      <div className="flex gap-2">
        <ArcadeBtn label="▶ Insert Coin" onPress={() => send("start")} primary />
        <ArcadeBtn label="↺ Reset" onPress={() => send("reset")} />
      </div>
    </div>
  );
}

/** Two big UP / DOWN paddles for the swim-and-dodge cabinet. Before the run
 *  starts it collapses to a single KICK OFF button. */
function UpDownControls({
  onMove,
  onStart,
  playing,
}: {
  onMove: (intent: string) => void;
  onStart: () => void;
  playing: boolean;
}) {
  if (!playing) {
    return (
      <button
        {...pressHandlers(onStart)}
        aria-label="Kick off"
        className="h-16 w-full touch-none rounded-md border-2 border-black bg-mamdani-mint font-pixel text-sm uppercase text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
      >
        🤿 Kick Off
      </button>
    );
  }
  const pad =
    "flex h-16 flex-1 touch-none items-center justify-center rounded-md border-2 border-black bg-mamdani-steel font-pixel text-xl text-mamdani-gold shadow-pixel active:translate-y-[3px] active:shadow-none";
  // Hold to glide, release (or slide off) to stop.
  const hold = (dir: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onMove(dir);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onMove("stopy");
    },
    onPointerLeave: () => onMove("stopy"),
    onPointerCancel: () => onMove("stopy"),
  });
  return (
    <div className="flex gap-2">
      <button {...hold("up")} aria-label="Swim up" className={pad}>
        ▲
      </button>
      <button {...hold("down")} aria-label="Swim down" className={pad}>
        ▼
      </button>
    </div>
  );
}

/** Fires on pointer-down for zero-latency response; suppresses gestures. */
function pressHandlers(fn: () => void) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      fn();
    },
  };
}

function FlapControls({ onFlap }: { onFlap: () => void }) {
  return (
    <button
      {...pressHandlers(onFlap)}
      aria-label="Stroke"
      className="h-16 w-full touch-none rounded-md border-2 border-black bg-mamdani-mint font-pixel text-sm uppercase text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
    >
      🏊 STROKE
    </button>
  );
}

function DPad({ onMove }: { onMove: (intent: string) => void }) {
  const cell =
    "flex h-14 w-14 touch-none items-center justify-center rounded-md border-2 border-black bg-mamdani-steel font-pixel text-base text-mamdani-gold shadow-pixel active:translate-y-[3px] active:shadow-none";
  return (
    <div className="mx-auto grid w-fit grid-cols-3 grid-rows-3 gap-2">
      <span />
      <button {...pressHandlers(() => onMove("up"))} aria-label="Up" className={cell}>
        ▲
      </button>
      <span />
      <button {...pressHandlers(() => onMove("left"))} aria-label="Left" className={cell}>
        ◀
      </button>
      <span />
      <button {...pressHandlers(() => onMove("right"))} aria-label="Right" className={cell}>
        ▶
      </button>
      <span />
      <button {...pressHandlers(() => onMove("down"))} aria-label="Down" className={cell}>
        ▼
      </button>
      <span />
    </div>
  );
}

function ShooterControls({ onMove }: { onMove: (intent: string) => void }) {
  const move =
    "flex h-14 w-14 touch-none items-center justify-center rounded-md border-2 border-black bg-mamdani-steel font-pixel text-base text-mamdani-gold shadow-pixel active:translate-y-[3px] active:shadow-none";
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-2">
        <button {...pressHandlers(() => onMove("left"))} aria-label="Left" className={move}>
          ◀
        </button>
        <button {...pressHandlers(() => onMove("right"))} aria-label="Right" className={move}>
          ▶
        </button>
      </div>
      <button
        {...pressHandlers(() => onMove("fire"))}
        aria-label="Fire"
        className="h-14 flex-1 touch-none rounded-md border-2 border-black bg-mamdani-mint font-pixel text-sm uppercase text-mamdani-ink shadow-pixel active:translate-y-[3px] active:shadow-none"
      >
        🔫 FIRE
      </button>
    </div>
  );
}

function ArcadeBtn({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <button
      {...pressHandlers(onPress)}
      className={`min-h-[44px] flex-1 touch-none rounded-sm border-2 px-3 py-2 font-pixel text-[10px] uppercase active:translate-y-[2px] ${
        primary
          ? "border-black bg-mamdani-gold text-mamdani-ink shadow-pixel active:shadow-none"
          : "border-mamdani-steel text-mamdani-fog"
      }`}
    >
      {label}
    </button>
  );
}
