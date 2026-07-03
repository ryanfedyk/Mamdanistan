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
 * Rendered with the pixel-art sprite set in /public/sprites/ftc (Mayor
 * run/clean/idle cycles, pothole/debris/cone obstacles, vehicle chasers, and
 * road / sidewalk / skyline tiles), with vector fallbacks until they load.
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
const ZIP_SPEED = 340; // once its pothole is patched, a car floors it and zips off-screen
const CAR_ACCEL = 520; // how fast a car speeds up toward its target
const CAR_BRAKE = 900; // how fast it sheds speed to keep a gap
const CAR_GAP = 58; // min world-px spacing so cars queue instead of overlapping
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

/* Difficulty tiers. Level 2 sends the traffic faster, spawns jobs quicker,
 * lengthens the shift, and lets gridlock linger — a real second gear. */
interface Difficulty {
  carSpeed: number;
  spawnMin: number;
  jamHit: number;
  drain: number;
  quota: number;
}
const LEVELS: Record<number, Difficulty> = {
  1: { carSpeed: CAR_SPEED, spawnMin: 1.05, jamHit: JAM_HIT, drain: DRAIN, quota: QUOTA },
  2: { carSpeed: 152, spawnMin: 0.82, jamHit: 16, drain: 1.6, quota: 20 },
};
export const MAX_LEVEL = 2;
const diff = (level: number): Difficulty => LEVELS[level] ?? LEVELS[1];

const H_SPAWN_MIN = 1.05; // seconds between hazard spawns
const H_SPAWN_JITTER = 0.5;
const H_AHEAD_MIN = 360; // how far ahead (world px) hazards appear (just off-screen right)
const H_AHEAD_MAX = 560;
const CAR_W = 54;

// Spawn mix — cones are frequent (they're an instant grab, so they add action
// without piling on difficulty); potholes/debris/crumbles are the real work.
const HAZARD_WEIGHTS: Array<[CityHazardType, number]> = [
  ["construction", 42], // traffic cone — grabbed instantly
  ["pothole", 26],
  ["debris", 14],
  ["hydrant", 9], // crumbling asphalt
  ["signal", 9], // large pothole
];
const HAZARD_WEIGHT_TOTAL = HAZARD_WEIGHTS.reduce((s, [, w]) => s + w, 0);

// Cleaning frames split into two tools. Only right-facing poses are used so the
// Mayor never mirror-flips mid-repair (clean_0/1/4 face left; 2/3/5 face right,
// matching the run cycle). The shovel has a single right-facing pose, so it gets
// a small code-driven dig bob (see drawMayor) instead of a frame cycle.
const SHOVEL_FRAMES = [3]; // gray-shovel dig, facing right
const JACK_FRAMES = [2, 5]; // yellow-jackhammer buck, both facing right

/* ------------------------------------------------------------------ *
 * Sprite loading (browser-only; vectors draw until an image is ready)
 * ------------------------------------------------------------------ */
interface Sprite {
  img: HTMLImageElement | null;
  ready: boolean;
}
const SPRITE_BASE = "/sprites/ftc/";
function loadSprite(name: string): Sprite {
  const sp: Sprite = { img: null, ready: false };
  if (typeof window !== "undefined") {
    const img = new Image();
    img.onload = () => {
      sp.ready = true;
    };
    img.src = `${SPRITE_BASE}${name}.png`;
    sp.img = img;
  }
  return sp;
}
const loadSet = (base: string, n: number) =>
  Array.from({ length: n }, (_, i) => loadSprite(`${base}${i}`));

const SPR = {
  run: loadSet("mayor_run_", 8),
  clean: loadSet("mayor_clean_", 6),
  idle: loadSprite("mayor_idle"),
  road: loadSprite("tile_road"),
  sidewalk: loadSprite("tile_sidewalk"),
  skyline: loadSprite("tile_skyline"),
  potholes: [loadSprite("pothole_sm"), loadSprite("pothole_md"), loadSprite("pothole_lg")],
  crumble: loadSprite("crumble"),
  debris: loadSprite("debris"),
  cone: loadSprite("cone"),
  vehicles: [
    loadSprite("car_red"),
    loadSprite("car_blue"),
    loadSprite("car_yellow"),
    loadSprite("pickup"),
    loadSprite("truck"),
  ],
};

