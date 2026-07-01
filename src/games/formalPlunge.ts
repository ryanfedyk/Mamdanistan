import type {
  BillionaireKind,
  FormalPlungeState,
  GameEngine,
  PlungeObstacle,
} from "@/lib/types";

/**
 * "FORMAL PLUNGE" — Zohran dives into the public pool and swims a lap while
 * a parade of billionaires crashes it. Zohran swims forward automatically;
 * the player only steers UP / DOWN to dodge the oncoming plutocrats.
 *
 *   1. KICK OFF — tap / press to launch off the board (a scripted dive).
 *   2. SWIM     — the pool scrolls by on its own. Press ▲ / ▼ to glide up
 *                 and down (with momentum) and thread past the billionaires.
 *
 * All motion is plain data; render reads state and never mutates it.
 */

const WIDTH = 480;
const HEIGHT = 320;
const WATER_Y = 92; // surface line
const FLOOR_Y = HEIGHT - 12; // pool bottom
const SWIM_X = 98; // Zohran's fixed horizontal lane
const MOVE_SPEED = 3.2; // vertical glide speed while ▲/▼ is held
const BASE_SCROLL = 2.3; // world speed at score 0
const DIVE_FRAMES = 54;

const KINDS: BillionaireKind[] = ["elon", "baron", "snorkeler", "swan"];
// On-canvas height + width per billionaire (from sprite aspect ratios).
const BILL_H: Record<BillionaireKind, number> = {
  elon: 48,
  baron: 74,
  snorkeler: 42,
  swan: 64,
};
const BILL_ASPECT: Record<BillionaireKind, number> = {
  elon: 1.68,
  baron: 0.74,
  snorkeler: 2.24,
  swan: 1.09,
};

/**
 * Per-billionaire behaviour so each one dodges differently:
 * - speed:  horizontal pace as a multiple of the world scroll.
 * - amp/freq: vertical weave (amplitude px / angular speed) — how much it
 *   bobs or dives while crossing.
 * - band:  the slice of the water column it spawns in [top..bottom fraction].
 */
const BILL_CFG: Record<
  BillionaireKind,
  { speed: number; amp: number; freq: number; band: [number, number] }
> = {
  // rocket-suit bro — darts across fast, near-flat.
  elon: { speed: 1.45, amp: 5, freq: 0.14, band: [0.12, 0.85] },
  // robber baron — slow, steady, rides low sipping his tea.
  baron: { speed: 0.9, amp: 3, freq: 0.05, band: [0.42, 0.92] },
  // cash-diver — medium pace but weaves up and down.
  snorkeler: { speed: 1.08, amp: 30, freq: 0.05, band: [0.22, 0.76] },
  // swan-float tycoon — big and slow, drifting along the surface.
  swan: { speed: 0.66, amp: 11, freq: 0.03, band: [0.0, 0.32] },
};

/** A billionaire's live vertical center this frame (base + weave, clamped
 *  inside the pool). Used by both collision and render so they agree. */
