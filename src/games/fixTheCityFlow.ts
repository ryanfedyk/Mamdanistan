import type {
  CityHazard,
  CityHazardType,
  FixTheCityState,
  GameEngine,
  TrafficCar,
} from "@/lib/types";

/**
 * "FIX THE CITY" — Traffic-Flow variant (hybrid design).
 *
 * The city is a stack of one-way streets. When a hazard (pothole, cone,
 * debris, hydrant, dead signal) drops into a lane, the cars behind it pile
 * up bumper-to-bumper and that lane STOPS. Every blocked lane pumps the
 * city-wide GRIDLOCK meter. Your job: hop across the moving traffic, reach
 * each jam, and clear it so the queue drains and the cars flow again.
 *
 *   • Win  — clear the whole repair quota (the city keeps moving).
 *   • Lose — GRIDLOCK hits 100 (the city seizes up).
 *
 * The dodge survives as friction: only MOVING cars can clip you (a queued
 * car is safe to weave past), and a fender-bender you cause bumps gridlock.
 *
 * Wireframe build — vectors only. Sibling of `fixTheCity.ts` (the classic
 * dodge variant); selectable via `?mode=flow`.
 */

/* ------------------------------------------------------------------ *
 * Tunables
 * ------------------------------------------------------------------ */
const CELL = 40;
const COLS = 9;
const ROWS = 13;
const WIDTH = COLS * CELL; // 360
const HEIGHT = ROWS * CELL; // 520

const START_COL = 4;
const START_ROW = 12;

const QUOTA = 12; // repairs to win
const MAX_ACTIVE = 3; // simultaneous jams (each pumps gridlock)
const INITIAL_HAZARDS = 2;
const SPAWN_INTERVAL = 1.5; // seconds between new jams
const POP_TIME = 0.22;

const GRIDLOCK_MAX = 100;
const PUMP_PER_HAZARD = 6; // gridlock/sec added per active jam
const DRAIN = 3; // gridlock/sec bled off constantly
const HIT_GRIDLOCK = 3; // small gridlock bump when a car clips you (minor)

const FIX_SCORE = 25;
const CLEAR_BONUS = 3; // score per point of gridlock headroom on win
const INVULN_TIME = 1.3;
const FIX_IFRAMES = 0.85; // grace after a repair, so the released queue can't run you over
const MOVING = 22; // px/sec above which a car counts as "moving" (dangerous)

/* Traffic density: bigger gaps → crossable windows between cars. */
const SEED_SPACING = 150; // extra px between seeded cars
const SPAWN_SPACING = 120; // min clear px at the entrance before a new car spawns

/* Lanes: rows carrying one-way traffic + their free-flow speed. */
const LANES: Array<{ row: number; dir: 1 | -1; speed: number; w: number }> = [
  { row: 1, dir: 1, speed: 58, w: 58 },
  { row: 2, dir: -1, speed: 72, w: 52 },
  { row: 4, dir: 1, speed: 64, w: 62 },
  { row: 5, dir: -1, speed: 80, w: 50 },
  { row: 7, dir: 1, speed: 56, w: 60 },
  { row: 8, dir: -1, speed: 76, w: 54 },
  { row: 10, dir: 1, speed: 66, w: 56 },
  { row: 11, dir: -1, speed: 84, w: 64 },
];

const HAZARD_TYPES: CityHazardType[] = [
  "pothole",
  "construction",
  "debris",
  "hydrant",
  "signal",
];

const isRoad = (row: number) => LANES.some((l) => l.row === row);
const laneDir = (row: number) => LANES.find((l) => l.row === row)?.dir ?? 1;
const laneOf = (row: number) => LANES.find((l) => l.row === row);

function nearestSafeRow(row: number): number {
  for (let d = 0; d < ROWS; d++) {
    if (row + d < ROWS && !isRoad(row + d)) return row + d;
    if (row - d >= 0 && !isRoad(row - d)) return row - d;
  }
  return START_ROW;
}

/* ------------------------------------------------------------------ *
 * Traffic
 * ------------------------------------------------------------------ */
const CAR_GAP = 10; // extra bumper spacing beyond car width
const HAZARD_CLEAR = CELL * 0.5; // how far ahead of the hazard cell cars stop

