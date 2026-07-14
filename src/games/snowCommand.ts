import type { BaseGameState, GameEngine } from "@/lib/types";

/**
 * "SNOW COMMAND" — the Mayor runs the plow desk through the first winter
 * storm of the term.
 *
 * Top-down Pac-Man-style street grid. Snow falls on every road tile and keeps
 * piling up; the player DIRECTS a fleet of plows rather than driving one:
 *   • tap a street → the nearest idle plow routes there (BFS), clearing every
 *     tile it drives over;
 *   • tap a plow first to pick a specific truck, then tap its destination.
 *
 * Deep snow slows plows down. If too much of the grid snows shut the city
 * seizes (gameover); survive until the storm blows out to win. The shell
 * shows the Mayor at the bottom directing — his pose + barked orders come
 * from `state.director`.
 *
 * All logic is plain data; render reads state and never mutates it.
 */

/* ------------------------------------------------------------------ *
 * Board layout
 * ------------------------------------------------------------------ */
const COLS = 13;
const ROWS = 15;
const TILE = 32;
const BOARD_X = 12;
const BOARD_Y = 46;
const WIDTH = COLS * TILE + BOARD_X * 2; // 440
const HEIGHT = ROWS * TILE + BOARD_Y + 14; // 540

/** Roads form a Pac-Man-ish lattice: every other column + every other row. */
const isRoad = (c: number, r: number) =>
  c >= 0 && c < COLS && r >= 0 && r < ROWS && (c % 2 === 0 || r % 2 === 0);

const ROAD_TILES: Array<[number, number]> = [];
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) if (isRoad(c, r)) ROAD_TILES.push([c, r]);
const ROAD_COUNT = ROAD_TILES.length;
const idx = (c: number, r: number) => r * COLS + c;

/* ------------------------------------------------------------------ *
 * Tunables
 * ------------------------------------------------------------------ */
const STORM_LENGTH = 90; // seconds until the storm blows out
const PLOW_SPEED = 4.2; // tiles/sec on clear road
const SNOW_SLOW = 0.5; // speed divisor factor per unit depth
const DEEP = 2.2; // depth at which a tile counts as snowed-shut
const CLEAR = 0.9; // depth below which a tile counts as clear
const MAX_DEPTH = 3;
const LOSE_BLOCKED_FRAC = 0.5; // city seizes if half the grid snows shut
const CLEAR_SCORE = 10;

/** Storm intensity phases (fraction of storm elapsed → snowfall multiplier). */
const PHASES: Array<[number, number, string]> = [
  [0.0, 0.6, "FLURRIES"],
  [0.18, 1.15, "STEADY SNOW"],
  [0.45, 1.9, "HEAVY BANDS"],
  [0.75, 1.0, "TAPERING OFF"],
];
const BASE_RATE = 0.045; // depth/sec at multiplier 1

