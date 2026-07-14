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
const BASE_RATE = 0.052; // depth/sec at multiplier 1 (hand-shovels help now)

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

/** Floating feedback text ("SCRAPE!", "HONK HONK", …) in canvas coords. */
export interface Popup {
  x: number;
  y: number;
  text: string;
  ttl: number;
  color: string;
}

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
  popups: Popup[];
  /** Shovel-mash streak: rapid taps chain; milestones earn praise. */
  streak: number;
  lastTapT: number;
  /** A cab stuck in a drift — mash it to free the cabbie. */
  taxi: { c: number; r: number; taps: number; ttl: number } | null;
  taxiTimer: number;
  /** The bodega cat, on patrol. Purely load-bearing for morale. */
  cat: { x: number; row: number; dir: number; thanked: boolean } | null;
  catTimer: number;
}

const LINES_ORDER = [
  "Plow %N — that block. The halal cart can't move!",
  "%N, roll out. Curtis is tweeting again.",
  "Send %N! A bodega cat is judging us.",
  "%N, go go go — buses don't believe in snow days.",
  "Plow %N! Grandma has a hair appointment.",
  "%N, that street owes me a clear commute.",
];
const LINES_GOOD = [
  "City's moving. Somewhere, a pundit weeps.",
  "Cleared! The group chat is THRIVING.",
  "Smooth as a fresh bagel schmear.",
  "The MTA called just to say thanks. Unprecedented.",
];
const LINES_BAD = [
  "That drift has its own zip code now.",
  "I can hear the op-eds being typed.",
  "A snowman on 4th just got rent-stabilized. DIG!",
  "We are NOT calling Albany about this.",
];
const LINES_IDLE = [
  "Watch the squall. Keep routing.",
  "Shovel with your heart. Also your hands.",
  "Every flake is a tiny landlord. Clear 'em out.",
];
const SCRAPE_WORDS = ["SCRAPE!", "SHOVEL!", "DIG!", "CHOP!", "SCOOP!"];

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
    popups: [],
    streak: 0,
    lastTapT: -9,
    taxi: null,
    taxiTimer: 10,
    cat: null,
    catTimer: 14,
  };
}

