import type {
  CityHazard,
  CityHazardType,
  FixTheCityState,
  GameEngine,
  TrafficCar,
} from "@/lib/types";

/**
 * "FIX THE CITY" — a Frogger-style traffic-dodging repair sprint.
 *
 * Hop across lanes of moving traffic to reach infrastructure hazards
 * (potholes, cones, debris, hydrants, signals) and stand on each to patch
 * it. New jobs keep popping up (whack-a-mole) until the whole workload is
 * cleared — clear the quota to win. Get clipped by a car and you're knocked
 * back to the depot, briefly invulnerable, and down a few seconds. The clock
 * is the only true enemy; let it hit zero and gridlock wins.
 *
 * This is a WIREFRAME build: everything is drawn with vectors so the loop can
 * be validated before real art is dropped in. State is plain data; render
 * reads it.
 */

/* ------------------------------------------------------------------ *
 * Tunables — nudge these while validating difficulty.
 * ------------------------------------------------------------------ */
const CELL = 40;
const COLS = 14;
const ROWS = 9;
const WIDTH = COLS * CELL; // 560
const HEIGHT = ROWS * CELL; // 360

const START_COL = 7;
const START_ROW = 8; // depot (bottom safe row)

const START_TIME = 46; // seconds on the clock
const QUOTA = 12; // repairs required to win
const MAX_ACTIVE = 4; // hazards on the board at once
const INITIAL_HAZARDS = 3; // jobs already waiting at kickoff
const SPAWN_INTERVAL = 1.1; // seconds between pop-ups
const POP_TIME = 0.22; // hazard rise animation (seconds)
const FIX_SCORE = 25;
const TIME_BONUS = 5; // score per leftover second on win
const INVULN_TIME = 1.2; // seconds of blink after a hit
const HIT_PENALTY = 2; // seconds lost when a car clips you

/* Traffic lanes: which rows carry cars, and how fast / which way.
 * Rows 0 (sidewalk), 4 (median) and 8 (depot) are safe. */
const LANES: Array<{ row: number; dir: 1 | -1; speed: number; gap: number; w: number }> = [
  { row: 1, dir: 1, speed: 70, gap: 200, w: 62 },
  { row: 2, dir: -1, speed: 95, gap: 170, w: 54 },
  { row: 3, dir: 1, speed: 120, gap: 210, w: 70 },
  { row: 5, dir: -1, speed: 85, gap: 180, w: 58 },
  { row: 6, dir: 1, speed: 110, gap: 160, w: 50 },
  { row: 7, dir: -1, speed: 140, gap: 230, w: 66 },
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
 * World seeding
 * ------------------------------------------------------------------ */
function seedCars(): TrafficCar[] {
  const cars: TrafficCar[] = [];
  for (const L of LANES) {
    const n = Math.ceil(WIDTH / L.gap) + 1;
    for (let k = 0; k < n; k++) {
      // Stagger each lane so the traffic doesn't line up in a wall.
      const x = k * L.gap + ((L.row * 37) % L.gap);
      cars.push({ row: L.row, x, vx: L.dir * L.speed, w: L.w });
    }
  }
  return cars;
}

function pickType(): CityHazardType {
  return HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)];
}

/** Choose a free traffic-lane cell for a new hazard (never under the player). */
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