/** The obstacle sprite a given hazard shows (potholes vary by id for texture). */
function hazardSprite(h: RunHazard): Sprite {
  switch (h.type) {
    case "construction":
      return SPR.cone;
    case "debris":
      return SPR.debris;
    case "hydrant":
      return SPR.crumble;
    case "signal":
      return SPR.potholes[2];
    default:
      return SPR.potholes[h.id % 2]; // sm / md
  }
}

/** Draw a sprite scaled to a target height, centred at (cx, cy). Returns false
 *  if the image isn't loaded yet so the caller can fall back to vectors. */
function blit(
  ctx: CanvasRenderingContext2D,
  sp: Sprite,
  cx: number,
  cy: number,
  targetH: number,
  opts: { anchorBottom?: boolean; flip?: boolean; alpha?: number } = {},
): boolean {
  if (!sp.ready || !sp.img) return false;
  const img = sp.img;
  const scale = targetH / img.height;
  const w = img.width * scale;
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.translate(cx, cy);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, opts.anchorBottom ? -targetH : -targetH / 2, w, targetH);
  ctx.restore();
  return true;
}

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
  speed: number; // current world px/sec (eases toward cruise / zip)
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
  level: number; // 1 = first shift, 2 = harder
  carSpeed: number; // difficulty-scaled tunables for this run
  spawnMin: number;
  jamHit: number;
  drain: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randLane = () => Math.floor(Math.random() * LANES);
function pickType(): CityHazardType {
  let r = Math.random() * HAZARD_WEIGHT_TOTAL;
  for (const [type, w] of HAZARD_WEIGHTS) {
    if ((r -= w) < 0) return type;
  }
  return "pothole";
}

/** Which cleaning animation a hazard uses (cones are instant, so never here). */
function cleaningTool(h: RunHazard): "shovel" | "jack" {
  if (h.type === "debris") return "shovel"; // sweep up the rubble pile
  return h.id % 2 === 0 ? "shovel" : "jack"; // potholes: mix the two
}

/** A hazard + its chaser car, or null if it would stack on an existing one. */
function spawnPair(
  s: { mayorX: number; hazards: RunHazard[]; nextId: number; carSpeed: number },
  pop: number,
): { hazard: RunHazard; car: RunCar } | null {
  const lane = randLane();
  const worldX = s.mayorX + rand(H_AHEAD_MIN, H_AHEAD_MAX);
  if (s.hazards.some((h) => h.lane === lane && Math.abs(h.worldX - worldX) < 130)) return null;
  const hazard: RunHazard = { id: s.nextId, worldX, lane, type: pickType(), fixed: false, pop };
  // The chaser always enters from off the left edge, never mid-screen.
  const car: RunCar = {
    hazId: s.nextId,
    worldX: s.mayorX - PX - CAR_ENTER,
    lane,
    crashed: false,
    speed: s.carSpeed,
  };
  return { hazard, car };
}

