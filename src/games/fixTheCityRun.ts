import type { BaseGameState, CityHazardType, GameEngine } from "@/lib/types";

/**
 * "FIX THE CITY" — Mayor Runner (side-scroller).
 *
 * You ARE the Mayor, jogging down a multi-lane street. Potholes, debris, and
 * cones appear ahead in the lanes, and a car is rolling up behind each one.
 * Slide UP / DOWN into a hazard's lane and pause a beat to patch it BEFORE its
 * chaser car arrives. Beat the car and the lane flows; lose the race and the
 * car piles into the pothole — the lane snarls and the GRIDLOCK meter climbs.
 *
 *   • Win  — patch the whole shift's quota of hazards.
 *   • Lose — GRIDLOCK hits 100 (the city seizes up).
 *
 * The Mayor out-jogs the traffic, so being in the right lane in time wins the
 * race; dawdling (or juggling too many at once) loses it. No twitch death —
 * the pressure is the rolling deadline + the meter. Controls: UP / DOWN.
 *
 * Wireframe build — vectors only.
 */

/* ------------------------------------------------------------------ *
 * Tunables
 * ------------------------------------------------------------------ */
const WIDTH = 460;
const HEIGHT = 640;
const LANES = 5;
const ROAD_TOP = 188; // skyline sits above this
const ROAD_BOT = HEIGHT - 120; // sidewalk below this
const LANE_H = (ROAD_BOT - ROAD_TOP) / LANES;
const laneY = (lane: number) => ROAD_TOP + LANE_H * (lane + 0.5);

const PX = 120; // Mayor's fixed screen x
const RUN_SPEED = 130; // world px/sec the Mayor jogs
const SPRINT_SPEED = 220; // hold DASH to push forward and build a buffer
const CAR_SPEED = 125; // chaser speed — a tight race the Mayor just edges (DASH to pull ahead)
const CAR_ENTER = 34; // cars always enter this far off the left edge (never pop in)
const REACH = 26; // how close (world px) to a hazard to work on it
const REPAIR_TIME = 0.5; // seconds parked on a pothole to patch it
const LANE_EASE = 16; // how fast the sprite slides between lanes

const QUOTA = 14; // patches to finish the shift
const GRIDLOCK_MAX = 100;
const JAM_HIT = 13; // gridlock when a car piles into an unfixed hazard
const FIX_RELIEF = 2; // gridlock eased when you patch one in time
const DRAIN = 2.1; // gridlock bled off per second
const FIX_SCORE = 100;

const H_SPAWN_MIN = 1.05; // seconds between hazard spawns
const H_SPAWN_JITTER = 0.5;
const H_AHEAD_MIN = 360; // how far ahead (world px) hazards appear (just off-screen right)
const H_AHEAD_MAX = 560;
const CAR_W = 54;

const HAZARD_TYPES: CityHazardType[] = [
  "pothole",
  "construction",
  "debris",
  "hydrant",
  "signal",
];

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */
export interface RunHazard {
  id: number;
  worldX: number;
  lane: number;
  type: CityHazardType;
  fixed: boolean;
  pop: number;
}
export interface RunCar {
  hazId: number;
  worldX: number;
  lane: number;
  crashed: boolean;
}
export interface FixTheCityRunState extends BaseGameState {
  mayorX: number;
  lane: number;
  laneY: number; // eased visual lane
  hazards: RunHazard[];
  cars: RunCar[];
  quota: number;
  fixed: number;
  hits: number; // potholes lost to jams
  gridlock: number;
  repairId: number | null;
  repairT: number;
  boost: boolean; // DASH held → sprinting forward
  hSpawn: number;
  nextId: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randLane = () => Math.floor(Math.random() * LANES);
const pickType = () => HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)];

