import type { FormalPlungeState, GameEngine, PlungeObstacle } from "@/lib/types";

/**
 * "FORMAL PLUNGE" — Zohran suits up, dives off the high board, and swims
 * the length of the pool dodging bureaucrats and naysayers.
 *
 * Two beats inside a run:
 *   1. DIVE  — a short scripted plunge (prep → leap → arch → entry → splash).
 *   2. SWIM  — a buoyancy loop: tap to stroke upward, sink under gravity,
 *              thread the incoming gauntlet of red tape and hecklers.
 *
 * All motion is plain data; render reads state and never mutates it. The
 * character is drawn from the extracted Zohran sprite atlas in /public.
 */

const WIDTH = 480;
const HEIGHT = 320;
const WATER_Y = 104; // surface line
const FLOOR_Y = HEIGHT - 10; // pool bottom
const SWIM_X = 116; // Zohran's fixed horizontal lane
const SINK = 0.3; // downward accel per frame (buoyant, gentle)
const STROKE = -5.4; // upward impulse per stroke
const BASE_SCROLL = 2.4; // world speed at score 0
const DIVE_FRAMES = 58; // length of the scripted dive

const BUREAUCRAT_TAUNTS = [
  "FORM B-7",
  "PERMIT",
  "ZONING",
  "ENV. REVIEW",
  "COMM. BOARD",
  "HEARING",
];
const NAYSAYER_TAUNTS = ["NO!", "CAN'T!", "TAXES?!", "UNSERIOUS", "IMPOSSIBLE", "RADICAL!"];

/** Cheap deterministic hash so spawns are reproducible per frame. */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function spawnFoe(seed: number): PlungeObstacle {
  const kind = rand(seed) < 0.5 ? "bureaucrat" : "naysayer";
  const top = WATER_Y + 24;
  const bottom = FLOOR_Y - 16;
  const y = top + rand(seed * 1.7 + 9) * (bottom - top - 40);
  const pool = kind === "bureaucrat" ? BUREAUCRAT_TAUNTS : NAYSAYER_TAUNTS;
  const label = pool[Math.floor(rand(seed * 2.3 + 4) * pool.length)];
  return { x: WIDTH + 30, y, width: 38, height: 40, label, kind };
}

function freshState(phase: FormalPlungeState["phase"]): FormalPlungeState {
  return {
    phase,
    score: 0,
    timeLeft: null,
    frame: 0,
    mode: "dive",
    diveT: 0,
    diver: { x: 58, y: 44, vy: 0 },
    obstacles: [],
    nextSpawn: 0,
    poolsUnlocked: 0,
  };
}