function phaseAt(t: number): [number, string] {
  const f = t / STORM_LENGTH;
  let mult = PHASES[0][1];
  let label = PHASES[0][2];
  for (const [start, m, l] of PHASES) if (f >= start) [mult, label] = [m, l];
  return [mult, label];
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */
export interface Plow {
  id: number;
  /** Position in tile coords (floats while moving between tiles). */
  x: number;
  y: number;
  /** Remaining route, as tile waypoints. */
  path: Array<[number, number]>;
  /** Facing for the sprite (dx, dy of last movement). */
  fx: number;
  fy: number;
}

export type DirectorPose = "idle" | "order" | "good" | "bad" | "win" | "lose";

export interface SnowCommandState extends BaseGameState {
  t: number; // seconds into the storm
  snow: number[]; // per-cell depth (only road cells used)
  plows: Plow[];
  selected: number | null; // plow id picked for the next dispatch
  cleared: number; // tiles cleared (score events)
  clearFrac: number;
  blockedFrac: number;
  phaseLabel: string;
  gust: { c: number; r: number; ttl: number } | null; // localized squall
  director: { pose: DirectorPose; line: string; ttl: number };
}

const LINES_ORDER = [
  "Plow %N — that street. Go!",
  "Route %N through there. Move!",
  "%N, the people need that block!",
  "Send %N — buses can't wait!",
];
const LINES_GOOD = [
  "That's how we plow. Beautiful.",
  "The city is MOVING, folks.",
  "Buses gliding. Keep it up.",
];
const LINES_BAD = [
  "We're losing the grid — dig in!",
  "Too much white out there. Plows!",
  "That's a snowed-in block. Unacceptable.",
];

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function freshState(phase: SnowCommandState["phase"]): SnowCommandState {
  const snow = new Array(COLS * ROWS).fill(0);
  // A little pre-storm dusting so the board reads snowy from frame one.
  for (const [c, r] of ROAD_TILES) snow[idx(c, r)] = 0.25 + rand(c * 31 + r) * 0.4;
  return {
    phase,
    score: 0,
    timeLeft: STORM_LENGTH,
    frame: 0,
    t: 0,
    snow,
    plows: [
      { id: 0, x: 0, y: 0, path: [], fx: 1, fy: 0 },
      { id: 1, x: COLS - 1, y: 0, path: [], fx: -1, fy: 0 },
      { id: 2, x: Math.floor(COLS / 2), y: ROWS - 1, path: [], fx: 0, fy: -1 },
    ],
    selected: null,
    cleared: 0,
    clearFrac: 0,
    blockedFrac: 0,
    phaseLabel: "FLURRIES",
    gust: null,
    director: { pose: "idle", line: "Storm's coming in. Ready the fleet.", ttl: 5 },
  };
}

/** BFS shortest path over road tiles. Returns waypoints excluding the start. */
function route(
  from: [number, number],
  to: [number, number],
): Array<[number, number]> {
  if (!isRoad(to[0], to[1])) return [];
  const prev = new Map<number, number>();
  const q: Array<[number, number]> = [from];
  const seen = new Set<number>([idx(from[0], from[1])]);
  while (q.length) {
    const [c, r] = q.shift()!;
    if (c === to[0] && r === to[1]) {
      const path: Array<[number, number]> = [];
      let k = idx(c, r);
      while (k !== idx(from[0], from[1])) {
        path.push([k % COLS, Math.floor(k / COLS)]);
        k = prev.get(k)!;
      }
      return path.reverse();
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nc = c + dc;
      const nr = r + dr;
      const k = idx(nc, nr);
      if (isRoad(nc, nr) && !seen.has(k)) {
        seen.add(k);
        prev.set(k, idx(c, r));
        q.push([nc, nr]);
      }
    }
  }
  return [];
}

/* ------------------------------------------------------------------ *
 * Engine
 * ------------------------------------------------------------------ */
export const snowCommand: GameEngine<SnowCommandState> = {
  init() {
    return freshState("attract");
  },

  handleInput(state, intent) {
    if (intent === "reset") return freshState("attract");
    if (state.phase !== "playing") {
      if (intent === "start" || intent.startsWith("tap:")) return freshState("playing");
      return state;
    }
    if (!intent.startsWith("tap:")) return state;
    const [c, r] = intent.slice(4).split(",").map(Number);
    if (Number.isNaN(c) || Number.isNaN(r)) return state;

    // Tap on (or next to) a plow → select that truck.
    const onPlow = state.plows.find(
      (p) => Math.abs(Math.round(p.x) - c) + Math.abs(Math.round(p.y) - r) <= 1,
    );
    if (onPlow && !isRoadTapPreferred(state, c, r, onPlow)) {
      return {
        ...state,
        selected: onPlow.id,
        director: { pose: "idle", line: `Plow ${onPlow.id + 1} standing by.`, ttl: 2.5 },
      };
    }

    if (!isRoad(c, r)) return state;
    // Dispatch: the selected plow, else the nearest plow (idle preferred).
    const pick =
      state.plows.find((p) => p.id === state.selected) ??
      [...state.plows].sort(
        (a, b) =>
          (a.path.length ? 1000 : 0) + Math.abs(a.x - c) + Math.abs(a.y - r) -
          ((b.path.length ? 1000 : 0) + Math.abs(b.x - c) + Math.abs(b.y - r)),
      )[0];
    const start: [number, number] = [Math.round(pick.x), Math.round(pick.y)];
    const path = route(start, [c, r]);
    if (!path.length) return state;
    const line = LINES_ORDER[Math.floor(rand(state.frame) * LINES_ORDER.length)].replace(
      "%N",
      `${pick.id + 1}`,
    );
    return {
      ...state,
      selected: null,
      plows: state.plows.map((p) => (p.id === pick.id ? { ...p, path } : p)),
      director: { pose: "order", line, ttl: 3 },
    };
  },

  update(state, deltaMs) {
    if (state.phase !== "playing") return { ...state, frame: state.frame + 1 };
    const dt = Math.min(deltaMs / 1000, 0.05);
    const t = state.t + dt;
    const frame = state.frame + 1;

    // ---- snowfall ----
    const [mult, phaseLabel] = phaseAt(t);
    const snow = state.snow.slice();
    // Localized squall drifts around, dumping extra where it sits.
    let gust = state.gust;
    if (!gust || gust.ttl <= 0) {
      const [gc, gr] = ROAD_TILES[Math.floor(rand(frame * 7.3) * ROAD_COUNT)];
      gust = { c: gc, r: gr, ttl: 6 + rand(frame) * 5 };
    } else {
      gust = { ...gust, ttl: gust.ttl - dt };
    }
    for (const [c, r] of ROAD_TILES) {
      const k = idx(c, r);
      const gd = Math.abs(c - gust.c) + Math.abs(r - gust.r);
      const local = gd <= 3 ? 2.2 : 1;
      snow[k] = Math.min(MAX_DEPTH, snow[k] + BASE_RATE * mult * local * dt);
    }

    // ---- plows ----
    let cleared = state.cleared;
    let score = state.score;
    const plows = state.plows.map((p) => {
      if (!p.path.length) {
        // Parked plows still keep their own tile clear.
        const k = idx(Math.round(p.x), Math.round(p.y));
        snow[k] = 0;
        return p;
      }
      let { x, y, fx, fy } = p;
      let path = p.path;
      let budget = dt;
      while (budget > 0 && path.length) {
        const [tc, tr] = path[0];
        const k = idx(Math.round(x), Math.round(y));
        const speed = PLOW_SPEED / (1 + snow[k] * SNOW_SLOW);
        const dx = tc - x;
        const dy = tr - y;
        const dist = Math.abs(dx) + Math.abs(dy);
        const step = speed * budget;
        if (step >= dist) {
          x = tc;
          y = tr;
          budget -= dist / speed;
          path = path.slice(1);
          const kk = idx(tc, tr);
          if (snow[kk] >= CLEAR) {
            cleared += 1;
            score += CLEAR_SCORE;
          }
          snow[kk] = 0;
          if (dist > 0) {
            fx = Math.sign(dx);
            fy = Math.sign(dy);
          }
        } else {
          x += Math.sign(dx) * step * (dx !== 0 ? 1 : 0);
          y += Math.sign(dy) * step * (dy !== 0 ? 1 : 0);
          if (dx !== 0) {
            fx = Math.sign(dx);
            fy = 0;
          } else if (dy !== 0) {
            fy = Math.sign(dy);
            fx = 0;
          }
          // Plows clear as they roll, not just on arrival.
          snow[idx(Math.round(x), Math.round(y))] = 0;
          budget = 0;
        }
      }
      return { ...p, x, y, fx, fy, path };
    });

    // ---- metrics + verdicts ----
    let clear = 0;
    let blocked = 0;
    for (const [c, r] of ROAD_TILES) {
      const d = snow[idx(c, r)];
      if (d < CLEAR) clear++;
      if (d >= DEEP) blocked++;
    }
    const clearFrac = clear / ROAD_COUNT;
    const blockedFrac = blocked / ROAD_COUNT;

    // Director chatter: ttl runs down; refresh with mood lines at low ttl.
    let director = { ...state.director, ttl: state.director.ttl - dt };
    if (director.ttl <= 0) {
      if (blockedFrac > 0.3) {
        director = {
          pose: "bad",
          line: LINES_BAD[Math.floor(rand(frame * 3.7) * LINES_BAD.length)],
          ttl: 4,
        };
      } else if (clearFrac > 0.75) {
        director = {
          pose: "good",
          line: LINES_GOOD[Math.floor(rand(frame * 5.1) * LINES_GOOD.length)],
          ttl: 4,
        };
      } else {
        director = { pose: "idle", line: "Watch the squall. Keep routing.", ttl: 4 };
      }
    }

    if (blockedFrac >= LOSE_BLOCKED_FRAC) {
      return {
        ...state,
        frame,
        t,
        snow,
        plows,
        cleared,
        score,
        clearFrac,
        blockedFrac,
        phaseLabel,
        gust,
        phase: "gameover",
        timeLeft: Math.max(0, STORM_LENGTH - t),
        director: { pose: "lose", line: "The city's snowed in. We plow at dawn.", ttl: 99 },
      };
    }
    if (t >= STORM_LENGTH) {
      return {
        ...state,
        frame,
        t,
        snow,
        plows,
        cleared,
        score: score + Math.round(clearFrac * 500),
        clearFrac,
        blockedFrac,
        phaseLabel,
        gust,
        phase: "won",
        timeLeft: 0,
        director: { pose: "win", line: "Storm's over — and the buses ran ON TIME.", ttl: 99 },
      };
    }

    return {
      ...state,
      frame,
      t,
      snow,
      plows,
      cleared,
      score,
      clearFrac,
      blockedFrac,
      phaseLabel,
      gust,
      timeLeft: Math.max(0, STORM_LENGTH - t),
      director,
    };
  },

  render(ctx, state) {
    // Night sky backdrop.
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Board.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = BOARD_X + c * TILE;
        const y = BOARD_Y + r * TILE;
        if (!isRoad(c, r)) {
          // City block: dark roof + lit windows.
          ctx.fillStyle = "#1a2338";
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
          ctx.fillStyle = "#0f1526";
          ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
          ctx.fillStyle = "rgba(255,214,90,0.75)";
          if ((c * 7 + r * 13) % 3 === 0) ctx.fillRect(x + 8, y + 9, 4, 4);
          if ((c * 5 + r * 11) % 4 === 1) ctx.fillRect(x + 19, y + 17, 4, 4);
          continue;
        }
        const d = state.snow[idx(c, r)];
        // Road shade: asphalt → deep snow.
        const f = Math.min(1, d / MAX_DEPTH);
        const rr = Math.round(43 + (235 - 43) * f);
        const gg = Math.round(47 + (240 - 47) * f);
        const bb = Math.round(58 + (250 - 58) * f);
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(x, y, TILE, TILE);
        if (d >= DEEP) {
          // Snowed-shut: drift bumps.
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.arc(x + 10, y + 22, 7, Math.PI, 0);
          ctx.arc(x + 23, y + 20, 8, Math.PI, 0);
          ctx.fill();
        } else if (d < CLEAR) {
          // Clear lane markings.
          ctx.fillStyle = "rgba(255,214,90,0.35)";
          ctx.fillRect(x + TILE / 2 - 1, y + 13, 2, 6);
        }
      }
    }

    // Dispatch routes.
    for (const p of state.plows) {
      if (!p.path.length) continue;
      ctx.strokeStyle = "rgba(61,220,151,0.55)";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(BOARD_X + p.x * TILE + TILE / 2, BOARD_Y + p.y * TILE + TILE / 2);
      for (const [c, r] of p.path)
        ctx.lineTo(BOARD_X + c * TILE + TILE / 2, BOARD_Y + r * TILE + TILE / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const [lc, lr] = p.path[p.path.length - 1];
      ctx.strokeStyle = "#3DDC97";
      ctx.strokeRect(BOARD_X + lc * TILE + 4, BOARD_Y + lr * TILE + 4, TILE - 8, TILE - 8);
    }

    // Plows.
    for (const p of state.plows) {
      const x = BOARD_X + p.x * TILE + TILE / 2;
      const y = BOARD_Y + p.y * TILE + TILE / 2;
      const sel = state.selected === p.id;
      if (sel) {
        ctx.strokeStyle = "#FFD23F";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 17, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(x, y);
      const ang = Math.atan2(p.fy, p.fx);
      ctx.rotate(ang);
      // Body.
      ctx.fillStyle = "#FF6B35";
      ctx.fillRect(-11, -8, 20, 16);
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(-7, -5, 8, 10); // cab window
      // Blade.
      ctx.fillStyle = "#FFD23F";
      ctx.beginPath();
      ctx.moveTo(9, -10);
      ctx.lineTo(15, 0);
      ctx.lineTo(9, 10);
      ctx.closePath();
      ctx.fill();
      // Beacon.
      if (Math.floor(state.frame / 12) % 2 === 0) {
        ctx.fillStyle = "#FF2E4D";
        ctx.fillRect(-10, -3, 3, 6);
      }
      ctx.restore();
      // Number badge.
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${p.id + 1}`, x, y - 14);
    }

    // Falling snow overlay.
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97 + state.frame * (0.6 + (i % 3) * 0.3)) % WIDTH;
      const sy = (i * 53 + state.frame * (1.1 + (i % 4) * 0.35)) % HEIGHT;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // HUD.
    ctx.fillStyle = "rgba(6,10,22,0.85)";
    ctx.fillRect(0, 0, WIDTH, 38);
    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    ctx.fillStyle = "#7ee0ff";
    ctx.fillText(`❄ ${state.phaseLabel}`, 12, 15);
    ctx.fillStyle = "#FFD23F";
    ctx.fillText(`SCORE ${state.score}`, 12, 30);
    ctx.textAlign = "right";
    ctx.fillStyle = state.clearFrac > 0.6 ? "#3DDC97" : state.clearFrac > 0.4 ? "#FFD23F" : "#FF2E4D";
    ctx.fillText(`CLEAR ${(state.clearFrac * 100).toFixed(0)}%`, WIDTH - 12, 15);
    ctx.fillStyle = "#fff";
    ctx.fillText(`STORM ${Math.ceil(state.timeLeft ?? 0)}s`, WIDTH - 12, 30);

    if (state.phase === "attract") {
      banner(ctx, "TAP TO MAN THE PLOW DESK", "tap streets to route the fleet");
    } else if (state.phase === "gameover") {
      banner(ctx, "THE CITY SNOWED IN", "tap to run it back");
    } else if (state.phase === "won") {
      banner(ctx, "STORM CLEARED!", `final score ${state.score} — tap to go again`);
    }
  },
};

/** True when a tap near a plow was probably aimed at a snowy street instead
 *  (deep snow next to a plow should dispatch, not select). */
function isRoadTapPreferred(
  state: SnowCommandState,
  c: number,
  r: number,
  plow: Plow,
): boolean {
  if (Math.round(plow.x) === c && Math.round(plow.y) === r) return false;
  return isRoad(c, r) && state.snow[idx(c, r)] >= DEEP;
}

function banner(ctx: CanvasRenderingContext2D, text: string, sub: string) {
  const y = HEIGHT / 2 - 26;
  ctx.fillStyle = "rgba(6,10,22,0.82)";
  ctx.fillRect(0, y, WIDTH, 52);
  ctx.textAlign = "center";
  ctx.fillStyle = "#7ee0ff";
  ctx.font = "13px monospace";
  ctx.fillText(text, WIDTH / 2, y + 22);
  ctx.fillStyle = "#FFD23F";
  ctx.font = "10px monospace";
  ctx.fillText(sub, WIDTH / 2, y + 40);
  ctx.textAlign = "left";
}

export const SNOW_COMMAND_DIMENSIONS = { width: WIDTH, height: HEIGHT };
/** Convert a canvas-space point to a board tile, or null when off-board. */
export function snowTileAt(px: number, py: number): [number, number] | null {
  const c = Math.floor((px - BOARD_X) / TILE);
  const r = Math.floor((py - BOARD_Y) / TILE);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
  return [c, r];
}