function startState(level: number): FixTheCityRunState {
  const d = diff(level);
  const base = fixTheCityRun.init();
  let st: FixTheCityRunState = {
    ...base,
    phase: "playing" as const,
    mayorX: PX,
    hazards: [],
    cars: [],
    nextId: 1,
    level,
    quota: d.quota,
    carSpeed: d.carSpeed,
    spawnMin: d.spawnMin,
    jamHit: d.jamHit,
    drain: d.drain,
  };
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
        { hazId: 1, worldX: PX - PX - CAR_ENTER, lane: 1, crashed: false, speed: CAR_SPEED },
        { hazId: 2, worldX: PX - PX - CAR_ENTER, lane: 3, crashed: false, speed: CAR_SPEED },
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
      level: 1,
      carSpeed: CAR_SPEED,
      spawnMin: H_SPAWN_MIN,
      jamHit: JAM_HIT,
      drain: DRAIN,
    };
  },

  handleInput(state, intent) {
    if (intent === "reset") return fixTheCityRun.init();
    const up = intent === "up";
    const down = intent === "down";
    // Start a specific level (e.g. "level:2"); the "next" button advances a tier.
    if (intent.startsWith("level:")) return startState(Number(intent.slice(6)) || 1);
    if (intent === "next")
      return state.phase === "won"
        ? startState(Math.min(MAX_LEVEL, state.level + 1))
        : state;
    if (state.phase !== "playing") {
      if (intent === "start" || up || down) {
        const fresh = startState(1);
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

    // Cones are grabbed instantly on contact — no dig, and even mid-dash.
    hazards = hazards.map((h) => {
      if (
        !h.fixed &&
        h.type === "construction" &&
        h.lane === lane &&
        h.pop >= 1 &&
        Math.abs(h.worldX - mayorX) < REACH &&
        Math.abs(laneYv - lane) < 0.5
      ) {
        fixed += 1;
        score += FIX_SCORE;
        gridlock = Math.max(0, gridlock - FIX_RELIEF);
        return { ...h, fixed: true };
      }
      return h;
    });

    // Parked on a patchable hazard in my lane? (Cones are instant above; you
    // also blow past dig jobs while sprinting, so they jam behind you.)
    const target = state.boost
      ? undefined
      : hazards.find(
          (h) =>
            !h.fixed &&
            h.type !== "construction" &&
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

    // Chaser cars roll toward their potholes, keep a gap so they queue instead
    // of overlapping, and floor it (zip off-screen) once their pothole is gone.
    const nextCars: RunCar[] = [];
    for (const c of cars) {
      if (c.crashed) {
        if (c.worldX > cam - 90) nextCars.push(c); // pile lingers until off-screen left
        continue;
      }
      const haz = hazards.find((h) => h.id === c.hazId);
      const chasing = !!haz && !haz.fixed;

      // Cruise toward the pothole; once it's patched (or never ours), zip.
      let goal = chasing ? state.carSpeed : ZIP_SPEED;

      // Don't rear-end the nearest car/pile ahead in the same lane.
      let lead = Infinity;
      for (const o of cars) {
        if (o === c || o.lane !== c.lane) continue;
        const d = o.worldX - c.worldX;
        if (d > 0 && d < lead) lead = d;
      }
      if (lead < CAR_GAP) goal = 0;
      else if (lead < CAR_GAP * 2) goal = Math.min(goal, state.carSpeed * 0.85);

      const rate = goal >= c.speed ? CAR_ACCEL : CAR_BRAKE;
      const speed = c.speed + Math.max(-rate * dt, Math.min(rate * dt, goal - c.speed));
      const prevX = c.worldX;
      const newX = prevX + speed * dt;

      if (chasing && prevX < haz!.worldX && newX >= haz!.worldX) {
        // Lost the race → the car piles into the pothole.
        gridlock = Math.min(GRIDLOCK_MAX, gridlock + state.jamHit);
        hits += 1;
        hazards = hazards.filter((h) => h.id !== haz!.id);
        nextCars.push({ ...c, worldX: haz!.worldX, crashed: true, speed: 0 });
        continue;
      }
      // Keep until it has zipped a little past the right edge.
      if (newX - cam < WIDTH + 90) nextCars.push({ ...c, worldX: newX, speed });
    }
    cars = nextCars;

    // A hazard that slips off the left edge unfixed also jams (you ran past it).
    const keptHaz: RunHazard[] = [];
    for (const h of hazards) {
      if (h.worldX < cam - 30) {
        if (!h.fixed) {
          gridlock = Math.min(GRIDLOCK_MAX, gridlock + state.jamHit);
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
      const p = spawnPair({ mayorX, hazards, nextId, carSpeed: state.carSpeed }, 0);
      if (p) {
        hazards = [...hazards, p.hazard];
        cars = [...cars, p.car];
        nextId += 1;
      }
      hSpawn = state.spawnMin + Math.random() * H_SPAWN_JITTER;
    }

    gridlock = Math.max(0, gridlock - state.drain * dt);
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

    drawBackground(ctx, cam);

    for (const c of state.cars) drawCar(ctx, c, cam);
    for (const h of state.hazards) drawHazard(ctx, h, cam);
    drawMayor(ctx, state);
    drawHud(ctx, state);

    if (state.phase === "attract")
      banner(ctx, "TAP / ▲ ▼ TO START", "patch potholes before the traffic hits them");
    else if (state.phase === "won")
      banner(
        ctx,
        state.level < MAX_LEVEL ? `SHIFT ${state.level} COMPLETE` : "ALL SHIFTS CLEARED",
        state.level < MAX_LEVEL ? "on to a harder shift" : "the city runs like clockwork",
      );
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

/** Tile a texture across a rectangle, scrolling horizontally with the camera. */
function tileRegion(
  ctx: CanvasRenderingContext2D,
  sp: Sprite,
  x0: number,
  y0: number,
  w: number,
  h: number,
  cam: number,
  tile: number,
  parallax = 1,
): boolean {
  if (!sp.ready || !sp.img) return false;
  const img = sp.img;
  const th = tile;
  const tw = img.width * (tile / img.height);
  let ox = (cam * parallax) % tw;
  if (ox < 0) ox += tw;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  // Base tile index so the flip pattern stays stable as the road scrolls.
  const baseCol = Math.floor((cam * parallax) / tw);
  let row = 0;
  for (let y = y0; y < y0 + h; y += th, row++) {
    let col = baseCol;
    for (let x = x0 - ox; x < x0 + w; x += tw, col++) {
      // Mirror alternate tiles so the texture doesn't read as a regular grid.
      const fx = (row + col) % 2 === 0 ? 1 : -1;
      ctx.save();
      ctx.translate(x + tw / 2, y + th / 2);
      ctx.scale(fx, 1);
      ctx.drawImage(img, -tw / 2, -th / 2, tw, th);
      ctx.restore();
    }
  }
  ctx.restore();
  return true;
}

/** Parallax skyline from the sprite (far + near passes); false ⇒ use vectors. */
function drawSkylineSprite(ctx: CanvasRenderingContext2D, cam: number): boolean {
  const sp = SPR.skyline;
  if (!sp.ready || !sp.img) return false;
  const img = sp.img;
  const pass = (h: number, par: number, alpha: number) => {
    const tw = img.width * (h / img.height);
    let off = (cam * par) % tw;
    if (off < 0) off += tw;
    ctx.globalAlpha = alpha;
    for (let x = -off; x < WIDTH; x += tw) ctx.drawImage(img, x, ROAD_TOP - h, tw, h);
    ctx.globalAlpha = 1;
  };
  pass(104, 0.14, 0.45); // distant skyline
  pass(132, 0.34, 1); // near skyline
  return true;
}

function drawBackground(ctx: CanvasRenderingContext2D, cam: number) {
  // Dusk sky behind the skyline.
  const sky = ctx.createLinearGradient(0, 0, 0, ROAD_TOP);
  sky.addColorStop(0, "#101a30");
  sky.addColorStop(1, "#23395f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, ROAD_TOP);
  if (!drawSkylineSprite(ctx, cam)) drawSkylineVector(ctx, cam);

  // Asphalt road.
  if (!tileRegion(ctx, SPR.road, 0, ROAD_TOP, WIDTH, ROAD_BOT - ROAD_TOP, cam, 84)) {
    ctx.fillStyle = "#39342b";
    ctx.fillRect(0, ROAD_TOP, WIDTH, ROAD_BOT - ROAD_TOP);
  }
  // Scrolling dashed lane dividers convey motion.
  ctx.strokeStyle = "rgba(255,214,90,0.75)";
  ctx.lineWidth = 3;
  for (let l = 1; l < LANES; l++) {
    const y = ROAD_TOP + LANE_H * l;
    ctx.setLineDash([20, 16]);
    ctx.lineDashOffset = -(cam % 36);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // Curb + sidewalk band below the road.
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, ROAD_BOT - 3, WIDTH, 4);
  if (!tileRegion(ctx, SPR.sidewalk, 0, ROAD_BOT, WIDTH, HEIGHT - ROAD_BOT, cam, HEIGHT - ROAD_BOT)) {
    ctx.fillStyle = "#c9b596";
    ctx.fillRect(0, ROAD_BOT, WIDTH, HEIGHT - ROAD_BOT);
  }
}

/** Vector skyline — only used until the sprite backdrop finishes loading. */
function drawSkylineVector(ctx: CanvasRenderingContext2D, cam: number) {
  ctx.strokeStyle = "rgba(154,167,199,0.22)";
  ctx.lineWidth = 1;
  const off = (cam * 0.5) % 62;
  for (let i = -1; i < WIDTH / 62 + 1; i++) {
    const x = i * 62 - off;
    const h = 44 + ((i * 37) % 5) * 10;
    ctx.strokeRect(x + 6, ROAD_TOP - h, 48, h);
  }
}

function drawCar(ctx: CanvasRenderingContext2D, c: RunCar, cam: number) {
  const sx = c.worldX - cam;
  if (sx < -80 || sx > WIDTH + 80) return;
  const cy = laneY(c.lane);
  const veh = SPR.vehicles[c.hazId % SPR.vehicles.length];
  const h = LANE_H * 0.95;
  // A crashed car flashes a red alarm box behind it.
  if (c.crashed && Math.floor(Date.now() / 180) % 2 === 0) {
    ctx.fillStyle = "rgba(255,46,77,0.35)";
    rrect(ctx, sx - 34, cy - h / 2 - 4, 68, h + 8, 6);
    ctx.fill();
  }
  if (!blit(ctx, veh, sx, cy + 4, h, {})) {
    const top = cy - h / 2;
    ctx.fillStyle = c.crashed ? "#FF2E4D" : "#FFB454";
    rrect(ctx, sx - CAR_W / 2, top, CAR_W, h, 7);
    ctx.fill();
  }
}

function drawHazard(ctx: CanvasRenderingContext2D, h: RunHazard, cam: number) {
  const sx = h.worldX - cam;
  if (sx < -40 || sx > WIDTH + 40) return;
  const cy = laneY(h.lane);
  const pop = h.pop < 1 ? 1 - (1 - h.pop) * (1 - h.pop) : 1;
  const sp = hazardSprite(h);
  // Cones/crumbles read as taller props; potholes lie flat on the road.
  const tall = h.type === "construction" || h.type === "hydrant";
  const th = (tall ? LANE_H * 0.9 : LANE_H * 0.66) * pop;

  if (h.fixed) {
    // Patched — the obstacle fades out under a fresh green check.
    blit(ctx, sp, sx, cy, tall ? LANE_H * 0.9 : LANE_H * 0.66, {
      anchorBottom: tall,
      alpha: 0.22,
    });
    ctx.strokeStyle = "#3DDC97";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx - 8, cy);
    ctx.lineTo(sx - 2, cy + 6);
    ctx.lineTo(sx + 9, cy - 7);
    ctx.stroke();
    return;
  }

  if (!blit(ctx, sp, sx, cy, th, { anchorBottom: tall })) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(sx, cy, 12 * pop, 8 * pop, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMayor(ctx: CanvasRenderingContext2D, state: FixTheCityRunState) {
  const cx = PX;
  const cy = laneY(state.laneY);
  const repairing = (state.repairT ?? 0) > 0;
  const playing = state.phase === "playing";

  // Speed lines when dashing.
  if (state.boost) {
    ctx.strokeStyle = "rgba(255,214,90,0.6)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const yy = cy - 6 + i * 8;
      const wob = ((state.frame * 6 + i * 13) % 18) - 9;
      ctx.beginPath();
      ctx.moveTo(cx - 26 - wob, yy);
      ctx.lineTo(cx - 44 - wob, yy);
      ctx.stroke();
    }
  }

  // Repair progress ring under the Mayor while patching.
  if (repairing) {
    ctx.strokeStyle = "rgba(61,220,151,0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#3DDC97";
    ctx.beginPath();
    ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (state.repairT ?? 0));
    ctx.stroke();
  }

  // Pick the animation frame: idle before the run, a shovel/jackhammer dig
  // while patching, else the run cycle. We only ever use right-facing sprites,
  // so the Mayor keeps a consistent heading — no mirroring, no flip.
  let sp: Sprite;
  let digBob = 0;
  if (!playing) {
    sp = SPR.idle;
  } else if (repairing) {
    const haz = state.hazards.find((h) => h.id === state.repairId);
    const jack = haz ? cleaningTool(haz) === "jack" : false;
    const frames = jack ? JACK_FRAMES : SHOVEL_FRAMES;
    sp = SPR.clean[frames[Math.floor(state.frame / 6) % frames.length]];
    // The shovel is a single pose; give it a gentle up/down dig so it reads as
    // active. (The jackhammer already animates across its two frames.)
    if (!jack) digBob = (Math.sin(state.frame / 3) + 1) * 1.6;
  } else {
    sp = SPR.run[Math.floor(state.frame / (state.boost ? 3 : 5)) % SPR.run.length];
  }

  const H = LANE_H * 1.7;
  const footY = cy + LANE_H * 0.36 + digBob;
  if (!blit(ctx, sp, cx, footY, H, { anchorBottom: true })) {
    // Simple fallback body until the sprite loads.
    ctx.fillStyle = "#FF6B35";
    rrect(ctx, cx - 7, cy - 6, 14, 16, 4);
    ctx.fill();
    ctx.fillStyle = "#FFD23F";
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx: CanvasRenderingContext2D, state: FixTheCityRunState) {
  ctx.textAlign = "left";
  ctx.font = "10px monospace";
  ctx.fillStyle = "rgba(11,14,26,0.82)";
  ctx.fillRect(6, 6, 150, 17);
  ctx.strokeStyle = "rgba(255,210,63,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(6.5, 6.5, 149, 16);
  ctx.fillStyle = "#FFD23F";
  ctx.fillText(`LVL ${state.level} · PATCHED ${state.fixed}/${state.quota}`, 12, 18);

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