/** A hazard + its chaser car, or null if it would stack on an existing one. */
function spawnPair(
  s: { mayorX: number; hazards: RunHazard[]; nextId: number },
  pop: number,
): { hazard: RunHazard; car: RunCar } | null {
  const lane = randLane();
  const worldX = s.mayorX + rand(H_AHEAD_MIN, H_AHEAD_MAX);
  if (s.hazards.some((h) => h.lane === lane && Math.abs(h.worldX - worldX) < 130)) return null;
  const hazard: RunHazard = { id: s.nextId, worldX, lane, type: pickType(), fixed: false, pop };
  // The chaser always enters from off the left edge, never mid-screen.
  const car: RunCar = { hazId: s.nextId, worldX: s.mayorX - PX - CAR_ENTER, lane, crashed: false };
  return { hazard, car };
}

function startState(): FixTheCityRunState {
  const base = fixTheCityRun.init();
  let st = { ...base, phase: "playing" as const, mayorX: PX, hazards: [] as RunHazard[], cars: [] as RunCar[], nextId: 1 };
  // Seed a couple of jobs already rolling in.
  for (let i = 0; i < 2; i++) {
    const p = spawnPair(st, 1);
    if (p) st = { ...st, hazards: [...st.hazards, p.hazard], cars: [...st.cars, p.car], nextId: st.nextId + 1 };
  }
  return st;
}

/* ------------------------------------------------------------------ *
 * Engine
 * ------------------------------------------------------------------ */