function seedCars(): TrafficCar[] {
  const cars: TrafficCar[] = [];
  for (const L of LANES) {
    const spacing = L.w + SEED_SPACING;
    const n = Math.ceil(WIDTH / spacing) + 1;
    for (let k = 0; k < n; k++) {
      const x = k * spacing + ((L.row * 41) % spacing);
      cars.push({ row: L.row, x, vx: L.dir * L.speed, w: L.w, v: L.speed });
    }
  }
  return cars;
}

/**
 * One frame of car-following per lane: cars advance at their lane's free-flow
 * speed unless something is ahead — the car in front, or an active hazard —
 * in which case they brake and queue. Returns the new car list.
 */
function stepTraffic(
  cars: TrafficCar[],
  hazards: CityHazard[],
  dt: number,
): TrafficCar[] {
  const out: TrafficCar[] = [];
  for (const L of LANES) {
    const dir = L.dir;
    const laneCars = cars.filter((c) => c.row === L.row);
    // Travel coordinate t increases in the direction of motion.
    const T = (x: number) => x * dir;
    const haz = hazards.find((h) => h.row === L.row);
    const tHaz = haz ? T(haz.col * CELL + CELL / 2) : null;

    laneCars.sort((a, b) => T(b.x) - T(a.x)); // front (largest t) first
    let aheadT = Infinity;
    for (const c of laneCars) {
      const t = T(c.x);
      const desired = t + L.speed * dt;
      let bound = aheadT - (c.w + CAR_GAP);
      // A hazard blocks only cars still behind it.
      if (tHaz !== null && t < tHaz) bound = Math.min(bound, tHaz - HAZARD_CLEAR);
      let nt = Math.min(desired, bound);
      if (nt < t) nt = t; // never reverse
      c.v = (nt - t) / dt;
      c.x = nt * dir;
      c.vx = dir * L.speed;
      aheadT = nt;
    }

    // Despawn past the exit; remember the most-upstream car for spawning.
    let minT = Infinity;
    for (const c of laneCars) {
      const exited = dir > 0 ? c.x > WIDTH + c.w : c.x < -c.w;
      if (exited) continue;
      out.push(c);
      minT = Math.min(minT, T(c.x));
    }
    // Spawn a fresh car at the entrance when there's room (and the lane isn't
    // already packed) so flow is continuous.
    const entranceT = dir > 0 ? -L.w / 2 : T(WIDTH + L.w / 2);
    const laneCount = out.filter((c) => c.row === L.row).length;
    if ((minT === Infinity || minT - entranceT > L.w + SPAWN_SPACING) && laneCount < COLS + 2) {
      out.push({ row: L.row, x: entranceT * dir, vx: dir * L.speed, w: L.w, v: L.speed });
    }
  }
  return out;
}

function pickType(): CityHazardType {
  return HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)];
}

function pickSpawnCell(
  hazards: CityHazard[],
  player: { col: number; row: number },
): { col: number; row: number } | null {
  const taken = new Set(hazards.map((h) => `${h.col},${h.row}`));
  const cands: Array<{ col: number; row: number }> = [];
  for (const L of LANES) {
    for (let c = 0; c < COLS; c++) {
      if (taken.has(`${c},${L.row}`)) continue;
      if (c === player.col && L.row === player.row) continue;
      cands.push({ col: c, row: L.row });
    }
  }
  if (!cands.length) return null;
  return cands[Math.floor(Math.random() * cands.length)];
}

function startState(): FixTheCityState {
  const base = fixTheCityFlow.init();
  const hazards: CityHazard[] = [];
  for (let i = 0; i < INITIAL_HAZARDS; i++) {
    const cell = pickSpawnCell(hazards, { col: START_COL, row: START_ROW });
    if (cell) hazards.push({ ...cell, type: pickType(), pop: 1 });
  }
  return { ...base, phase: "playing", cars: seedCars(), hazards, spawnTimer: SPAWN_INTERVAL };
}

function demoHazards(): CityHazard[] {
  const spots: Array<[number, number, CityHazardType]> = [
    [3, 2, "construction"],
    [6, 8, "pothole"],
  ];
  return spots.map(([col, row, type]) => ({ col, row, type, pop: 1 }));
}