/** Canvas center of a tile — popups and props anchor here. */
const tileCX = (c: number) => BOARD_X + c * TILE + TILE / 2;
const tileCY = (r: number) => BOARD_Y + r * TILE + TILE / 2;

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

    const popups = state.popups.slice();
    const pop = (x: number, y: number, text: string, color = "#FFD23F") =>
      popups.push({ x, y, text, ttl: 0.9, color });

    // Mash the stuck cab free — five whacks and the cabbie rides again.
    if (state.taxi && Math.abs(state.taxi.c - c) <= 1 && Math.abs(state.taxi.r - r) <= 1) {
      const taps = state.taxi.taps + 1;
      if (taps >= 5) {
        pop(tileCX(state.taxi.c), tileCY(state.taxi.r) - 8, "CABBIE FREED! +75", "#3DDC97");
        return {
          ...state,
          popups,
          taxi: null,
          taxiTimer: 12 + rand(state.frame) * 8,
          score: state.score + 75,
          director: {
            pose: "good",
            line: "He thanked me in four languages. What a city.",
            ttl: 4,
          },
        };
      }
      pop(tileCX(state.taxi.c), tileCY(state.taxi.r) - 8, `PUSH! x${5 - taps}`, "#7ee0ff");
      return { ...state, popups, taxi: { ...state.taxi, taps } };
    }

    // Tap directly on a plow (on clear-ish ground) → select that truck.
    const onPlow = state.plows.find(
      (p) => Math.abs(Math.round(p.x) - c) + Math.abs(Math.round(p.y) - r) <= 1,
    );
    if (onPlow && !isRoadTapPreferred(state, c, r, onPlow)) {
      pop(tileCX(Math.round(onPlow.x)), tileCY(Math.round(onPlow.y)) - 14, "READY!", "#7ee0ff");
      return {
        ...state,
        popups,
        selected: onPlow.id,
        director: { pose: "idle", line: `Plow ${onPlow.id + 1} standing by.`, ttl: 2.5 },
      };
    }

    if (!isRoad(c, r)) return state;

    // ---- BUTTON MASHER: every street tap is a hand-shovel scrape ----
    const snow = state.snow.slice();
    const k = idx(c, r);
    const hadSnow = snow[k] > 0.25;
    snow[k] = Math.max(0, snow[k] - 0.7);
    let score = state.score;
    let streak = state.streak;
    const chained = state.t - state.lastTapT < 0.9;
    streak = chained ? streak + 1 : 1;
    if (hadSnow) {
      score += 2;
      pop(
        tileCX(c) + (rand(state.frame * 1.7) - 0.5) * 14,
        tileCY(r) - 6,
        SCRAPE_WORDS[Math.floor(rand(state.frame) * SCRAPE_WORDS.length)],
      );
    }
    let director = state.director;
    if (streak > 0 && streak % 10 === 0) {
      pop(tileCX(c), tileCY(r) - 22, `STREAK x${streak}!`, "#3DDC97");
      director = {
        pose: "good",
        line:
          streak >= 20
            ? "UNION-GRADE SHOVELING. Somebody hire this person."
            : "Look at those hands go. That's civic duty.",
        ttl: 3,
      };
    }

    // Dispatch the fleet — but don't thrash routes while the player mashes
    // one spot: skip if a plow is already headed (or parked) right there.
    const covered = state.plows.some((p) => {
      const dest = p.path.length ? p.path[p.path.length - 1] : [Math.round(p.x), Math.round(p.y)];
      return Math.abs(dest[0] - c) + Math.abs(dest[1] - r) <= 2;
    });
    let plows = state.plows;
    let selected = state.selected;
    if (!covered) {
      const pick =
        state.plows.find((p) => p.id === state.selected) ??
        [...state.plows].sort(
          (a, b) =>
            (a.path.length ? 1000 : 0) + Math.abs(a.x - c) + Math.abs(a.y - r) -
            ((b.path.length ? 1000 : 0) + Math.abs(b.x - c) + Math.abs(b.y - r)),
        )[0];
      const path = route([Math.round(pick.x), Math.round(pick.y)], [c, r]);
      if (path.length) {
        plows = state.plows.map((p) => (p.id === pick.id ? { ...p, path } : p));
        selected = null;
        pop(tileCX(Math.round(pick.x)), tileCY(Math.round(pick.y)) - 14, "HONK HONK", "#FF6B35");
        director = {
          pose: "order",
          line: LINES_ORDER[Math.floor(rand(state.frame) * LINES_ORDER.length)].replace(
            "%N",
            `${pick.id + 1}`,
          ),
          ttl: 3,
        };
      }
    }

    return {
      ...state,
      snow,
      score,
      streak,
      lastTapT: state.t,
      popups,
      plows,
      selected,
      director,
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

    // ---- popups drift up and fade ----
    const popups = state.popups
      .map((p) => ({ ...p, y: p.y - 26 * dt, ttl: p.ttl - dt }))
      .filter((p) => p.ttl > 0);

    // ---- stuck cab: spawns in a drift, waits for the mash rescue ----
    let taxi = state.taxi;
    let taxiTimer = state.taxiTimer - dt;
    let score2 = score;
    let cabbieQuit = false;
    if (taxi) {
      taxi = { ...taxi, ttl: taxi.ttl - dt };
      if (taxi.ttl <= 0) {
        popups.push({
          x: tileCX(taxi.c),
          y: tileCY(taxi.r) - 8,
          text: "cab gave up. 1★ review.",
          ttl: 1.4,
          color: "#FF2E4D",
        });
        taxi = null;
        taxiTimer = 12 + rand(frame) * 8;
        cabbieQuit = true;
      }
    } else if (taxiTimer <= 0 && t > 6) {
      // Strand it in real snow, away from the fleet.
      const cands = ROAD_TILES.filter(
        ([c, r]) =>
          snow[idx(c, r)] > 1 &&
          state.plows.every((p) => Math.abs(p.x - c) + Math.abs(p.y - r) > 3),
      );
      if (cands.length) {
        const [c, r] = cands[Math.floor(rand(frame * 2.9) * cands.length)];
        taxi = { c, r, taps: 0, ttl: 15 };
        popups.push({
          x: tileCX(c),
          y: tileCY(r) - 10,
          text: "CAB STUCK — MASH IT OUT!",
          ttl: 1.6,
          color: "#FFD23F",
        });
      }
      taxiTimer = 12 + rand(frame * 1.3) * 8;
    }

    // ---- the bodega cat, on patrol ----
    let cat = state.cat;
    let catTimer = state.catTimer - dt;
    if (cat) {
      const nx = cat.x + cat.dir * 0.85 * dt;
      let thanked = cat.thanked;
      if (!thanked) {
        const near = state.plows.some(
          (p) => Math.abs(p.x - nx) < 1.3 && Math.abs(p.y - cat!.row) < 1.3,
        );
        if (near) {
          thanked = true;
          score2 += 15;
          popups.push({
            x: tileCX(Math.round(nx)),
            y: tileCY(cat.row) - 12,
            text: "the bodega cat approves ✨ +15",
            ttl: 1.6,
            color: "#3DDC97",
          });
        }
      }
      cat = nx < -1 || nx > COLS ? null : { ...cat, x: nx, thanked };
      if (!cat) catTimer = 14 + rand(frame) * 10;
    } else if (catTimer <= 0) {
      const row = [0, 2, 4, 6, 8, 10, 12, 14][Math.floor(rand(frame * 4.1) * 8)];
      const dir = rand(frame * 6.7) > 0.5 ? 1 : -1;
      cat = { x: dir === 1 ? -0.8 : COLS - 0.2, row, dir, thanked: false };
      catTimer = 14 + rand(frame * 1.9) * 10;
    }

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
    if (cabbieQuit) {
      director = { pose: "bad", line: "We lost a cab to a DRIFT. Embarrassing.", ttl: 3.5 };
    } else if (director.ttl <= 0) {
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
        director = {
          pose: "idle",
          line: LINES_IDLE[Math.floor(rand(frame * 2.3) * LINES_IDLE.length)],
          ttl: 4,
        };
      }
    }

    const common = {
      ...state,
      frame,
      t,
      snow,
      plows,
      cleared,
      score: score2,
      clearFrac,
      blockedFrac,
      phaseLabel,
      gust,
      popups,
      taxi,
      taxiTimer,
      cat,
      catTimer,
    };
    if (blockedFrac >= LOSE_BLOCKED_FRAC) {
      return {
        ...common,
        phase: "gameover" as const,
        timeLeft: Math.max(0, STORM_LENGTH - t),
        director: {
          pose: "lose" as const,
          line: "The city's snowed in. We plow at dawn — and we DO plow at dawn.",
          ttl: 99,
        },
      };
    }
    if (t >= STORM_LENGTH) {
      return {
        ...common,
        score: score2 + Math.round(clearFrac * 500),
        phase: "won" as const,
        timeLeft: 0,
        director: {
          pose: "win" as const,
          line: "Storm's over. Buses ran ON TIME. Historians will argue about this.",
          ttl: 99,
        },
      };
    }
    return { ...common, timeLeft: Math.max(0, STORM_LENGTH - t), director };
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

    // Stuck cab — wobbles, flashes, begs to be mashed.
    if (state.taxi) {
      const { c, r, taps } = state.taxi;
      const x = tileCX(c);
      const y = tileCY(r);
      const wob = Math.sin(state.frame / 3) * (1 + taps);
      ctx.save();
      ctx.translate(x + wob, y);
      ctx.fillStyle = "#FFD23F";
      ctx.fillRect(-12, -7, 24, 14);
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(-6, -5, 12, 5); // windows
      ctx.fillRect(-4, 2, 8, 3); // TAXI plate
      ctx.restore();
      // Snow piled on the hood.
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(x - 6 + wob, y - 8, 5, Math.PI, 0);
      ctx.arc(x + 6 + wob, y - 9, 6, Math.PI, 0);
      ctx.fill();
      if (Math.floor(state.frame / 16) % 2 === 0) {
        ctx.fillStyle = "#FF2E4D";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`MASH x${5 - taps}`, x, y - 16);
      }
    }

    // The bodega cat, unbothered.
    if (state.cat) {
      const x = BOARD_X + state.cat.x * TILE + TILE / 2;
      const y = tileCY(state.cat.row) + 6;
      ctx.save();
      ctx.translate(x, y);
      if (state.cat.dir < 0) ctx.scale(-1, 1);
      ctx.fillStyle = "#e8863c";
      ctx.fillRect(-6, -4, 12, 6); // body
      ctx.fillRect(4, -8, 5, 5); // head
      ctx.beginPath(); // tail, raised — it owns this street
      ctx.moveTo(-6, -3);
      ctx.quadraticCurveTo(-11, -6, -9, -12);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#e8863c";
      ctx.stroke();
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(6, -7, 1.5, 1.5); // eye
      ctx.restore();
    }

    // Floating popups.
    for (const p of state.popups) {
      ctx.globalAlpha = Math.min(1, p.ttl * 2);
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(6,10,22,0.9)";
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "left";

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
    // Live mash streak, front and center while it's hot.
    if (state.streak >= 5 && state.t - state.lastTapT < 1.2) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#3DDC97";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`SHOVEL STREAK x${state.streak}`, WIDTH / 2, 26);
      ctx.font = "10px monospace";
    }

    if (state.phase === "attract") {
      banner(ctx, "TAP TO MAN THE PLOW DESK", "tap streets: plows roll + you shovel. MASH.");
    } else if (state.phase === "gameover") {
      banner(ctx, "THE CITY SNOWED IN", "tap to run it back. the drifts are gloating.");
    } else if (state.phase === "won") {
      banner(ctx, "STORM CLEARED!", `score ${state.score} — the buses ran ON TIME`);
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
