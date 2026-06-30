import type { BaseGameState, GameEngine, GamePhase } from "@/lib/types";

/**
 * "TODDLER TYCOON" — a catcher.
 * Toddlers tumble out of the sky looking for a free childcare slot. Slide the
 * Toddler Oasis (◀ ▶) to catch them. Survive the clock; drop too many and the
 * program is "under review."
 */

const W = 440;
const H = 320;
const BASKET_W = 80;
const BASKET_H = 20;
const BASKET_Y = H - 28;
const STEP = 28;
const START_TIME = 30;
const MAX_MISS = 6;

interface Toddler {
  x: number;
  y: number;
  vy: number;
  glyph: string;
}

export interface ToddlerTycoonState extends BaseGameState {
  basketX: number;
  toddlers: Toddler[];
  caught: number;
  missed: number;
}

const KIDS = ["🧒", "👶", "🧑‍🍼"];

export const toddlerTycoon: GameEngine<ToddlerTycoonState> = {
  init(): ToddlerTycoonState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: START_TIME,
      frame: 0,
      basketX: W / 2,
      toddlers: [],
      caught: 0,
      missed: 0,
    };
  },

  handleInput(state, intent) {
    if (intent === "start") {
      if (state.phase === "playing") return state;
      return { ...toddlerTycoon.init(), phase: "playing" };
    }
    if (intent === "reset") return toddlerTycoon.init();
    if (state.phase !== "playing") return state;
    if (intent === "left")
      return { ...state, basketX: Math.max(BASKET_W / 2, state.basketX - STEP) };
    if (intent === "right")
      return {
        ...state,
        basketX: Math.min(W - BASKET_W / 2, state.basketX + STEP),
      };
    return state;
  },

  update(state, deltaMs) {
    if (state.phase !== "playing" || state.timeLeft === null) return state;
    const frame = state.frame + 1;
    const timeLeft = state.timeLeft - deltaMs / 1000;
    const elapsed = START_TIME - timeLeft;

    let caught = state.caught;
    let missed = state.missed;
    let score = state.score;

    // Fall + resolve catches/misses.
    const toddlers: Toddler[] = [];
    for (const t of state.toddlers) {
      const y = t.y + t.vy;
      if (
        y >= BASKET_Y - 6 &&
        y <= BASKET_Y + BASKET_H &&
        Math.abs(t.x - state.basketX) <= BASKET_W / 2
      ) {
        caught += 1;
        score += 20;
      } else if (y > H) {
        missed += 1;
      } else {
        toddlers.push({ ...t, y });
      }
    }

    // Spawn, a touch faster over time.
    const interval = Math.max(28, 60 - Math.floor(elapsed * 1.0));
    if (frame % interval === 0) {
      toddlers.push({
        x: 24 + Math.random() * (W - 48),
        y: -18,
        vy: 1.7 + Math.random() * 1.3 + elapsed * 0.02,
        glyph: KIDS[Math.floor(Math.random() * KIDS.length)],
      });
    }

    const phase: GamePhase =
      missed >= MAX_MISS ? "gameover" : timeLeft <= 0 ? "won" : "playing";

    return { ...state, frame, timeLeft: Math.max(0, timeLeft), toddlers, caught, missed, score, phase };
  },

  render(ctx, state) {
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, W, H);

    // Catch line.
    ctx.fillStyle = "rgba(255,210,63,0.18)";
    ctx.fillRect(0, BASKET_Y + BASKET_H, W, 2);

    // Toddlers.
    ctx.font = "22px monospace";
    ctx.textAlign = "center";
    for (const t of state.toddlers) ctx.fillText(t.glyph, t.x, t.y);

    // Oasis basket.
    ctx.fillStyle = "#FFD23F";
    ctx.fillRect(state.basketX - BASKET_W / 2, BASKET_Y, BASKET_W, BASKET_H);
    ctx.fillStyle = "#0B0E1A";
    ctx.font = "16px monospace";
    ctx.fillText("🧺", state.basketX, BASKET_Y + BASKET_H - 4);

    // HUD.
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFD23F";
    ctx.font = "10px monospace";
    ctx.fillText(`CAUGHT ${state.caught}`, 10, 16);
    ctx.fillStyle = "#FF2E4D";
    ctx.fillText(`MISSED ${state.missed}/${MAX_MISS}`, 10, 30);

    if (state.phase === "attract") banner(ctx, "◀ ▶ — CATCH EVERY TODDLER");
    else if (state.phase === "won") banner(ctx, "UNIVERSAL CARE — SECURED!");
    else if (state.phase === "gameover") banner(ctx, "PROGRAM UNDER REVIEW — RESET");
  },
};

function banner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(11,14,26,0.78)";
  ctx.fillRect(0, H / 2 - 16, W, 32);
  ctx.fillStyle = "#3DDC97";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2 + 3);
  ctx.textAlign = "left";
}

export const TODDLER_TYCOON_DIMENSIONS = { width: W, height: H };