function applyMove(state: FixTheCityState, intent: string): FixTheCityState {
  let { col, row } = state.player;
  if (intent === "up") row = Math.max(0, row - 1);
  else if (intent === "down") row = Math.min(ROWS - 1, row + 1);
  else if (intent === "left") col = Math.max(0, col - 1);
  else if (intent === "right") col = Math.min(COLS - 1, col + 1);

  let score = state.score;
  let fixed = state.fixed;
  const hazards = state.hazards.filter((h) => {
    if (h.col === col && h.row === row) {
      score += FIX_SCORE;
      fixed += 1;
      return false;
    }
    return true;
  });

  const didFix = fixed > state.fixed;
  const won = fixed >= state.quota;
  if (won) score += Math.round((GRIDLOCK_MAX - (state.gridlock ?? 0)) * CLEAR_BONUS);

  return {
    ...state,
    player: { col, row },
    hazards,
    score,
    fixed,
    // Leap clear as the freed traffic surges back.
    invuln: didFix ? Math.max(state.invuln, FIX_IFRAMES) : state.invuln,
    phase: won ? "won" : state.phase,
  };
}

/* ------------------------------------------------------------------ *
 * Engine
 * ------------------------------------------------------------------ */
export const fixTheCityFlow: GameEngine<FixTheCityState> = {
  init(): FixTheCityState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: null, // no clock — GRIDLOCK is the enemy
      frame: 0,
      player: { col: START_COL, row: START_ROW },
      grid: { cols: COLS, rows: ROWS },
      hazards: demoHazards(),
      cars: seedCars(),
      quota: QUOTA,
      fixed: 0,
      invuln: 0,
      hits: 0,
      spawnTimer: SPAWN_INTERVAL,
      gridlock: 0,
    };
  },

  handleInput(state, intent) {
    if (intent === "reset") return fixTheCityFlow.init();
    const move =
      intent === "up" || intent === "down" || intent === "left" || intent === "right";
    if (state.phase !== "playing") {
      if (intent === "start" || move) {
        const fresh = startState();
        return move ? applyMove(fresh, intent) : fresh;
      }
      return state;
    }
    if (move) return applyMove(state, intent);
    return state;
  },

  update(state, deltaMs) {
    const dt = deltaMs / 1000;
    const frame = state.frame + 1;

    const cars = stepTraffic(state.cars.map((c) => ({ ...c })), state.hazards, dt);
    if (state.phase !== "playing") return { ...state, frame, cars };

    let hazards = state.hazards.map((h) =>
      h.pop < 1 ? { ...h, pop: Math.min(1, h.pop + dt / POP_TIME) } : h,
    );

    // Whack-a-mole spawning, capped by the remaining workload.
    let spawnTimer = state.spawnTimer - dt;
    const cap = Math.min(MAX_ACTIVE, state.quota - state.fixed);
    if (spawnTimer <= 0 && hazards.length < cap) {
      const cell = pickSpawnCell(hazards, state.player);
      if (cell) hazards = [...hazards, { ...cell, type: pickType(), pop: 0 }];
      spawnTimer = SPAWN_INTERVAL;
    }

    // Gridlock: every active jam pumps it; it always bleeds off a little.
    let gridlock = (state.gridlock ?? 0) + (hazards.length * PUMP_PER_HAZARD - DRAIN) * dt;

    // Collision — only MOVING cars are dangerous.
    let { col, row } = state.player;
    let invuln = Math.max(0, state.invuln - dt);
    let hits = state.hits;
    if (invuln <= 0) {
      const pcx = col * CELL + CELL / 2;
      const struck = cars.some(
        (c) =>
          c.row === row &&
          Math.abs(c.v ?? 0) > MOVING &&
          Math.abs(c.x - pcx) < c.w / 2 + CELL * 0.34,
      );
      if (struck) {
        hits += 1;
        invuln = INVULN_TIME;
        gridlock += HIT_GRIDLOCK;
        row = nearestSafeRow(row);
      }
    }

    gridlock = Math.max(0, Math.min(GRIDLOCK_MAX, gridlock));
    const phase = gridlock >= GRIDLOCK_MAX ? "gameover" : state.phase;

    return {
      ...state,
      frame,
      cars,
      hazards,
      spawnTimer,
      gridlock,
      player: { col, row },
      invuln,
      hits,
      phase,
    };
  },

  render(ctx, state) {
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let r = 0; r < ROWS; r++) {
      const y = r * CELL;
      if (isRoad(r)) {
        // Tint the whole lane red when it's badly jammed.
        const jam = state.cars.filter((c) => c.row === r && Math.abs(c.v ?? 0) < 5).length;
        ctx.fillStyle = jam >= 3 ? "rgba(255,46,77,0.10)" : "rgba(255,255,255,0.03)";
        ctx.fillRect(0, y, WIDTH, CELL);
        ctx.strokeStyle = "rgba(255,210,63,0.22)";
        ctx.lineWidth = 2;
        ctx.setLineDash([14, 12]);
        ctx.beginPath();
        ctx.moveTo(0, y + CELL / 2);
        ctx.lineTo(WIDTH, y + CELL / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        drawChevrons(ctx, y + CELL / 2, laneDir(r));
      } else {
        ctx.fillStyle = "rgba(61,220,151,0.10)";
        ctx.fillRect(0, y, WIDTH, CELL);
        ctx.strokeStyle = "rgba(61,220,151,0.30)";
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, y + 0.5, WIDTH - 1, CELL - 1);
        const label = r === 0 ? "" : r === ROWS - 1 ? "DEPOT" : "";
        if (label) {
          ctx.fillStyle = "rgba(61,220,151,0.45)";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(label, WIDTH / 2, y + CELL / 2 + 3);
        }
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, HEIGHT);
      ctx.stroke();
    }

    for (const h of state.hazards) drawHazard(ctx, h);
    for (const c of state.cars) drawCar(ctx, c);

    const blink = state.invuln > 0 && Math.floor(state.frame / 4) % 2 === 0;
    if (!blink) drawPlayer(ctx, state.player);

    drawHud(ctx, state);

    if (state.phase === "attract")
      banner(ctx, "TAP / ARROWS TO START", "clear the jams — keep the city moving");
    else if (state.phase === "won")
      banner(ctx, "CITY FLOWING — GRIDLOCK BEATEN", "tap reset to run it back");
    else if (state.phase === "gameover")
      banner(ctx, "GRIDLOCK — THE CITY SEIZED UP", "tap reset to try again");
  },
};

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawChevrons(ctx: CanvasRenderingContext2D, y: number, dir: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 2;
  for (let i = 1; i < COLS; i += 2) {
    const x = i * CELL + CELL / 2;
    ctx.beginPath();
    if (dir > 0) {
      ctx.moveTo(x - 4, y - 4);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x - 4, y + 4);
    } else {
      ctx.moveTo(x + 4, y - 4);
      ctx.lineTo(x - 4, y);
      ctx.lineTo(x + 4, y + 4);
    }
    ctx.stroke();
  }
}

