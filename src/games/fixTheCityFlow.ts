import type {
  CityHazard,
  CityHazardType,
  FixTheCityState,
  GameEngine,
  TrafficCar,
} from "@/lib/types";

/**
 * "FIX THE CITY" — Traffic-Flow variant (v2: non-lethal triage).
 *
 * The city is a stack of one-way streets. A hazard (pothole, cone, debris,
 * hydrant, dead signal) blocks its lane and the cars pile up behind it, so the
 * lane STOPS. Every jam pumps the city-wide GRIDLOCK meter — worse the longer
 * the queue. Your repair crew roams the grid, parks on a jam, and holds a beat
 * to clear it; the freed traffic then eases back up to speed.
 *
 *   • Win  — clear the whole repair quota (the city keeps moving).
 *   • Lose — GRIDLOCK hits 100 (the city seizes up).
 *
 * Cars are NOT lethal. Crossing a moving lane at the wrong moment just makes
 * the crew stumble (a brief stall) — never a death. Repairs happen on the jam
 * itself, where the queued cars are already stopped, so nothing runs you over.
 *
 * Wireframe build — vectors only. Selectable via `?mode=flow`.
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
const MAX_ACTIVE = 4; // simultaneous jams
const INITIAL_HAZARDS = 3;
const SPAWN_INTERVAL = 1.4; // seconds between new jams
const POP_TIME = 0.22;
const REPAIR_TIME = 0.65; // seconds parked on a jam to clear it

const GRIDLOCK_MAX = 100;
const PUMP_BASE = 2.0; // gridlock/sec per active jam
const PUMP_PER_QUEUED = 0.7; // extra gridlock/sec per stopped car behind it
const PUMP_CAP = 6; // max gridlock/sec any single jam can pump
const DRAIN = 4.2; // gridlock/sec bled off constantly

const FIX_SCORE = 25;
const CLEAR_BONUS = 3; // score per point of gridlock headroom on win
const STUN_TIME = 0.35; // movement stall after a car bump
const MOVING = 22; // px/sec above which a car counts as "moving"

/* Traffic dynamics. */
const ACCEL = 130; // px/sec² — how fast cars speed up (gentle release)
const DECEL = 280; // px/sec² — how fast they brake
const STOP_GAP = 5; // standstill bumper gap (px)
const SLOW_ZONE = 58; // px over which a car eases from stop → free-flow
const HAZARD_CLEAR = CELL * 0.42; // how far ahead of the jam cars stop
const SEED_SPACING = 150;
const SPAWN_SPACING = 120;

