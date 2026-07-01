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

const WIDTH = 568; // widescreen — the pool background fills the canvas width
const HEIGHT = 320;
const WATER_Y = 124; // surface line — matches the pool background
const FLOOR_Y = HEIGHT - 8; // pool bottom
const SWIM_X = 168; // Mamdani's fixed horizontal lane
const MOVE_SPEED = 3.2; // vertical glide speed while ▲/▼ is held
const BASE_SCROLL = 2.3; // world speed at score 0
const WATER_SCROLL = 1.9; // background scroll speed (the "moving water")
const DIVE_FRAMES = 64;
const FINISH_DIST = 1700; // background-scroll distance before the finish line appears

// Scripted dive path (canvas coords): spring off the board, arc up, plunge in.
const DIVE_START_X = 96;
const DIVE_START_Y = 57; // standing on the board (feet ≈ board surface)
const DIVE_APEX_Y = 38; // top of the leap
const DIVE_END_Y = WATER_Y + 58; // where he settles under the surface

// Camera: zoomed in on the board before the jump, pulling back to the full
// pool as he dives. Focus points are in canvas coords.
const CAM_CLOSE = { zoom: 1.75, cx: 104, cy: 78 };
const CAM_WIDE = { zoom: 1.0, cx: WIDTH / 2, cy: HEIGHT / 2 };
// Source x (in the background image) where the diving board ends — the region
// to its right is board-free and tiles seamlessly for the endless swim.
const BOARD_END_SX = 470;

const KINDS: BillionaireKind[] = ["elon", "baron", "snorkeler", "swan"];
// Animation frame count per billionaire.
const BILL_FRAMES: Record<BillionaireKind, number> = {
  elon: 3,
  baron: 2,
  snorkeler: 3,
  swan: 4,
};
// On-canvas height + width per billionaire (from sprite aspect ratios).
const BILL_H: Record<BillionaireKind, number> = {
  elon: 46,
  baron: 78,
  snorkeler: 50,
  swan: 74,
};
const BILL_ASPECT: Record<BillionaireKind, number> = {
  elon: 2.21,
  baron: 1.24,
  snorkeler: 1.99,
  swan: 1.05,
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
  baron: { speed: 0.95, amp: 3, freq: 0.05, band: [0.42, 0.92] },
  // cash-diver — medium pace but weaves up and down.
  snorkeler: { speed: 1.1, amp: 30, freq: 0.05, band: [0.22, 0.76] },
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
    diver: { x: DIVE_START_X, y: DIVE_START_Y, vy: 0 },
    obstacles: [],
    nextSpawn: 0,
    poolsUnlocked: 0,
    bgScroll: 0,
    finishX: null,
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

  update(state, deltaMs) {
    if (state.phase !== "playing") return state;
    // Advance by real elapsed time (in 60fps-frame units) so the game runs at
    // the same speed on 60Hz, 120Hz, or variable-refresh displays. Capped so a
    // stall / backgrounded tab can't teleport everything on the next frame.
    const dt = Math.min(deltaMs / (1000 / 60), 3);
    const frame = state.frame + dt;

    // ---- Scripted dive into the water ----
    if (state.mode === "dive") {
      const diveT = state.diveT + dt;
      const t = Math.min(diveT / DIVE_FRAMES, 1);
      const x = DIVE_START_X + (SWIM_X - DIVE_START_X) * t;
      // Spring up to the apex, then accelerate down into the pool.
      let y: number;
      if (t < 0.28) {
        y = DIVE_START_Y + (DIVE_APEX_Y - DIVE_START_Y) * (t / 0.28);
      } else {
        const u = (t - 0.28) / 0.72;
        y = DIVE_APEX_Y + (DIVE_END_Y - DIVE_APEX_Y) * u * u;
      }
      // Once he leaves the board, the pool starts sliding by (board scrolls away).
      const bgScroll = state.bgScroll + (t > 0.3 ? WATER_SCROLL * dt : 0);
      if (diveT >= DIVE_FRAMES) {
        return {
          ...state,
          frame,
          mode: "swim",
          diveT,
          bgScroll,
          diver: { x: SWIM_X, y: DIVE_END_Y, vy: 0 },
          obstacles: [spawnBillionaire(41)],
          nextSpawn: frame + 48,
        };
      }
      return { ...state, frame, diveT, bgScroll, diver: { x, y, vy: 0 } };
    }

    // ---- Swim loop: auto-forward, steer to dodge ----
    const vy = state.diver.vy; // constant while ▲/▼ held, 0 when released
    let y = state.diver.y + vy * dt;
    if (y < WATER_Y + 10) y = WATER_Y + 10;
    else if (y > FLOOR_Y - 10) y = FLOOR_Y - 10;
    const x = state.diver.x;

    const scroll = BASE_SCROLL + Math.min(state.score * 0.006, 1.8);
    const bgScroll = state.bgScroll + WATER_SCROLL * dt;
    let score = state.score;

    // Scroll billionaires at their own pace; off the left = dodged.
    const kept: PlungeObstacle[] = [];
    for (const o of state.obstacles) {
      const moved = { ...o, x: o.x - scroll * BILL_CFG[o.kind].speed * dt };
      if (moved.x + moved.width / 2 < -4) score += 10;
      else kept.push(moved);
    }

    const poolsUnlocked = Math.floor(score / 100);

    // The home stretch: once he's swum far enough, the finish line rolls in
    // from the right and no more billionaires spawn. Reaching it wins.
    let finishX = state.finishX;
    if (finishX === null && bgScroll >= FINISH_DIST) finishX = WIDTH + 70;
    if (finishX !== null) {
      finishX -= scroll * dt;
      if (finishX <= SWIM_X) {
        return {
          ...state,
          frame,
          phase: "won",
          score,
          poolsUnlocked,
          obstacles: kept,
          bgScroll,
          finishX: SWIM_X,
          diver: { x, y, vy },
        };
      }
    }

    let nextSpawn = state.nextSpawn;
    if (finishX === null && frame >= nextSpawn) {
      kept.push(spawnBillionaire(Math.floor(frame)));
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
      bgScroll,
      finishX,
      diver: { x, y, vy },
    };
  },

  render(ctx, state) {
    // Camera: zoom in on the board pre-jump, pull back to the full pool.
    const cam = camera(state);
    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.cx, -cam.cy);

    drawScene(ctx, state);
    if (state.finishX !== null) drawFinish(ctx, state.finishX, state.frame);
    for (const o of state.obstacles) drawBillionaire(ctx, o, state.frame);

    const d = state.diver;
    if (state.mode === "dive" || state.phase === "attract") {
      drawZohran(ctx, diveFrameName(state), d.x, d.y);
    } else if (state.phase === "won") {
      drawZohran(ctx, "win", d.x, d.y);
    } else {
      const cycle = ["swim1", "swim2", "swim3", "swim4"] as const;
      const name =
        state.phase === "gameover" ? "lose" : cycle[Math.floor(state.frame / 7) % 4];
      drawZohran(ctx, name, d.x, d.y);
    }
    ctx.restore();

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
    } else if (state.phase === "won") {
      banner(ctx, "YOU MADE THE OTHER SIDE!", "the water stays public — tap to swim again");
    } else if (state.finishX !== null) {
      // Cheer on the home stretch.
      ctx.fillStyle = "#FFD23F";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("FINISH LINE AHEAD!", WIDTH / 2, 20);
      ctx.textAlign = "left";
    }
  },
};