function drawCar(ctx: CanvasRenderingContext2D, c: TrafficCar) {
  const h = CELL * 0.62;
  const top = c.row * CELL + (CELL - h) / 2;
  const left = c.x - c.w / 2;
  const stopped = Math.abs(c.v ?? 0) < MOVING;
  const rightward = c.vx > 0;
  // Moving cars read by direction (cyan → / amber ←); stopped cars glow red.
  const color = stopped ? "#FF2E4D" : rightward ? "#21D4FD" : "#FFB454";

  rrect(ctx, left, top, c.w, h, 7);
  ctx.fillStyle = stopped
    ? "rgba(255,46,77,0.16)"
    : rightward
      ? "rgba(33,212,253,0.12)"
      : "rgba(255,180,84,0.12)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Brake lights at the rear when queued.
  if (stopped) {
    ctx.fillStyle = "#FF2E4D";
    const rx = rightward ? left + 1 : left + c.w - 4;
    ctx.fillRect(rx, top + 4, 3, 3);
    ctx.fillRect(rx, top + h - 7, 3, 3);
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    const wx = rightward ? left + c.w * 0.62 : left + c.w * 0.38;
    ctx.beginPath();
    ctx.moveTo(wx, top + 3);
    ctx.lineTo(wx, top + h - 3);
    ctx.stroke();
  }
}

type HazardMeta = { color: string; icon: (ctx: CanvasRenderingContext2D) => void };