export const formalPlunge: GameEngine<FormalPlungeState> = {
  init(): FormalPlungeState {
    return freshState("attract");
  },

  handleInput(state, intent) {
    if (intent === "reset") return freshState("attract");

    if (intent === "start" || intent === "flap" || intent === "up") {
      // From the board (attract / gameover) any input launches the dive.
      if (state.phase !== "playing") return freshState("playing");
      // Mid-swim, a stroke kicks Zohran upward. Dives are hands-free.
      if (state.mode === "swim") {
        return { ...state, diver: { ...state.diver, vy: STROKE } };
      }
    }
    return state;
  },

  update(state) {
    if (state.phase !== "playing") return state;
    const frame = state.frame + 1;

    // ---- Scripted dive: follow a leaping arc into the water ----
    if (state.mode === "dive") {
      const diveT = state.diveT + 1;
      const t = Math.min(diveT / DIVE_FRAMES, 1);
      const x = 58 + (SWIM_X - 58) * t;
      const baseY = 44 + (WATER_Y + 34 - 44) * t;
      const y = baseY - 24 * Math.sin(Math.PI * t); // hop up, then plunge

      if (diveT >= DIVE_FRAMES) {
        // Enter the water and seed the first foes.
        return {
          ...state,
          frame,
          mode: "swim",
          diveT,
          diver: { x: SWIM_X, y: WATER_Y + 44, vy: 0 },
          obstacles: [spawnFoe(31), spawnFoe(77)],
          nextSpawn: frame + 42,
        };
      }
      return { ...state, frame, diveT, diver: { x, y, vy: 0 } };
    }

    // ---- Swim loop: buoyancy + scrolling gauntlet ----
    let vy = state.diver.vy + SINK;
    let y = state.diver.y + vy;
    if (y < WATER_Y + 6) {
      y = WATER_Y + 6;
      vy = 0;
    } else if (y > FLOOR_Y - 6) {
      y = FLOOR_Y - 6;
      vy = 0;
    }
    const x = state.diver.x;

    const scroll = BASE_SCROLL + Math.min(state.score * 0.02, 2.4);
    let score = state.score;

    // Scroll foes; anything off the left edge was successfully dodged.
    const kept: PlungeObstacle[] = [];
    for (const o of state.obstacles) {
      const moved = { ...o, x: o.x - scroll };
      if (moved.x + moved.width < -4) {
        score += 5;
      } else {
        kept.push(moved);
      }
    }

    const poolsUnlocked = Math.floor(score / 50);

    // Spawn on a shrinking cadence as laps climb.
    let nextSpawn = state.nextSpawn;
    if (frame >= nextSpawn) {
      kept.push(spawnFoe(frame));
      const gap = Math.max(44, 84 - poolsUnlocked * 5);
      nextSpawn = frame + gap;
    }

    // Collision → caught. Hitbox is a forgiving core around the torso.
    const hw = 13;
    const hh = 10;
    for (const o of kept) {
      if (
        x + hw > o.x &&
        x - hw < o.x + o.width &&
        y + hh > o.y &&
        y - hh < o.y + o.height
      ) {
        return {
          ...state,
          frame,
          phase: "gameover",
          diver: { x, y, vy },
          obstacles: kept,
          score,
          poolsUnlocked,
          nextSpawn,
        };
      }
    }

    return {
      ...state,
      frame,
      score,
      poolsUnlocked,
      obstacles: kept,
      nextSpawn,
      diver: { x, y, vy },
    };
  },

  render(ctx, state) {
    drawScene(ctx, state.frame);

    // Foes.
    for (const o of state.obstacles) drawFoe(ctx, o, state.frame);

    // Zohran.
    const d = state.diver;
    if (state.mode === "dive" || state.phase === "attract") {
      drawZohran(ctx, diveFrameName(state), d.x, d.y);
    } else {
      const cycle = ["reach", "pull", "recover", "rotate"] as const;
      const name =
        state.phase === "gameover" ? "rotate" : cycle[Math.floor(state.frame / 6) % 4];
      drawZohran(ctx, name, d.x, d.y);
    }

    // HUD.
    ctx.fillStyle = "#FFD23F";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${state.score}`, 10, 18);
    ctx.fillText(`LAPS ${state.poolsUnlocked}`, 10, 32);

    if (state.phase === "attract") {
      banner(ctx, "TAP TO DIVE IN");
    } else if (state.phase === "gameover") {
      banner(ctx, "CAUGHT! — TAP TO RETRY");
    }
  },
};

/* ---------------------------------------------------------------- render */

function diveFrameName(state: FormalPlungeState): SpriteName {
  if (state.phase === "attract") return "prep";
  const t = state.diveT / DIVE_FRAMES;
  if (t < 0.14) return "prep";
  if (t < 0.34) return "leap";
  if (t < 0.58) return "arch";
  if (t < 0.82) return "entry";
  return "splash";
}

function drawScene(ctx: CanvasRenderingContext2D, frame: number) {
  // Sky / natatorium above the waterline.
  const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y);
  sky.addColorStop(0, "#0B0E1A");
  sky.addColorStop(1, "#123047");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, WATER_Y);

  // Water body.
  const water = ctx.createLinearGradient(0, WATER_Y, 0, HEIGHT);
  water.addColorStop(0, "#1f7fa8");
  water.addColorStop(1, "#0a2a3a");
  ctx.fillStyle = water;
  ctx.fillRect(0, WATER_Y, WIDTH, HEIGHT - WATER_Y);

  // Waterline shimmer.
  ctx.fillStyle = "rgba(126,224,255,0.55)";
  ctx.fillRect(0, WATER_Y - 2, WIDTH, 3);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  for (let i = 0; i < WIDTH; i += 24) {
    const w = 10 + ((i + frame) % 14);
    ctx.fillRect((i + frame * 0.6) % WIDTH, WATER_Y + 2, w, 1);
  }

  // Diving platform at the left.
  ctx.fillStyle = "#FFA500";
  ctx.fillRect(0, 60, 70, 8);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 68, 70, 2);
  ctx.fillStyle = "#7a4a12";
  ctx.fillRect(10, 68, 6, WATER_Y - 68);

  // Rising bubbles for a little underwater life.
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  const span = FLOOR_Y - WATER_Y - 12;
  for (let b = 0; b < 9; b++) {
    const bx = (b * 113 + frame * 0.4) % WIDTH;
    const by = FLOOR_Y - ((frame * 0.9 + b * 47) % span);
    const r = 1 + (b % 3);
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pool floor.
  ctx.fillStyle = "#061c27";
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
}

function drawFoe(ctx: CanvasRenderingContext2D, o: PlungeObstacle, frame: number) {
  const bob = Math.sin((frame + o.x) / 12) * 3;
  const y = o.y + bob;
  const naysayer = o.kind === "naysayer";
  const body = naysayer ? "#A855F7" : "#FF2E4D";

  // Card body with hard black border (brutalist).
  ctx.fillStyle = "#000";
  ctx.fillRect(o.x - 2, y - 2, o.width + 4, o.height + 4);
  ctx.fillStyle = body;
  ctx.fillRect(o.x, y, o.width, o.height);

  // Emoji face.
  ctx.font = "18px serif";
  ctx.textAlign = "center";
  ctx.fillText(naysayer ? "😠" : "📋", o.x + o.width / 2, y + 20);

  // Taunt label.
  ctx.fillStyle = naysayer ? "#0B0E1A" : "#FFFFFF";
  ctx.font = "bold 7px monospace";
  ctx.fillText(o.label, o.x + o.width / 2, y + o.height - 5);
  ctx.textAlign = "left";
}

/* ---- sprite atlas ---------------------------------------------------- */

type SpriteName =
  | "prep"
  | "leap"
  | "arch"
  | "entry"
  | "splash"
  | "glide"
  | "reach"
  | "pull"
  | "recover"
  | "rotate";

const SPRITE_FILE: Record<SpriteName, string> = {
  prep: "dive1-prep",
  leap: "dive2-leap",
  arch: "dive3-arch",
  entry: "dive4-entry",
  splash: "dive5-splash",
  glide: "dive6-glide",
  reach: "swim1-reach",
  pull: "swim2-pull",
  recover: "swim3-recover",
  rotate: "swim4-rotate",
};

// Target on-canvas heights so every pose reads at a consistent scale.
const SPRITE_H: Record<SpriteName, number> = {
  prep: 64,
  leap: 58,
  arch: 40,
  entry: 60,
  splash: 56,
  glide: 40,
  reach: 40,
  pull: 46,
  recover: 46,
  rotate: 40,
};

const imgCache: Partial<Record<SpriteName, HTMLImageElement>> = {};

function sprite(name: SpriteName): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  let img = imgCache[name];
  if (!img) {
    img = new window.Image();
    img.src = `/sprites/zohran/${SPRITE_FILE[name]}.webp`;
    imgCache[name] = img;
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function drawZohran(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  cx: number,
  cy: number,
) {
  const img = sprite(name);
  if (!img) {
    // Fallback blazer block until the sprite decodes.
    ctx.fillStyle = "#161B2E";
    ctx.fillRect(cx - 9, cy - 12, 18, 24);
    ctx.fillStyle = "#7ee0ff";
    ctx.fillRect(cx - 2, cy - 10, 4, 14);
    return;
  }
  const h = SPRITE_H[name];
  const w = (img.naturalWidth / img.naturalHeight) * h;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h));
}

function banner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(11,14,26,0.72)";
  ctx.fillRect(0, HEIGHT / 2 - 18, WIDTH, 36);
  ctx.fillStyle = "#7ee0ff";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 4);
  ctx.textAlign = "left";
}

export const FORMAL_PLUNGE_DIMENSIONS = { width: WIDTH, height: HEIGHT };