/** A live round: fresh traffic + a few jobs already waiting. */
function startState(): FixTheCityState {
  const base = fixTheCity.init();
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

/** A couple of demo jobs so the attract screen shows the concept. */
function demoHazards(): CityHazard[] {
  const spots: Array<[number, CityHazardType]> = [
    [2, "pothole"],
    [9, "construction"],
    [5, "debris"],
    [11, "hydrant"],
  ];
  const rows = [1, 3, 6, 7];
  return spots.map(([col, type], i) => ({ col, row: rows[i], type, pop: 1 }));
}

/* ------------------------------------------------------------------ *
 * Movement / fixing
 * ------------------------------------------------------------------ */
function applyMove(state: FixTheCityState, intent: string): FixTheCityState {
  let { col, row } = state.player;
  if (intent === "up") row = Math.max(0, row - 1);
  else if (intent === "down") row = Math.min(ROWS - 1, row + 1);
  else if (intent === "left") col = Math.max(0, col - 1);
  else if (intent === "right") col = Math.min(COLS - 1, col + 1);

  // Patch any hazard on the landing cell.
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

  const won = fixed >= state.quota;
  if (won) {
    score += Math.max(0, Math.ceil(state.timeLeft ?? 0)) * TIME_BONUS;
  }

  return {
    ...state,
    player: { col, row },
    hazards,
    score,
    fixed,
    phase: won ? "won" : state.phase,
  };
}

/* ------------------------------------------------------------------ *
 * Engine
 * ------------------------------------------------------------------ */
export const fixTheCity: GameEngine<FixTheCityState> = {
  init(): FixTheCityState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: START_TIME,
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
    };
  },

  handleInput(state, intent) {
    if (intent === "reset") return fixTheCity.init();

    const move =
      intent === "up" || intent === "down" || intent === "left" || intent === "right";

    // Tap the board or press any direction to begin (no Insert Coin).
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

    // Traffic always flows — keeps the attract screen alive.
    const cars = state.cars.map((c) => {
      let x = c.x + c.vx * dt;
      const half = c.w / 2;
      if (c.vx > 0 && x - half > WIDTH) x = -half;
      else if (c.vx < 0 && x + half < 0) x = WIDTH + half;
      return { ...c, x };
    });

    if (state.phase !== "playing") return { ...state, frame, cars };

    // Advance pop-in animations.
    let hazards = state.hazards.map((h) =>
      h.pop < 1 ? { ...h, pop: Math.min(1, h.pop + dt / POP_TIME) } : h,
    );

    // Whack-a-mole: refill the board up to the cap, but never past the
    // remaining workload (so the board empties exactly as you win).
    let spawnTimer = state.spawnTimer - dt;
    const cap = Math.min(MAX_ACTIVE, state.quota - state.fixed);
    if (spawnTimer <= 0 && hazards.length < cap) {
      const cell = pickSpawnCell(hazards, state.player);
      if (cell) hazards = [...hazards, { ...cell, type: pickType(), pop: 0 }];
      spawnTimer = SPAWN_INTERVAL;
    }

    // Traffic collision → knock back to the depot, cost time, go invulnerable.
    let { col, row } = state.player;
    let invuln = Math.max(0, state.invuln - dt);
    let hits = state.hits;
    let timeLeft = (state.timeLeft ?? 0) - dt;
    if (invuln <= 0) {
      const pcx = col * CELL + CELL / 2;
      const struck = cars.some(
        (c) => c.row === row && Math.abs(c.x - pcx) < c.w / 2 + CELL * 0.34,
      );
      if (struck) {
        hits += 1;
        invuln = INVULN_TIME;
        timeLeft -= HIT_PENALTY;
        col = START_COL;
        row = START_ROW;
      }
    }

    const phase = timeLeft <= 0 ? "gameover" : state.phase;
    return {
      ...state,
      frame,
      cars,
      hazards,
      spawnTimer,
      player: { col, row },
      invuln,
      hits,
      timeLeft: Math.max(0, timeLeft),
      phase,
    };
  },

  render(ctx, state) {
    // Backdrop.
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Lanes.
    for (let r = 0; r < ROWS; r++) {
      const y = r * CELL;
      if (isRoad(r)) {
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        ctx.fillRect(0, y, WIDTH, CELL);
        // Dashed centre line.
        ctx.strokeStyle = "rgba(255,210,63,0.25)";
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
        const label = r === 0 ? "SIDEWALK" : r === 4 ? "MEDIAN" : "DEPOT";
        ctx.fillStyle = "rgba(61,220,151,0.45)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, WIDTH / 2, y + CELL / 2 + 3);
      }
    }

    // Faint column ticks.
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

    // Player — blink while invulnerable.
    const blink = state.invuln > 0 && Math.floor(state.frame / 4) % 2 === 0;
    if (!blink) drawPlayer(ctx, state.player);

    drawStatus(ctx, state);

    if (state.phase === "attract")
      banner(ctx, "TAP / ARROWS TO START", "patch every hazard · dodge the cars");
    else if (state.phase === "won")
      banner(ctx, "CITY FIXED — GRIDLOCK DEFEATED", "tap reset to run it back");
    else if (state.phase === "gameover")
      banner(ctx, "OUT OF TIME — GRIDLOCK WINS", "tap reset to try again");
  },
};