function billY(o: PlungeObstacle, frame: number): number {
  const c = BILL_CFG[o.kind];
  const y = o.y + Math.sin((frame + o.seed * 40) * c.freq) * c.amp;
  const half = o.height / 2;
  return Math.max(WATER_Y + half + 4, Math.min(FLOOR_Y - half - 4, y));
}

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function spawnBillionaire(seed: number): PlungeObstacle {
  const kind = KINDS[Math.floor(rand(seed) * KINDS.length) % KINDS.length];
  const h = BILL_H[kind];
  const w = h * BILL_ASPECT[kind];
  const c = BILL_CFG[kind];
  const top = WATER_Y + h / 2 + 6;
  const bottom = FLOOR_Y - h / 2 - 6;
  const lo = top + c.band[0] * (bottom - top);
  const hi = top + c.band[1] * (bottom - top);
  const y = lo + rand(seed * 1.7 + 9) * Math.max(1, hi - lo);
  return { x: WIDTH + w / 2 + 8, y, width: w, height: h, kind, seed };
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

    // From the board (attract / gameover) any input kicks off the dive.
    if (state.phase !== "playing") {
      if (
        intent === "start" ||
        intent === "up" ||
        intent === "down" ||
        intent === "flap"
      ) {
        return freshState("playing");
      }
      return state;
    }

    // Mid-swim: hold ▲ / ▼ to glide; releasing stops. The dive is hands-free.
    if (state.mode === "swim") {
      if (intent === "up") {
        return { ...state, diver: { ...state.diver, vy: -MOVE_SPEED } };
      }
      if (intent === "down") {
        return { ...state, diver: { ...state.diver, vy: MOVE_SPEED } };
      }
      if (intent === "stopy") {
        return { ...state, diver: { ...state.diver, vy: 0 } };
      }
    }
    return state;
  },

  update(state) {
    if (state.phase !== "playing") return state;
    const frame = state.frame + 1;

    // ---- Scripted dive into the water ----
    if (state.mode === "dive") {
      const diveT = state.diveT + 1;
      const t = Math.min(diveT / DIVE_FRAMES, 1);
      const x = 58 + (SWIM_X - 58) * t;
      const baseY = 44 + (WATER_Y + 40 - 44) * t;
      const y = baseY - 24 * Math.sin(Math.PI * t);
      if (diveT >= DIVE_FRAMES) {
        return {
          ...state,
          frame,
          mode: "swim",
          diveT,
          diver: { x: SWIM_X, y: WATER_Y + 60, vy: 0 },
          obstacles: [spawnBillionaire(41)],
          nextSpawn: frame + 48,
        };
      }
      return { ...state, frame, diveT, diver: { x, y, vy: 0 } };
    }

    // ---- Swim loop: auto-forward, steer to dodge ----
    const vy = state.diver.vy; // constant while ▲/▼ held, 0 when released
    let y = state.diver.y + vy;
    if (y < WATER_Y + 10) y = WATER_Y + 10;
    else if (y > FLOOR_Y - 10) y = FLOOR_Y - 10;
    const x = state.diver.x;

    const scroll = BASE_SCROLL + Math.min(state.score * 0.006, 1.8);
    let score = state.score;

    // Scroll billionaires at their own pace; off the left = dodged.
    const kept: PlungeObstacle[] = [];
    for (const o of state.obstacles) {
      const moved = { ...o, x: o.x - scroll * BILL_CFG[o.kind].speed };
      if (moved.x + moved.width / 2 < -4) score += 10;
      else kept.push(moved);
    }

    const poolsUnlocked = Math.floor(score / 100);

    let nextSpawn = state.nextSpawn;
    if (frame >= nextSpawn) {
      kept.push(spawnBillionaire(frame));
      const gap = Math.max(58, 104 - poolsUnlocked * 5);
      nextSpawn = frame + gap;
    }

    // Collision → caught. Hitboxes are shrunk toward each sprite's core.
    const zHW = 15;
    const zHH = 9;
    for (const o of kept) {
      const oy = billY(o, frame);
      const ehw = (o.width * 0.5) / 2;
      const ehh = (o.height * 0.55) / 2;
      if (
        x + zHW > o.x - ehw &&
        x - zHW < o.x + ehw &&
        y + zHH > oy - ehh &&
        y - zHH < oy + ehh
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

    for (const o of state.obstacles) drawBillionaire(ctx, o, state.frame);

    const d = state.diver;
    if (state.mode === "dive" || state.phase === "attract") {
      drawZohran(ctx, diveFrameName(state), d.x, d.y);
    } else {
      // Only the two clean, similarly-anchored strokes — recover/rotate read
      // as dark blobs at this scale, so the cycle skips them.
      const cycle = ["reach", "pull"] as const;
      const name =
        state.phase === "gameover" ? "reach" : cycle[Math.floor(state.frame / 9) % 2];
      drawZohran(ctx, name, d.x, d.y);
    }

    // HUD.
    ctx.fillStyle = "#FFD23F";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE ${state.score}`, 10, 18);
    ctx.fillText(`LAPS ${state.poolsUnlocked}`, 10, 32);

    if (state.phase === "attract") {
      banner(ctx, "TAP TO KICK OFF", "▲▼ to dodge the billionaires");
    } else if (state.phase === "gameover") {
      banner(ctx, "CAUGHT! — TAP TO RETRY", "the pool belongs to the people");
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
  const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y);
  sky.addColorStop(0, "#0B0E1A");
  sky.addColorStop(1, "#123047");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, WATER_Y);

  const water = ctx.createLinearGradient(0, WATER_Y, 0, HEIGHT);
  water.addColorStop(0, "#1f7fa8");
  water.addColorStop(1, "#0a2a3a");
  ctx.fillStyle = water;
  ctx.fillRect(0, WATER_Y, WIDTH, HEIGHT - WATER_Y);

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

  // Rising bubbles.
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

  ctx.fillStyle = "#061c27";
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
}

/* ---- billionaire sprites -------------------------------------------- */

function drawBillionaire(
  ctx: CanvasRenderingContext2D,
  o: PlungeObstacle,
  frame: number,
) {
  const f = (Math.floor(frame / 8) + Math.floor(o.seed)) % 4;
  const img = billSprite(o.kind, f);
  const cy = billY(o, frame);
  if (!img) {
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(o.x - o.width / 2, cy - o.height / 2, o.width, o.height);
    return;
  }
  // Flip horizontally so the swimmers face their direction of travel (left).
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(o.x), Math.round(cy));
  ctx.scale(-1, 1);
  ctx.drawImage(
    img,
    Math.round(-o.width / 2),
    Math.round(-o.height / 2),
    Math.round(o.width),
    Math.round(o.height),
  );
  ctx.restore();
}

/* ---- Zohran sprite atlas -------------------------------------------- */

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

const zCache: Partial<Record<SpriteName, HTMLImageElement>> = {};
const bCache: Partial<Record<string, HTMLImageElement>> = {};

function loadImg(cache: Record<string, HTMLImageElement>, key: string, src: string) {
  if (typeof window === "undefined") return null;
  let img = cache[key];
  if (!img) {
    img = new window.Image();
    img.src = src;
    cache[key] = img;
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function billSprite(kind: BillionaireKind, frame: number): HTMLImageElement | null {
  const key = `${kind}-${frame + 1}`;
  return loadImg(bCache as Record<string, HTMLImageElement>, key, `/sprites/billionaires/${key}.webp`);
}

function drawZohran(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  cx: number,
  cy: number,
) {
  const img = loadImg(
    zCache as Record<string, HTMLImageElement>,
    name,
    `/sprites/zohran/${SPRITE_FILE[name]}.webp`,
  );
  if (!img) {
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

function banner(ctx: CanvasRenderingContext2D, text: string, sub?: string) {
  ctx.fillStyle = "rgba(11,14,26,0.72)";
  ctx.fillRect(0, HEIGHT / 2 - 24, WIDTH, sub ? 52 : 36);
  ctx.fillStyle = "#7ee0ff";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, WIDTH / 2, HEIGHT / 2 - 2);
  if (sub) {
    ctx.fillStyle = "#FFD23F";
    ctx.font = "9px monospace";
    ctx.fillText(sub, WIDTH / 2, HEIGHT / 2 + 16);
  }
  ctx.textAlign = "left";
}

export const FORMAL_PLUNGE_DIMENSIONS = { width: WIDTH, height: HEIGHT };
