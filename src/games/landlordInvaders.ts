import type { BaseGameState, GameEngine, GamePhase } from "@/lib/types";

/**
 * "LANDLORD INVADERS" — a Space-Invaders riff.
 * Descending rows of rent-hike landlords advance on the city. Slide your
 * Rent-Freeze cannon and fire to evict them before they reach street level.
 * Clear the board to win; let one touch down and it's a game over.
 *
 * Self-contained prototype loop — plain-data state, dumb renderer.
 */

const W = 420;
const H = 360;
const PLAYER_W = 40;
const PLAYER_Y = H - 26;
const PLAYER_STEP = 20;
const BULLET_SPEED = 6;
const MAX_BULLETS = 3;

const COLS = 6;
const ROWS = 3;
const INV_W = 32;
const INV_H = 22;
const GAP_X = 20;
const GAP_Y = 18;
const MARGIN_X = 26;
const DROP = 16;

interface Invader {
  x: number;
  y: number;
  alive: boolean;
}

export interface LandlordInvadersState extends BaseGameState {
  playerX: number;
  bullets: Array<{ x: number; y: number }>;
  invaders: Invader[];
  dir: 1 | -1;
  evicted: number;
}

function buildInvaders(): Invader[] {
  const inv: Invader[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      inv.push({
        x: MARGIN_X + c * (INV_W + GAP_X),
        y: 30 + r * (INV_H + GAP_Y),
        alive: true,
      });
    }
  }
  return inv;
}

export const landlordInvaders: GameEngine<LandlordInvadersState> = {
  init(): LandlordInvadersState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: null,
      frame: 0,
      playerX: W / 2,
      bullets: [],
      invaders: buildInvaders(),
      dir: 1,
      evicted: 0,
    };
  },

  handleInput(state, intent) {
    if (intent === "start") {
      if (state.phase === "playing") return state;
      return { ...landlordInvaders.init(), phase: "playing" };
    }
    if (intent === "reset") return landlordInvaders.init();
    if (state.phase !== "playing") return state;

    if (intent === "left")
      return { ...state, playerX: Math.max(PLAYER_W / 2, state.playerX - PLAYER_STEP) };
    if (intent === "right")
      return { ...state, playerX: Math.min(W - PLAYER_W / 2, state.playerX + PLAYER_STEP) };
    if (intent === "fire") {
      if (state.bullets.length >= MAX_BULLETS) return state;
      return {
        ...state,
        bullets: [...state.bullets, { x: state.playerX, y: PLAYER_Y - 12 }],
      };
    }
    return state;
  },

  update(state) {
    if (state.phase !== "playing") return state;
    const frame = state.frame + 1;

    // Move bullets up; drop the ones that fly off-screen.
    let bullets = state.bullets
      .map((b) => ({ x: b.x, y: b.y - BULLET_SPEED }))
      .filter((b) => b.y > -8);

    // Advance the swarm. Speed ramps up as landlords are evicted.
    const aliveCount = state.invaders.filter((i) => i.alive).length || 1;
    const speed = 0.6 + (COLS * ROWS - aliveCount) * 0.12;
    let dir = state.dir;
    let invaders = state.invaders.map((i) =>
      i.alive ? { ...i, x: i.x + dir * speed } : i,
    );

    const alive = invaders.filter((i) => i.alive);
    const minX = Math.min(...alive.map((i) => i.x));
    const maxX = Math.max(...alive.map((i) => i.x + INV_W));
    if (maxX >= W - 6 || minX <= 6) {
      dir = (dir * -1) as 1 | -1;
      invaders = invaders.map((i) => (i.alive ? { ...i, y: i.y + DROP } : i));
    }

    // Bullet ↔ landlord collisions.
    let score = state.score;
    let evicted = state.evicted;
    for (const b of bullets) {
      for (const inv of invaders) {
        if (
          inv.alive &&
          b.x > inv.x &&
          b.x < inv.x + INV_W &&
          b.y > inv.y &&
          b.y < inv.y + INV_H
        ) {
          inv.alive = false;
          b.y = -999; // mark bullet spent
          score += 50;
          evicted += 1;
          break;
        }
      }
    }
    bullets = bullets.filter((b) => b.y > -8);

    // Win / lose checks.
    let phase: GamePhase = state.phase;
    if (invaders.every((i) => !i.alive)) phase = "won";
    else if (invaders.some((i) => i.alive && i.y + INV_H >= PLAYER_Y - 6))
      phase = "gameover";

    return { ...state, frame, bullets, invaders, dir, score, evicted, phase };
  },

  render(ctx, state) {
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, W, H);

    // Street line.
    ctx.fillStyle = "rgba(33,212,253,0.18)";
    ctx.fillRect(0, PLAYER_Y + 6, W, 2);

    // Landlords.
    ctx.font = "16px monospace";
    ctx.textAlign = "center";
    for (const inv of state.invaders) {
      if (!inv.alive) continue;
      ctx.fillStyle = "#FF2E4D";
      ctx.fillRect(inv.x, inv.y, INV_W, INV_H);
      ctx.fillText("💼", inv.x + INV_W / 2, inv.y + INV_H - 5);
    }

    // Bullets (eviction notices).
    ctx.fillStyle = "#FFD23F";
    for (const b of state.bullets) ctx.fillRect(b.x - 2, b.y, 4, 10);

    // Player cannon.
    ctx.fillStyle = "#3DDC97";
    ctx.fillRect(state.playerX - PLAYER_W / 2, PLAYER_Y, PLAYER_W, 14);
    ctx.fillRect(state.playerX - 3, PLAYER_Y - 8, 6, 8);

    // HUD.
    ctx.fillStyle = "#FFD23F";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${state.score}`, 10, 16);
    ctx.fillText(`EVICTED ${state.evicted}`, 10, 30);

    if (state.phase === "attract") banner(ctx, "FIRE TO FREEZE THE RENT");
    else if (state.phase === "won") banner(ctx, "RENT FROZEN — CITY SAVED");
    else if (state.phase === "gameover") banner(ctx, "RENT HIKED — TAP RESET");
  },
};

function banner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(11,14,26,0.78)";
  ctx.fillRect(0, H / 2 - 16, W, 32);
  ctx.fillStyle = "#21D4FD";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2 + 3);
  ctx.textAlign = "left";
}

export const LANDLORD_INVADERS_DIMENSIONS = { width: W, height: H };
