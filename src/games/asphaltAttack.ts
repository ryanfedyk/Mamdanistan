import type { BaseGameState, GameEngine, GamePhase } from "@/lib/types";

/**
 * "ASPHALT ATTACK" — a whack-a-pothole.
 * Potholes erupt across a grid of streets. Tap them to patch before they set.
 * Survive the clock; let too many cure into permanent craters and the road
 * loses. Controlled with the "tap" scheme (canvas taps → intent "tap:x,y").
 */

const W = 440;
const H = 320;
const COLS = 4;
const ROWS = 3;
const CW = W / COLS;
const CH = H / ROWS;
const START_TIME = 30;
const MAX_MISS = 12;
const MAX_ACTIVE = 4;

interface Pothole {
  col: number;
  row: number;
  age: number;
  life: number;
}

export interface AsphaltAttackState extends BaseGameState {
  potholes: Pothole[];
  patched: number;
  missed: number;
}

export const asphaltAttack: GameEngine<AsphaltAttackState> = {
  init(): AsphaltAttackState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: START_TIME,
      frame: 0,
      potholes: [],
      patched: 0,
      missed: 0,
    };
  },

  handleInput(state, intent) {
    if (intent === "start") {
      if (state.phase === "playing") return state;
      return { ...asphaltAttack.init(), phase: "playing" };
    }
    if (intent === "reset") return asphaltAttack.init();
    if (state.phase !== "playing") return state;

    if (intent.startsWith("tap:")) {
      const [nx, ny] = intent.slice(4).split(",").map(Number);
      if (Number.isNaN(nx) || Number.isNaN(ny)) return state;
      const col = Math.min(COLS - 1, Math.max(0, Math.floor(nx * COLS)));
      const row = Math.min(ROWS - 1, Math.max(0, Math.floor(ny * ROWS)));
      const idx = state.potholes.findIndex((p) => p.col === col && p.row === row);
      if (idx === -1) return state;
      const potholes = state.potholes.filter((_, i) => i !== idx);
      return { ...state, potholes, patched: state.patched + 1, score: state.score + 25 };
    }
    return state;
  },

  update(state, deltaMs) {
    if (state.phase !== "playing" || state.timeLeft === null) return state;
    const frame = state.frame + 1;
    const dt = deltaMs / 1000;
    const timeLeft = state.timeLeft - dt;
    const elapsed = START_TIME - timeLeft;

    // Age potholes; the ones that finish curing count as misses.
    let missed = state.missed;
    const potholes: Pothole[] = [];
    for (const p of state.potholes) {
      const age = p.age + dt;
      if (age >= p.life) missed += 1;
      else potholes.push({ ...p, age });
    }

    // Spawn into a free cell, a little faster over time.
    const interval = Math.max(16, 34 - Math.floor(elapsed));
    if (potholes.length < MAX_ACTIVE && frame % interval === 0) {
      const taken = new Set(potholes.map((p) => `${p.col},${p.row}`));
      const free: Array<[number, number]> = [];
      for (let c = 0; c < COLS; c++)
        for (let r = 0; r < ROWS; r++)
          if (!taken.has(`${c},${r}`)) free.push([c, r]);
      if (free.length) {
        const [col, row] = free[Math.floor(Math.random() * free.length)];
        potholes.push({ col, row, age: 0, life: 1.3 + Math.random() * 0.9 });
      }
    }

    const phase: GamePhase =
      missed >= MAX_MISS ? "gameover" : timeLeft <= 0 ? "won" : "playing";

    return { ...state, frame, timeLeft: Math.max(0, timeLeft), potholes, missed, phase };
  },

  render(ctx, state) {
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, W, H);

    // Street grid.
    ctx.strokeStyle = "rgba(33,212,253,0.16)";
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CW, 0);
      ctx.lineTo(c * CW, H);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CH);
      ctx.lineTo(W, r * CH);
      ctx.stroke();
    }

    // Potholes — darken + redden as they near curing.
    for (const p of state.potholes) {
      const cx = p.col * CW + CW / 2;
      const cy = p.row * CH + CH / 2;
      const t = p.age / p.life;
      const radius = 14 + t * 8;
      ctx.fillStyle = t > 0.66 ? "#FF2E4D" : "#1b1b1b";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FF6B35";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // HUD.
    ctx.fillStyle = "#FFD23F";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`PATCHED ${state.patched}`, 10, 16);
    ctx.fillStyle = "#FF2E4D";
    ctx.fillText(`CRATERS ${state.missed}/${MAX_MISS}`, 10, 30);

    if (state.phase === "attract") banner(ctx, "TAP THE POTHOLES TO PATCH");
    else if (state.phase === "won") banner(ctx, "ROADS PAVED — BUREAUCRACY BURIED");
    else if (state.phase === "gameover") banner(ctx, "TOO MANY CRATERS — TAP RESET");
  },
};

function banner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(11,14,26,0.80)";
  ctx.fillRect(0, H / 2 - 16, W, 32);
  ctx.fillStyle = "#FF6B35";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2 + 3);
  ctx.textAlign = "left";
}

export const ASPHALT_ATTACK_DIMENSIONS = { width: W, height: H };