/* ---------------------------------------------------------------- render */

function diveFrameName(state: FormalPlungeState): Pose {
  if (state.phase === "attract") return "prep";
  const t = state.diveT / DIVE_FRAMES;
  if (t < 0.12) return "prep"; // still crouched on the board
  // Pick the pose from where he actually is, so the water-entry frames only
  // show once he's reached the surface (never half-submerged mid-air).
  const y = state.diver.y;
  if (y < WATER_Y - 4) return t < 0.45 ? "leap" : "arch"; // airborne
  return y < WATER_Y + 26 ? "entry" : "splash"; // breaking / under the surface
}

function camera(state: FormalPlungeState): { zoom: number; cx: number; cy: number } {
  if (state.phase === "attract") return CAM_CLOSE;
  if (state.mode === "dive") {
    const t = Math.min(state.diveT / DIVE_FRAMES, 1);
    const e = t * t * (3 - 2 * t); // smoothstep
    return {
      zoom: CAM_CLOSE.zoom + (CAM_WIDE.zoom - CAM_CLOSE.zoom) * e,
      cx: CAM_CLOSE.cx + (CAM_WIDE.cx - CAM_CLOSE.cx) * e,
      cy: CAM_CLOSE.cy + (CAM_WIDE.cy - CAM_CLOSE.cy) * e,
    };
  }
  return CAM_WIDE;
}