export const fixTheCityRun: GameEngine<FixTheCityRunState> = {
  init(): FixTheCityRunState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: null,
      frame: 0,
      mayorX: PX,
      lane: 2,
      laneY: 2,
      hazards: [
        { id: 1, worldX: PX + 340, lane: 1, type: "pothole", fixed: false, pop: 1 },
        { id: 2, worldX: PX + 520, lane: 3, type: "construction", fixed: false, pop: 1 },
      ],
      cars: [
        { hazId: 1, worldX: PX - PX - CAR_ENTER, lane: 1, crashed: false },
        { hazId: 2, worldX: PX - PX - CAR_ENTER, lane: 3, crashed: false },
      ],
      quota: QUOTA,
      fixed: 0,
      hits: 0,
      gridlock: 0,
      repairId: null,
      repairT: 0,
      boost: false,
      hSpawn: 0.8,
      nextId: 3,
    };
  },

  handleInput(state, intent) {
    if (intent === "reset") return fixTheCityRun.init();
    const up = intent === "up";
    const down = intent === "down";
    if (state.phase !== "playing") {
      if (intent === "start" || up || down) {
        const fresh = startState();
        if (up) return { ...fresh, lane: Math.max(0, fresh.lane - 1) };
        if (down) return { ...fresh, lane: Math.min(LANES - 1, fresh.lane + 1) };
        return fresh;
      }
      return state;
    }
    if (up) return { ...state, lane: Math.max(0, state.lane - 1) };
    if (down) return { ...state, lane: Math.min(LANES - 1, state.lane + 1) };
    if (intent === "boost") return { ...state, boost: true };
    if (intent === "boostoff") return { ...state, boost: false };
    return state;
  },

  update(state, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const frame = state.frame + 1;
    if (state.phase !== "playing") return { ...state, frame };

    let {
      mayorX,
      lane,
      hazards,
      cars,
      fixed,
      hits,
      gridlock,
      repairId,
      repairT,
      hSpawn,
      nextId,
      score,
    } = state;

    hazards = hazards.map((h) => (h.pop < 1 ? { ...h, pop: Math.min(1, h.pop + dt / 0.18) } : h));
    const laneYv = state.laneY + (lane - state.laneY) * Math.min(1, LANE_EASE * dt);

    // Parked on a patchable hazard in my lane? (Not while sprinting — you blow
    // past potholes when you DASH, so they jam behind you.)
    const target = state.boost
      ? undefined
      : hazards.find(
          (h) =>
            !h.fixed &&
            h.lane === lane &&
            h.pop >= 1 &&
            Math.abs(h.worldX - mayorX) < REACH &&
            Math.abs(laneYv - lane) < 0.4,
        );

    if (target) {
      if (repairId !== target.id) {
        repairId = target.id;
        repairT = 0;
      }
      repairT += dt / REPAIR_TIME;
      if (repairT >= 1) {
        hazards = hazards.map((h) => (h.id === target.id ? { ...h, fixed: true } : h));
        fixed += 1;
        score += FIX_SCORE;
        gridlock = Math.max(0, gridlock - FIX_RELIEF);
        repairId = null;
        repairT = 0;
      }
      // Mayor holds position while working (no forward progress).
    } else {
      repairId = null;
      repairT = Math.max(0, repairT - (dt / REPAIR_TIME) * 2);
      mayorX += (state.boost ? SPRINT_SPEED : RUN_SPEED) * dt; // jog / sprint forward
    }
    const cam = mayorX - PX;

    // Chaser cars roll toward their potholes.
    const nextCars: RunCar[] = [];
    for (const c of cars) {
      if (c.crashed) {
        if (c.worldX > cam - 80) nextCars.push(c); // linger until off-screen left
        continue;
      }
      const haz = hazards.find((h) => h.id === c.hazId);
      const prevX = c.worldX;
      const newX = prevX + CAR_SPEED * dt;
      if (haz && !haz.fixed && prevX < haz.worldX && newX >= haz.worldX) {
        // Lost the race → the car piles into the pothole.
        gridlock = Math.min(GRIDLOCK_MAX, gridlock + JAM_HIT);
        hits += 1;
        hazards = hazards.filter((h) => h.id !== haz.id);
        nextCars.push({ ...c, worldX: haz.worldX, crashed: true });
        continue;
      }
      if (newX < mayorX + WIDTH) nextCars.push({ ...c, worldX: newX });
    }
    cars = nextCars;

    // A hazard that slips off the left edge unfixed also jams (you ran past it).
    const keptHaz: RunHazard[] = [];
    for (const h of hazards) {
      if (h.worldX < cam - 30) {
        if (!h.fixed) {
          gridlock = Math.min(GRIDLOCK_MAX, gridlock + JAM_HIT);
          hits += 1;
        }
        continue; // drop it
      }
      keptHaz.push(h);
    }
    hazards = keptHaz;

    // Spawn the next job.
    hSpawn -= dt;
    if (hSpawn <= 0) {
      const p = spawnPair({ mayorX, hazards, nextId }, 0);
      if (p) {
        hazards = [...hazards, p.hazard];
        cars = [...cars, p.car];
        nextId += 1;
      }
      hSpawn = H_SPAWN_MIN + Math.random() * H_SPAWN_JITTER;
    }

    gridlock = Math.max(0, gridlock - DRAIN * dt);
    score = Math.max(score, fixed * FIX_SCORE + Math.floor((mayorX - PX) / 24));

    let phase: FixTheCityRunState["phase"] = state.phase;
    if (fixed >= state.quota) phase = "won";
    else if (gridlock >= GRIDLOCK_MAX) phase = "gameover";

    return {
      ...state,
      frame,
      mayorX,
      lane,
      laneY: laneYv,
      hazards,
      cars,
      fixed,
      hits,
      gridlock,
      repairId,
      repairT,
      hSpawn,
      nextId,
      score,
      phase,
    };
  },

  render(ctx, state) {
    const cam = state.mayorX - PX;

    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(33,212,253,0.05)";
    ctx.fillRect(0, 0, WIDTH, ROAD_TOP);
    drawSkyline(ctx, cam);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, ROAD_TOP, WIDTH, ROAD_BOT - ROAD_TOP);
    ctx.fillStyle = "rgba(61,220,151,0.08)";
    ctx.fillRect(0, ROAD_BOT, WIDTH, HEIGHT - ROAD_BOT);
    ctx.strokeStyle = "rgba(61,220,151,0.30)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ROAD_TOP + 0.5);
    ctx.lineTo(WIDTH, ROAD_TOP + 0.5);
    ctx.stroke();
    drawSidewalk(ctx, cam);

    // Scrolling lane dividers convey motion.
    ctx.strokeStyle = "rgba(255,210,63,0.22)";
    ctx.lineWidth = 2;
    for (let l = 1; l < LANES; l++) {
      const y = ROAD_TOP + LANE_H * l;
      ctx.setLineDash([16, 14]);
      ctx.lineDashOffset = -(cam % 30);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    for (const c of state.cars) drawCar(ctx, c, cam);
    for (const h of state.hazards) drawHazard(ctx, h, cam);
    drawMayor(ctx, state);
    drawHud(ctx, state);

    if (state.phase === "attract")
      banner(ctx, "TAP / ▲ ▼ TO START", "patch potholes before the traffic hits them");
    else if (state.phase === "won")
      banner(ctx, "SHIFT COMPLETE — CITY MOVING", "tap reset to run it back");
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

function drawSkyline(ctx: CanvasRenderingContext2D, cam: number) {
  // Back row (slow parallax).
  ctx.strokeStyle = "rgba(154,167,199,0.12)";
  ctx.lineWidth = 1;
  let off = (cam * 0.25) % 74;
  for (let i = -1; i < WIDTH / 74 + 1; i++) {
    const x = i * 74 - off;
    const h = 70 + ((i * 53) % 6) * 12;
    ctx.strokeRect(x + 8, ROAD_TOP - h, 58, h);
  }
  // Front row (faster parallax + windows).
  ctx.strokeStyle = "rgba(154,167,199,0.22)";
  off = (cam * 0.5) % 62;
  for (let i = -1; i < WIDTH / 62 + 1; i++) {
    const x = i * 62 - off;
    const h = 44 + ((i * 37) % 5) * 10;
    ctx.strokeRect(x + 6, ROAD_TOP - h, 48, h);
    ctx.fillStyle = "rgba(255,210,63,0.10)";
    for (let wy = ROAD_TOP - h + 8; wy < ROAD_TOP - 8; wy += 14) {
      for (let wx = x + 12; wx < x + 46; wx += 12) ctx.fillRect(wx, wy, 5, 6);
    }
  }
}

function drawSidewalk(ctx: CanvasRenderingContext2D, cam: number) {
  // Curb.
  ctx.strokeStyle = "rgba(61,220,151,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ROAD_BOT + 1);
  ctx.lineTo(WIDTH, ROAD_BOT + 1);
  ctx.stroke();
  // Paving joints scroll with the street.
  ctx.strokeStyle = "rgba(61,220,151,0.16)";
  ctx.lineWidth = 1;
  const off = cam % 40;
  for (let x = -off; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, ROAD_BOT + 6);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  // A few onlookers cheering the Mayor on.
  ctx.fillStyle = "rgba(154,167,199,0.4)";
  const poff = (cam * 0.9) % 56;
  for (let x = -poff; x < WIDTH; x += 56) {
    const py = ROAD_BOT + 44;
    ctx.beginPath();
    ctx.arc(x + 20, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 16, py + 5, 8, 14);
  }
}

function drawCar(ctx: CanvasRenderingContext2D, c: RunCar, cam: number) {
  const sx = c.worldX - cam;
  if (sx < -CAR_W || sx > WIDTH + CAR_W) return;
  const h = LANE_H * 0.58;
  const top = laneY(c.lane) - h / 2;
  const left = sx - CAR_W / 2;
  const color = c.crashed ? "#FF2E4D" : "#FFB454";
  rrect(ctx, left, top, CAR_W, h, 7);
  ctx.fillStyle = c.crashed ? "rgba(255,46,77,0.18)" : "rgba(255,180,84,0.12)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(left + CAR_W - 4, top + 4, 3, 3);
  ctx.fillRect(left + CAR_W - 4, top + h - 7, 3, 3);
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

function drawHazard(ctx: CanvasRenderingContext2D, h: RunHazard, cam: number) {
  const sx = h.worldX - cam;
  if (sx < -30 || sx > WIDTH + 30) return;
  const cy = laneY(h.lane);
  const s = h.pop < 1 ? 1 - (1 - h.pop) * (1 - h.pop) : 1;
  ctx.save();
  ctx.translate(sx, cy);
  ctx.scale(s, s);
  const box = Math.min(LANE_H - 8, 34);
  rrect(ctx, -box / 2, -box / 2, box, box, 6);
  if (h.fixed) {
    ctx.fillStyle = "rgba(61,220,151,0.18)";
    ctx.fill();
    ctx.strokeStyle = "#3DDC97";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "#3DDC97";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-1, 5);
    ctx.lineTo(7, -5);
    ctx.stroke();
  } else {
    const meta = HAZARD_META[h.type];
    ctx.fillStyle = "rgba(255,46,77,0.10)";
    ctx.fill();
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    meta.icon(ctx);
  }
  ctx.restore();
}

function drawMayor(ctx: CanvasRenderingContext2D, state: FixTheCityRunState) {
  const cx = PX;
  const cy = laneY(state.laneY);
  const repairing = (state.repairT ?? 0) > 0;

  // Speed lines when dashing.
  if (state.boost) {
    ctx.strokeStyle = "rgba(255,210,63,0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const yy = cy - 8 + i * 8;
      const wob = ((state.frame * 6 + i * 13) % 18) - 9;
      ctx.beginPath();
      ctx.moveTo(cx - 16 - wob, yy);
      ctx.lineTo(cx - 30 - wob, yy);
      ctx.stroke();
    }
  }

  if (repairing) {
    ctx.strokeStyle = "rgba(61,220,151,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#3DDC97";
    ctx.beginPath();
    ctx.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (state.repairT ?? 0));
    ctx.stroke();
  }

  const bob = repairing ? 0 : Math.sin(state.frame * 0.4) * 2;
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.fillStyle = "rgba(255,107,53,0.22)";
  ctx.strokeStyle = "#FF6B35";
  ctx.lineWidth = 2.5;
  rrect(ctx, -7, -6, 14, 16, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -12, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#FFD23F";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.lineTo(6, -14);
  ctx.moveTo(-4, -14);
  ctx.arc(0, -14, 4, Math.PI, 0, true);
  ctx.stroke();
  ctx.strokeStyle = "#FF6B35";
  ctx.lineWidth = 2;
  const swing = repairing ? 0 : Math.sin(state.frame * 0.4) * 4;
  ctx.beginPath();
  ctx.moveTo(-2, 10);
  ctx.lineTo(-2 - swing, 18);
  ctx.moveTo(2, 10);
  ctx.lineTo(2 + swing, 18);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, state: FixTheCityRunState) {
  ctx.textAlign = "left";
  ctx.font = "10px monospace";
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(6, 6, 120, 17);
  ctx.strokeStyle = "rgba(255,210,63,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(6.5, 6.5, 119, 16);
  ctx.fillStyle = "#FFD23F";
  ctx.fillText(`PATCHED ${state.fixed}/${state.quota}`, 12, 18);

  const g = state.gridlock ?? 0;
  const bw = 150;
  const bx = WIDTH - bw - 6;
  const by = 6;
  const bh = 17;
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(bx, by, bw, bh);
  const frac = g / GRIDLOCK_MAX;
  ctx.fillStyle = frac > 0.75 ? "#FF2E4D" : frac > 0.45 ? "#FF6B35" : "#3DDC97";
  ctx.fillRect(bx + 1, by + 1, (bw - 2) * frac, bh - 2);
  ctx.strokeStyle = "rgba(154,167,199,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = "#0B0E1A";
  ctx.font = "9px monospace";
  ctx.fillText(`GRIDLOCK ${Math.round(g)}%`, bx + 6, by + 12);
}

function banner(ctx: CanvasRenderingContext2D, text: string, sub?: string) {
  const y = HEIGHT / 2;
  ctx.fillStyle = "rgba(11,14,26,0.85)";
  ctx.fillRect(0, y - 26, WIDTH, sub ? 54 : 36);
  ctx.fillStyle = "#FFD23F";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, WIDTH / 2, y - 4);
  if (sub) {
    ctx.fillStyle = "#9AA7C7";
    ctx.font = "10px monospace";
    ctx.fillText(sub, WIDTH / 2, y + 14);
  }
  ctx.textAlign = "left";
}

export const FIX_THE_CITY_RUN_DIMENSIONS = { width: WIDTH, height: HEIGHT };
