import type { CityHazard, FixTheCityState, GameEngine } from "@/lib/types";

/**
 * "FIX THE CITY" — a grid-clearing infrastructure sprint.
 * Roll across the grid and stop on each hazard to clear it before the
 * bureaucratic clock expires. Clear them all to win the round.
 *
 * Small, self-contained loop — a stub ready to grow (power-ups, combos,
 * angry-driver hazards, etc.). State is plain data; render reads it.
 */

const COLS = 8;
const ROWS = 6;
const CELL = 48;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;
const START_TIME = 30; // seconds on the clock

const HAZARD_TYPES: CityHazard["type"][] = ["pothole", "blocked-lane", "debris"];

function seedHazards(): CityHazard[] {
  // Deterministic scatter so the stub is reproducible across reloads.
  const spots: Array<[number, number]> = [
    [1, 1],
    [3, 0],
    [5, 2],
    [6, 4],
    [2, 4],
    [4, 5],
    [7, 1],
    [0, 3],
  ];
  return spots.map(([col, row], i) => ({
    col,
    row,
    type: HAZARD_TYPES[i % HAZARD_TYPES.length],
    cleared: false,
  }));
}

const HAZARD_GLYPH: Record<CityHazard["type"], string> = {
  pothole: "🕳️",
  "blocked-lane": "🚧",
  debris: "🪨",
};

export const fixTheCity: GameEngine<FixTheCityState> = {
  init(): FixTheCityState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: START_TIME,
      frame: 0,
      player: { col: 0, row: 0 },
      grid: { cols: COLS, rows: ROWS },
      hazards: seedHazards(),
      fixed: 0,
    };
  },

  handleInput(state, intent) {
    if (intent === "start") {
      if (state.phase === "playing") return state;
      return { ...fixTheCity.init(), phase: "playing" };
    }
    if (intent === "reset") return fixTheCity.init();
    if (state.phase !== "playing") return state;

    let { col, row } = state.player;
    if (intent === "up") row = Math.max(0, row - 1);
    if (intent === "down") row = Math.min(ROWS - 1, row + 1);
    if (intent === "left") col = Math.max(0, col - 1);
    if (intent === "right") col = Math.min(COLS - 1, col + 1);

    // Clear a hazard if the player lands on it.
    let score = state.score;
    let fixed = state.fixed;
    const hazards = state.hazards.map((h) => {
      if (!h.cleared && h.col === col && h.row === row) {
        score += 25;
        fixed += 1;
        return { ...h, cleared: true };
      }
      return h;
    });

    const allClear = hazards.every((h) => h.cleared);
    return {
      ...state,
      player: { col, row },
      hazards,
      score,
      fixed,
      phase: allClear ? "won" : state.phase,
    };
  },

  update(state, deltaMs) {
    if (state.phase !== "playing" || state.timeLeft === null) return state;
    const timeLeft = state.timeLeft - deltaMs / 1000;
    if (timeLeft <= 0) {
      return { ...state, timeLeft: 0, frame: state.frame + 1, phase: "gameover" };
    }
    return { ...state, timeLeft, frame: state.frame + 1 };
  },

  render(ctx, state) {
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Tactical grid lines.
    ctx.strokeStyle = "rgba(33,212,253,0.18)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, HEIGHT);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(WIDTH, r * CELL);
      ctx.stroke();
    }

    // Hazards.
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    for (const h of state.hazards) {
      const cx = h.col * CELL + CELL / 2;
      const cy = h.row * CELL + CELL / 2;
      if (h.cleared) {
        ctx.fillStyle = "rgba(61,220,151,0.22)";
        ctx.fillRect(h.col * CELL + 2, h.row * CELL + 2, CELL - 4, CELL - 4);
        ctx.fillStyle = "#3DDC97";
        ctx.fillText("✓", cx, cy + 8);
      } else {
        ctx.fillText(HAZARD_GLYPH[h.type], cx, cy + 8);
      }
    }

    // Player (a plucky orange repair unit).
    const px = state.player.col * CELL + CELL / 2;
    const py = state.player.row * CELL + CELL / 2;
    ctx.fillStyle = "#FF6B35";
    ctx.fillRect(px - 12, py - 12, 24, 24);
    ctx.fillStyle = "#FFD23F";
    ctx.fillRect(px - 6, py - 6, 12, 12);
    ctx.textAlign = "left";

    if (state.phase === "attract") banner(ctx, "INSERT COIN — BEAT THE CLOCK");
    else if (state.phase === "won") banner(ctx, "CITY FIXED — GRIDLOCK DEFEATED");
    else if (state.phase === "gameover") banner(ctx, "TIME'S UP — TAP RESET");
  },
};

function banner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(11,14,26,0.78)";
  ctx.fillRect(0, HEIGHT / 2 - 18, WIDTH, 36);
  ctx.fillStyle = "#FFD23F";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 4);
  ctx.textAlign = "left";
}

export const FIX_THE_CITY_DIMENSIONS = { width: WIDTH, height: HEIGHT };