function drawScene(ctx: CanvasRenderingContext2D, state: FormalPlungeState) {
  const img = loadImg(bgCache as Record<string, HTMLImageElement>, "bg", "/games/swimming-bg.webp");
  if (!img) {
    ctx.fillStyle = "#0a2a3a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }
  ctx.imageSmoothingEnabled = false;
  const scale = HEIGHT / img.naturalHeight;
  const srcH = img.naturalHeight;
  const scroll = state.bgScroll;

  // Endless, board-free pool loop. Because the scene is banded horizontally
  // (crowd / deck / waterline are the same at every x), tiling this slice
  // keeps every band continuous — only the ripple/crowd content repeats.
  const loopSw = img.naturalWidth - BOARD_END_SX;
  const loopW = loopSw * scale;
  let x = -(scroll % loopW);
  if (x > 0) x -= loopW;
  for (; x < WIDTH; x += loopW) {
    ctx.drawImage(img, BOARD_END_SX, 0, loopSw, srcH, Math.round(x), 0, Math.ceil(loopW), HEIGHT);
  }

  // The diving board slab, drawn on top and scrolling off once.
  const boardW = BOARD_END_SX * scale;
  const bx = -scroll;
  if (bx + boardW > 0) {
    ctx.drawImage(img, 0, 0, BOARD_END_SX, srcH, Math.round(bx), 0, Math.ceil(boardW), HEIGHT);
  }

  // A few rising bubbles for a little underwater life.
  const frame = state.frame;
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  const span = FLOOR_Y - WATER_Y - 10;
  for (let b = 0; b < 8; b++) {
    const bxb = (b * 131 + frame * 0.4) % WIDTH;
    const by = FLOOR_Y - ((frame * 0.8 + b * 57) % span);
    const r = 1 + (b % 2);
    ctx.beginPath();
    ctx.arc(bxb, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---- finish line ----------------------------------------------------- */

function drawFinish(ctx: CanvasRenderingContext2D, x: number, frame: number) {
  const top = WATER_Y - 6;
  const bottom = HEIGHT;
  // Checkered pole across the pool.
  const cell = 10;
  const poleW = 14;
  for (let cy = top, row = 0; cy < bottom; cy += cell, row++) {
    for (let cx = 0; cx < poleW; cx += cell) {
      ctx.fillStyle = (row + cx / cell) % 2 === 0 ? "#000000" : "#ffffff";
      ctx.fillRect(Math.round(x - poleW / 2 + cx), Math.round(cy), cell, cell);
    }
  }
  // Floating "FINISH" banner above the water, bobbing gently.
  const by = top - 26 + Math.sin(frame / 12) * 2;
  const bw = 74;
  ctx.fillStyle = "#000";
  ctx.fillRect(Math.round(x - bw / 2) - 2, Math.round(by) - 2, bw + 4, 20);
  ctx.fillStyle = "#FFA500";
  ctx.fillRect(Math.round(x - bw / 2), Math.round(by), bw, 16);
  ctx.fillStyle = "#000";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("FINISH", x, by + 12);
  ctx.textAlign = "left";
}

/* ---- billionaire sprites -------------------------------------------- */

function drawBillionaire(
  ctx: CanvasRenderingContext2D,
  o: PlungeObstacle,
  frame: number,
) {
  const f = (Math.floor(frame / 9) + Math.floor(o.seed)) % BILL_FRAMES[o.kind];
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

/* ---- Mamdani sprite atlas ------------------------------------------- */

type Pose =
  | "prep"
  | "leap"
  | "arch"
  | "entry"
  | "splash"
  | "swim1"
  | "swim2"
  | "swim3"
  | "swim4"
  | "lose"
  | "win";

// All frames share the same source frame (a common union crop), so a single
// on-canvas height keeps the character anchored consistently between poses.
const MAMDANI_FILE: Record<Pose, string> = {
  prep: "Standing",
  leap: "Jump01",
  arch: "Dive02",
  entry: "Dive04_EnterWater",
  splash: "Dive03",
  swim1: "Swim01",
  swim2: "Swim02",
  swim3: "Swim03",
  swim4: "Swim04",
  lose: "lose",
  win: "Win",
};
// Poses that read in/entering the water render bigger; the on-board poses
// (which fill the full frame) render smaller so they don't clip the top.
const BIG_POSES = new Set<Pose>([
  "entry",
  "splash",
  "swim1",
  "swim2",
  "swim3",
  "swim4",
  "lose",
  "win",
]);
const FRAME_H_WATER = 100;
const FRAME_H_BOARD = 74;

const zCache: Partial<Record<Pose, HTMLImageElement>> = {};
const bCache: Partial<Record<string, HTMLImageElement>> = {};
const bgCache: Partial<Record<string, HTMLImageElement>> = {};

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
  pose: Pose,
  cx: number,
  cy: number,
) {
  const img = loadImg(
    zCache as Record<string, HTMLImageElement>,
    pose,
    `/sprites/mamdani/${MAMDANI_FILE[pose]}.webp`,
  );
  if (!img) {
    ctx.fillStyle = "#161B2E";
    ctx.fillRect(cx - 9, cy - 12, 18, 24);
    ctx.fillStyle = "#7ee0ff";
    ctx.fillRect(cx - 2, cy - 10, 4, 14);
    return;
  }
  const h = BIG_POSES.has(pose) ? FRAME_H_WATER : FRAME_H_BOARD;
  const w = (img.naturalWidth / img.naturalHeight) * h;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    Math.round(cx - w / 2),
    Math.round(cy - h / 2),
    Math.round(w),
    Math.round(h),
  );
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

/**
 * Kick off fetching every image the game draws (background, all Mamdani
 * poses, all billionaire frames) so nothing pops in mid-play. Safe to call
 * on mount; images are cached and de-duped.
 */
export function preloadFormalPlunge(): void {
  if (typeof window === "undefined") return;
  loadImg(bgCache as Record<string, HTMLImageElement>, "bg", "/games/swimming-bg.webp");
  (Object.keys(MAMDANI_FILE) as Pose[]).forEach((pose) =>
    loadImg(
      zCache as Record<string, HTMLImageElement>,
      pose,
      `/sprites/mamdani/${MAMDANI_FILE[pose]}.webp`,
    ),
  );
  KINDS.forEach((kind) => {
    for (let f = 0; f < BILL_FRAMES[kind]; f++) billSprite(kind, f);
  });
}