const HAZARD_META: Record<CityHazardType, HazardMeta> = {
  pothole: {
    color: "#21D4FD",
    icon: (ctx) => {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#21D4FD";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  construction: {
    color: "#FF6B35",
    icon: (ctx) => {
      ctx.strokeStyle = "#FF6B35";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(9, 10);
      ctx.lineTo(-9, 10);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();
    },
  },
  debris: {
    color: "#9AA7C7",
    icon: (ctx) => {
      ctx.strokeStyle = "#9AA7C7";
      ctx.lineWidth = 2;
      const rock = (ox: number, oy: number, s: number) => {
        ctx.beginPath();
        ctx.moveTo(ox - s, oy + s);
        ctx.lineTo(ox, oy - s);
        ctx.lineTo(ox + s, oy + s);
        ctx.closePath();
        ctx.stroke();
      };
      rock(-5, 3, 4);
      rock(6, 5, 3);
      rock(2, -3, 4);
    },
  },
  hydrant: {
    color: "#FF4D6D",
    icon: (ctx) => {
      ctx.strokeStyle = "#FF4D6D";
      ctx.lineWidth = 2;
      rrect(ctx, -5, -8, 10, 16, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(8, -2);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -12);
      ctx.stroke();
    },
  },
  signal: {
    color: "#FFD23F",
    icon: (ctx) => {
      ctx.strokeStyle = "#FFD23F";
      ctx.lineWidth = 1.5;
      rrect(ctx, -5, -12, 10, 24, 4);
      ctx.stroke();
      const lights: Array<[number, string]> = [
        [-7, "#FF4D6D"],
        [0, "#FFD23F"],
        [7, "#3DDC97"],
      ];
      for (const [oy, col] of lights) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(0, oy, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
};

function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function drawHazard(ctx: CanvasRenderingContext2D, h: CityHazard) {
  const cx = h.col * CELL + CELL / 2;
  const cy = h.row * CELL + CELL / 2;
  const s = easeOut(h.pop);
  const meta = HAZARD_META[h.type];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  rrect(ctx, -CELL / 2 + 4, -CELL / 2 + 4, CELL - 8, CELL - 8, 6);
  ctx.fillStyle = "rgba(255,46,77,0.10)";
  ctx.fill();
  ctx.strokeStyle = meta.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  meta.icon(ctx);
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: { col: number; row: number }) {
  const cx = p.col * CELL + CELL / 2;
  const cy = p.row * CELL + CELL / 2;
  rrect(ctx, cx - 13, cy - 13, 26, 26, 6);
  ctx.fillStyle = "rgba(255,107,53,0.22)";
  ctx.fill();
  ctx.strokeStyle = "#FF6B35";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = "#FFD23F";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx + 7, cy + 6);
  ctx.lineTo(cx - 7, cy + 6);
  ctx.closePath();
  ctx.stroke();
}

function drawHud(ctx: CanvasRenderingContext2D, state: FixTheCityState) {
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  // Repairs.
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(4, 4, 104, 16);
  ctx.strokeStyle = "rgba(255,210,63,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(4.5, 4.5, 103, 15);
  ctx.fillStyle = "#FFD23F";
  ctx.fillText(`REPAIRS ${state.fixed}/${state.quota}`, 10, 15);
  // Hits.
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(WIDTH - 74, 4, 70, 16);
  ctx.strokeStyle = "rgba(255,77,109,0.5)";
  ctx.strokeRect(WIDTH - 73.5, 4.5, 69, 15);
  ctx.fillStyle = "#FF4D6D";
  ctx.fillText(`HITS ${state.hits}`, WIDTH - 10, 15);
  ctx.textAlign = "left";

  // GRIDLOCK meter.
  const g = state.gridlock ?? 0;
  const bx = 4;
  const by = 24;
  const bw = WIDTH - 8;
  const bh = 12;
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(bx, by, bw, bh);
  const frac = g / GRIDLOCK_MAX;
  ctx.fillStyle = frac > 0.75 ? "#FF2E4D" : frac > 0.45 ? "#FF6B35" : "#3DDC97";
  ctx.fillRect(bx + 1, by + 1, (bw - 2) * frac, bh - 2);
  ctx.strokeStyle = "rgba(154,167,199,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = "#0B0E1A";
  ctx.font = "8px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`GRIDLOCK ${Math.round(g)}%`, bx + 5, by + bh - 3);
}

function banner(ctx: CanvasRenderingContext2D, text: string, sub?: string) {
  const y = HEIGHT / 2;
  ctx.fillStyle = "rgba(11,14,26,0.85)";
  ctx.fillRect(0, y - 26, WIDTH, sub ? 54 : 36);
  ctx.fillStyle = "#FFD23F";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, WIDTH / 2, y - 4);
  if (sub) {
    ctx.fillStyle = "#9AA7C7";
    ctx.font = "9px monospace";
    ctx.fillText(sub, WIDTH / 2, y + 14);
  }
  ctx.textAlign = "left";
}

export const FIX_THE_CITY_FLOW_DIMENSIONS = { width: WIDTH, height: HEIGHT };
