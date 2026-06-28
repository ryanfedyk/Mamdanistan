import type { FormalPlungeState, GameEngine, PlungeObstacle } from "@/lib/types";

/**
 * "FORMAL PLUNGE" — a flappy-blazer physics diver.
 * The diver falls under gravity; each input flap nudges them upward. Thread
 * the bureaucratic gauntlet to splash down and unlock another public pool.
 *
 * This is a deliberately small, self-contained loop — a stub you can flesh
 * out into a full game. State is plain data; rendering reads, never mutates.
 */

const WIDTH = 480;
const HEIGHT = 320;
const GRAVITY = 0.45; // px / frame²
const FLAP = -7.2; // upward velocity injected per flap
const SCROLL = 2.6; // world scroll speed (px / frame)
const DIVER_X = 90;

const RED_TAPE = [
  "Permit B-7",
  "Zoning Hearing",
  "Comm. Board IV",
  "Env. Review",
  "Landmark Appeal",
];

function spawnObstacle(seed: number): PlungeObstacle {
  // Gap position wobbles deterministically with the frame seed.
  const gapY = 90 + ((seed * 53) % 140);
  return {
    x: WIDTH + 40,
    y: gapY,
    width: 46,
    height: 30,
    label: RED_TAPE[seed % RED_TAPE.length],
  };
}

export const formalPlunge: GameEngine<FormalPlungeState> = {
  init(): FormalPlungeState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: null, // endurance run, no clock
      frame: 0,
      diver: { x: DIVER_X, y: HEIGHT / 2, vy: 0 },
      obstacles: [spawnObstacle(7), spawnObstacle(21)],
      poolsUnlocked: 0,
    };
  },

  handleInput(state, intent) {
    if (intent === "start" && state.phase !== "playing") {
      return { ...formalPlunge.init(), phase: "playing" };
    }
    if (intent === "flap") {
      if (state.phase === "attract") {
        return {
          ...formalPlunge.init(),
          phase: "playing",
          diver: { x: DIVER_X, y: HEIGHT / 2, vy: FLAP },
        };
      }
      if (state.phase === "playing") {
        return { ...state, diver: { ...state.diver, vy: FLAP } };
      }
    }
    if (intent === "reset") return formalPlunge.init();
    return state;
  },

  update(state) {
    if (state.phase !== "playing") return state;

    const frame = state.frame + 1;
    const vy = state.diver.vy + GRAVITY;
    const y = state.diver.y + vy;

    // Out of bounds (ceiling or floor) ends the dive.
    if (y < 0 || y > HEIGHT) {
      return { ...state, frame, phase: "gameover" };
    }

    // Scroll the gauntlet, recycle off-screen obstacles, score the passes.
    let score = state.score;
    let poolsUnlocked = state.poolsUnlocked;
    const obstacles = state.obstacles.map((o) => ({ ...o, x: o.x - SCROLL }));

    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (o.x + o.width < 0) {
        Object.assign(o, spawnObstacle(frame + i * 13));
        score += 10;
        if (score % 50 === 0) poolsUnlocked += 1;
      }
    }

    return { ...state, frame, score, poolsUnlocked, obstacles, diver: { ...state.diver, vy, y } };
  },

  render(ctx, state) {
    // Pool-blue gradient backdrop.
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#0B0E1A");
    sky.addColorStop(1, "#0a2a3a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Waterline near the bottom.
    ctx.fillStyle = "rgba(33,212,253,0.18)";
    ctx.fillRect(0, HEIGHT - 36, WIDTH, 36);

    // Bureaucratic obstacles (red tape).
    ctx.font = "9px monospace";
    for (const o of state.obstacles) {
      ctx.fillStyle = "#FF2E4D";
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.fillStyle = "#0B0E1A";
      ctx.fillText(o.label, o.x + 3, o.y + o.height / 2 + 3);
    }

    // The suited diver (a tiny pixel blazer).
    const d = state.diver;
    ctx.fillStyle = "#161B2E";
    ctx.fillRect(d.x - 8, d.y - 10, 16, 20); // suit
    ctx.fillStyle = "#FFD23F";
    ctx.fillRect(d.x - 2, d.y - 8, 4, 12); // tie
    ctx.fillStyle = "#FF6B35";
    ctx.fillRect(d.x - 8, d.y - 18, 16, 8); // head

    // HUD.
    ctx.fillStyle = "#FFD23F";
    ctx.font = "10px monospace";
    ctx.fillText(`SCORE ${state.score}`, 10, 18);
    ctx.fillText(`POOLS ${state.poolsUnlocked}`, 10, 32);

    if (state.phase === "attract") {
      banner(ctx, "PRESS SPACE TO PLUNGE");
    } else if (state.phase === "gameover") {
      banner(ctx, "BELLY FLOP — SPACE TO RETRY");
    }
  },
};

function banner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(11,14,26,0.7)";
  ctx.fillRect(0, HEIGHT / 2 - 18, WIDTH, 36);
  ctx.fillStyle = "#21D4FD";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 4);
  ctx.textAlign = "left";
}

export const FORMAL_PLUNGE_DIMENSIONS = { width: WIDTH, height: HEIGHT };