/* ------------------------------------------------------------------ *
 * Wireframe drawing helpers
 * ------------------------------------------------------------------ */
function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
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
  const rightward = c.vx > 0;
  const color = rightward ? "#21D4FD" : "#FFB454";

  rrect(ctx, left, top, c.w, h, 7);
  ctx.fillStyle = rightward ? "rgba(33,212,253,0.14)" : "rgba(255,180,84,0.14)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Windshield divider hints at travel direction.
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  const wx = rightward ? left + c.w * 0.62 : left + c.w * 0.38;
  ctx.beginPath();
  ctx.moveTo(wx, top + 3);
  ctx.lineTo(wx, top + h - 3);
  ctx.stroke();

  // Headlights on the leading edge.
  ctx.fillStyle = color;
  const hx = rightward ? left + c.w - 4 : left + 1;
  ctx.fillRect(hx, top + 4, 3, 3);
  ctx.fillRect(hx, top + h - 7, 3, 3);
}

type HazardMeta = { color: string; fill: string; icon: (ctx: CanvasRenderingContext2D) => void };

const HAZARD_META: Record<CityHazardType, HazardMeta> = {
  pothole: {
    color: "#21D4FD",
    fill: "rgba(33,212,253,0.10)",
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
    fill: "rgba(255,107,53,0.10)",
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
    color: "#9AA7BD",
    fill: "rgba(154,167,189,0.10)",
    icon: (ctx) => {
      ctx.strokeStyle = "#9AA7BD";
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
    fill: "rgba(255,77,109,0.10)",
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
    fill: "rgba(255,210,63,0.10)",
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
  ctx.fillStyle = meta.fill;
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

function drawStatus(ctx: CanvasRenderingContext2D, state: FixTheCityState) {
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  // Repairs remaining.
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(4, 4, 104, 16);
  ctx.strokeStyle = "rgba(255,210,63,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(4.5, 4.5, 103, 15);
  ctx.fillStyle = "#FFD23F";
  ctx.fillText(`REPAIRS ${state.fixed}/${state.quota}`, 10, 15);

  // Hit tally.
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(WIDTH - 84, 4, 80, 16);
  ctx.strokeStyle = "rgba(255,77,109,0.5)";
  ctx.strokeRect(WIDTH - 83.5, 4.5, 79, 15);
  ctx.fillStyle = "#FF4D6D";
  ctx.fillText(`HITS ${state.hits}`, WIDTH - 10, 15);
  ctx.textAlign = "left";
}

function banner(ctx: CanvasRenderingContext2D, text: string, sub?: string) {
  const y = HEIGHT / 2;
  ctx.fillStyle = "rgba(11,14,26,0.85)";
  ctx.fillRect(0, y - 26, WIDTH, sub ? 54 : 36);
  ctx.fillStyle = "#FFD23F";
  ctx.font = "13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, WIDTH / 2, y - 4);
  if (sub) {
    ctx.fillStyle = "#9AA7BD";
    ctx.font = "9px monospace";
    ctx.fillText(sub, WIDTH / 2, y + 14);
  }
  ctx.textAlign = "left";
}

export const FIX_THE_CITY_DIMENSIONS = { width: WIDTH, height: HEIGHT };