/* Lanes: rows carrying one-way traffic + their free-flow speed. */
const LANES: Array<{ row: number; dir: 1 | -1; speed: number; w: number }> = [
  { row: 1, dir: 1, speed: 64, w: 58 },
  { row: 2, dir: -1, speed: 78, w: 52 },
  { row: 4, dir: 1, speed: 70, w: 62 },
  { row: 5, dir: -1, speed: 86, w: 50 },
  { row: 7, dir: 1, speed: 62, w: 60 },
  { row: 8, dir: -1, speed: 82, w: 54 },
  { row: 10, dir: 1, speed: 72, w: 56 },
  { row: 11, dir: -1, speed: 90, w: 64 },
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

/* ------------------------------------------------------------------ *
 * Traffic
 * ------------------------------------------------------------------ */
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
 * One frame of car-following with acceleration: each car eases toward its
 * lane's free-flow speed, braking for the car (or hazard) ahead and queueing
 * behind a jam. When the jam clears, the queue accelerates back up smoothly —
 * no instant surge.
 */
function stepTraffic(
  cars: TrafficCar[],
  hazards: CityHazard[],
  dt: number,
): TrafficCar[] {
  const out: TrafficCar[] = [];
  for (const L of LANES) {
    const dir = L.dir;
    const T = (x: number) => x * dir;
    const laneCars = cars.filter((c) => c.row === L.row);
    const haz = hazards.find((h) => h.row === L.row);
    const tHaz = haz ? T(haz.col * CELL + CELL / 2) : null;

    laneCars.sort((a, b) => T(b.x) - T(a.x)); // front (largest t) first
    let aheadT = Infinity;
    let aheadW = 0;
    for (const c of laneCars) {
      const t = T(c.x);
      const gapAhead =
        aheadT === Infinity ? Infinity : aheadT - t - (c.w / 2 + aheadW / 2);
      const gapHaz =
        tHaz !== null && t < tHaz ? tHaz - t - (c.w / 2 + HAZARD_CLEAR) : Infinity;
      const gap = Math.min(gapAhead, gapHaz);

      const target =
        gap <= STOP_GAP
          ? 0
          : Math.min(L.speed, (L.speed * (gap - STOP_GAP)) / SLOW_ZONE);
      let v = c.v ?? L.speed;
      v += Math.max(-DECEL * dt, Math.min(ACCEL * dt, target - v));
      v = Math.max(0, v);
      const adv = Math.min(v * dt, Math.max(0, gap - STOP_GAP));
      const nt = t + adv;

      c.v = v;
      c.x = nt * dir;
      c.vx = dir * L.speed;
      aheadT = nt;
      aheadW = c.w;
    }

    let minT = Infinity;
    for (const c of laneCars) {
      const exited = dir > 0 ? c.x > WIDTH + c.w : c.x < -c.w;
      if (exited) continue;
      out.push(c);
      minT = Math.min(minT, T(c.x));
    }
    const entranceT = dir > 0 ? -L.w / 2 : T(WIDTH + L.w / 2);
    const laneCount = out.filter((c) => c.row === L.row).length;
    if ((minT === Infinity || minT - entranceT > L.w + SPAWN_SPACING) && laneCount < COLS + 2) {
      out.push({ row: L.row, x: entranceT * dir, vx: dir * L.speed, w: L.w, v: L.speed });
    }
  }
  return out;
}

/** Cars stopped behind a given hazard (drives its gridlock weight). */
function queueLen(cars: TrafficCar[], h: CityHazard): number {
  const dir = laneDir(h.row);
  const tHaz = (h.col * CELL + CELL / 2) * dir;
  let n = 0;
  for (const c of cars) {
    if (c.row !== h.row) continue;
    if (Math.abs(c.v ?? 0) >= MOVING) continue;
    if (c.x * dir < tHaz) n++;
  }
  return n;
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
  return {
    ...base,
    phase: "playing",
    cars: seedCars(),
    hazards,
    spawnTimer: SPAWN_INTERVAL,
  };
}

function demoHazards(): CityHazard[] {
  const spots: Array<[number, number, CityHazardType]> = [
    [3, 2, "construction"],
    [6, 8, "pothole"],
  ];
  return spots.map(([col, row, type]) => ({ col, row, type, pop: 1 }));
}

function applyMove(state: FixTheCityState, intent: string): FixTheCityState {
  if ((state.stun ?? 0) > 0) return state; // stalled from a bump
  let { col, row } = state.player;
  if (intent === "up") row = Math.max(0, row - 1);
  else if (intent === "down") row = Math.min(ROWS - 1, row + 1);
  else if (intent === "left") col = Math.max(0, col - 1);
  else if (intent === "right") col = Math.min(COLS - 1, col + 1);
  // Moving abandons the current repair.
  return { ...state, player: { col, row }, repairT: 0 };
}

/* ------------------------------------------------------------------ *
 * Engine
 * ------------------------------------------------------------------ */
export const fixTheCityFlow: GameEngine<FixTheCityState> = {
  init(): FixTheCityState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: null,
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
      repairT: 0,
      stun: 0,
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

    const { col, row } = state.player;
    let stun = Math.max(0, (state.stun ?? 0) - dt);
    let hits = state.hits;
    let repairT = state.repairT ?? 0;
    let fixed = state.fixed;
    let score = state.score;

    // Non-lethal bump: a moving car sharing the crew's cell → brief stumble.
    if (stun <= 0) {
      const pcx = col * CELL + CELL / 2;
      const bumped = cars.some(
        (c) =>
          c.row === row &&
          Math.abs(c.v ?? 0) > MOVING &&
          Math.abs(c.x - pcx) < c.w / 2 + CELL * 0.3,
      );
      if (bumped) {
        stun = STUN_TIME;
        hits += 1;
        repairT = 0;
      }
    }

    // Repair: parking on a jam fills the ring; finishing clears it.
    if (stun <= 0) {
      const onHaz = hazards.find((h) => h.col === col && h.row === row && h.pop >= 1);
      if (onHaz) {
        repairT += dt / REPAIR_TIME;
        if (repairT >= 1) {
          hazards = hazards.filter((h) => h !== onHaz);
          fixed += 1;
          score += FIX_SCORE;
          repairT = 0;
        }
      } else {
        repairT = Math.max(0, repairT - (dt / REPAIR_TIME) * 2);
      }
    }

    // Gridlock: each jam pumps, weighted by how backed-up it is.
    let pump = 0;
    for (const h of hazards) {
      pump += Math.min(PUMP_CAP, PUMP_BASE + PUMP_PER_QUEUED * queueLen(cars, h));
    }
    let gridlock = Math.max(
      0,
      Math.min(GRIDLOCK_MAX, (state.gridlock ?? 0) + (pump - DRAIN) * dt),
    );

    let phase: FixTheCityState["phase"] = state.phase;
    if (fixed >= state.quota) {
      score += Math.round((GRIDLOCK_MAX - gridlock) * CLEAR_BONUS);
      phase = "won";
    } else if (gridlock >= GRIDLOCK_MAX) {
      phase = "gameover";
    }

    return {
      ...state,
      frame,
      cars,
      hazards,
      spawnTimer,
      gridlock,
      repairT,
      stun,
      hits,
      fixed,
      score,
      phase,
    };
  },

  render(ctx, state) {
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let r = 0; r < ROWS; r++) {
      const y = r * CELL;
      if (isRoad(r)) {
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
        const label = r === ROWS - 1 ? "DEPOT" : "";
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

    drawPlayer(ctx, state);
    drawHud(ctx, state);

    if (state.phase === "attract")
      banner(ctx, "TAP / ARROWS TO START", "park on a jam & hold to clear it");
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

function drawPlayer(ctx: CanvasRenderingContext2D, state: FixTheCityState) {
  const p = state.player;
  const cx = p.col * CELL + CELL / 2;
  const cy = p.row * CELL + CELL / 2;
  const stunned = (state.stun ?? 0) > 0;

  // Repair progress ring.
  const rt = state.repairT ?? 0;
  if (rt > 0) {
    ctx.strokeStyle = "rgba(61,220,151,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#3DDC97";
    ctx.beginPath();
    ctx.arc(cx, cy, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rt);
    ctx.stroke();
  }

  rrect(ctx, cx - 13, cy - 13, 26, 26, 6);
  ctx.fillStyle = stunned ? "rgba(255,210,63,0.25)" : "rgba(255,107,53,0.22)";
  ctx.fill();
  ctx.strokeStyle = stunned ? "#FFD23F" : "#FF6B35";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hard-hat mark.
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
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(4, 4, 104, 16);
  ctx.strokeStyle = "rgba(255,210,63,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(4.5, 4.5, 103, 15);
  ctx.fillStyle = "#FFD23F";
  ctx.fillText(`REPAIRS ${state.fixed}/${state.quota}`, 10, 15);

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
