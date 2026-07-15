import type { BaseGameState, GameEngine } from "@/lib/types";

/**
 * "PAST BEDTIME" — Mamdani suits up for the Knicks, and by order of the
 * Mayor, every kid in the city is allowed to stay up and watch.
 * (Concept by a junior game designer. 🏀)
 *
 * A tap-timing shooter:
 *   • A power meter sweeps back and forth. Tap to shoot.
 *   • Land the green sweet spot → SWISH. Close → rattles in off the rim.
 *     Way off → brick.
 *   • First to 21 wins the night. Five bricks and it's lights out for real.
 *
 * The clock at the top starts at 12:00 AM and only gets LATER with every
 * shot — that's the whole point — and the pajama-kid crowd in the stands
 * grows with the score.
 *
 * All motion is plain data; render reads state and never mutates it.
 */

const WIDTH = 440;
const HEIGHT = 620;

const FLOOR_Y = 470; // court floor line
const HOOP_X = 375;
const RIM_Y = 235; // rim height in canvas px
const WIN_SCORE = 21;
const MAX_BRICKS = 5;

/** Shooting spots the Mayor cycles through: x position + point value. */
const SPOTS: Array<{ x: number; pts: 2 | 3 }> = [
  { x: 150, pts: 2 },
  { x: 95, pts: 3 },
  { x: 200, pts: 2 },
  { x: 60, pts: 3 },
  { x: 120, pts: 2 },
];

/** Meter sweep speed ramps a little as the score climbs. */
const METER_BASE = 1.35; // full sweeps per second
const SWEET_HALF = 0.075; // half-width of the green sweet zone
const OK_HALF = 0.17; // half-width of the "rattles in" zone

const SHOT_AIRTIME = 0.9; // seconds of ball flight

const QUIPS_SWISH = [
  "SWISH! The pajama section ERUPTS.",
  "Nothing but net. Somebody's staying up till 2.",
  "He's cooking. The babysitters have given up.",
  "Splash. A thousand kids just spilled cocoa.",
];
const QUIPS_GOOD = [
  "Rattles in! Counts the same, kids.",
  "Off the rim and IN. The bench loses it.",
  "Bank's open past midnight.",
];
const QUIPS_BRICK = [
  "BRICK. A yawn ripples through the crowd.",
  "Clank. Somewhere, a parent points at the stairs.",
  "Off the iron. The sandman inches closer.",
];

export interface BedtimeShot {
  t: number; // 0→1 flight progress
  fromX: number;
  quality: number; // 0..1 distance from perfect (0 = dead center)
  result: "swish" | "good" | "brick";
  pts: number;
}

export interface Popup {
  x: number;
  y: number;
  text: string;
  ttl: number;
  color: string;
}

export interface PastBedtimeState extends BaseGameState {
  /** Minutes past midnight — the top-bar clock. Only ever goes up. */
  clockMin: number;
  bricks: number;
  streak: number;
  spot: number; // index into SPOTS
  meter: number; // 0..1 cursor
  meterDir: 1 | -1;
  shot: BedtimeShot | null;
  popups: Popup[];
  quip: string;
}

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function freshState(phase: PastBedtimeState["phase"]): PastBedtimeState {
  return {
    phase,
    score: 0,
    timeLeft: null,
    frame: 0,
    clockMin: 0,
    bricks: 0,
    streak: 0,
    spot: 0,
    meter: 0,
    meterDir: 1,
    shot: null,
    popups: [],
    quip: "By order of the Mayor: bedtime is SUSPENDED.",
  };
}

export const pastBedtime: GameEngine<PastBedtimeState> = {
  init() {
    return freshState("attract");
  },

  handleInput(state, intent) {
    if (intent === "reset") return freshState("attract");
    if (state.phase !== "playing") {
      if (intent === "start" || intent === "tap") return freshState("playing");
      return state;
    }
    if (intent !== "tap" || state.shot) return state;

    // Lock the meter → resolve the shot.
    const q = Math.abs(state.meter - 0.5) * 2; // 0 = perfect center
    const spot = SPOTS[state.spot];
    let result: BedtimeShot["result"];
    if (q <= SWEET_HALF * 2) result = "swish";
    else if (q <= OK_HALF * 2) result = "good";
    else result = "brick";
    const pts = result === "brick" ? 0 : spot.pts;
    return {
      ...state,
      shot: { t: 0, fromX: spot.x, quality: q, result, pts },
    };
  },

  update(state, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const frame = state.frame + 1;
    if (state.phase !== "playing") return { ...state, frame };

    // Popups drift up and fade.
    let popups = state.popups
      .map((p) => ({ ...p, y: p.y - 24 * dt, ttl: p.ttl - dt }))
      .filter((p) => p.ttl > 0);

    // Meter sweeps while no ball is in the air.
    let { meter, meterDir, shot, score, bricks, streak, spot, clockMin, quip } = state;
    if (!shot) {
      const speed = METER_BASE + Math.min(0.9, score * 0.035);
      let m = meter + meterDir * speed * dt * 2; // 0→1→0 sweep
      if (m > 1) {
        m = 2 - m;
        meterDir = -1;
      } else if (m < 0) {
        m = -m;
        meterDir = 1;
      }
      meter = m;
    } else {
      // Ball in flight.
      const t = shot.t + dt / SHOT_AIRTIME;
      if (t >= 1) {
        // Shot lands.
        const late = 4 + Math.floor(rand(frame) * 6); // minutes later, always
        clockMin += late;
        if (shot.result === "brick") {
          bricks += 1;
          streak = 0;
          quip = QUIPS_BRICK[Math.floor(rand(frame * 1.7) * QUIPS_BRICK.length)];
          popups.push({ x: HOOP_X - 20, y: RIM_Y - 16, text: "BRICK.", ttl: 1, color: "#FF2E4D" });
        } else {
          score += shot.pts;
          streak += 1;
          quip =
            shot.result === "swish"
              ? QUIPS_SWISH[Math.floor(rand(frame * 2.3) * QUIPS_SWISH.length)]
              : QUIPS_GOOD[Math.floor(rand(frame * 3.1) * QUIPS_GOOD.length)];
          popups.push({
            x: HOOP_X - 20,
            y: RIM_Y - 16,
            text: shot.result === "swish" ? `SWISH! +${shot.pts}` : `+${shot.pts}`,
            ttl: 1.1,
            color: shot.result === "swish" ? "#3DDC97" : "#FFD23F",
          });
          if (streak >= 3) {
            popups.push({
              x: shot.fromX,
              y: FLOOR_Y - 130,
              text: `ON FIRE x${streak}`,
              ttl: 1.1,
              color: "#FF6B35",
            });
          }
        }
        shot = null;
        spot = (spot + Math.floor(1 + rand(frame * 4.7) * 2)) % SPOTS.length;
        meter = rand(frame * 5.3); // fresh cursor spot keeps rhythm honest

        if (score >= WIN_SCORE) {
          return {
            ...state,
            frame,
            popups,
            score,
            bricks,
            streak,
            spot,
            clockMin,
            meter,
            meterDir,
            shot: null,
            phase: "won",
            quip: "KNICKS WIN! Nobody sleeps! (Mayor's orders.)",
          };
        }
        if (bricks >= MAX_BRICKS) {
          return {
            ...state,
            frame,
            popups,
            score,
            bricks,
            streak,
            spot,
            clockMin,
            meter,
            meterDir,
            shot: null,
            phase: "gameover",
            quip: "Even the Mayor can't save this one. Bed.",
          };
        }
      } else {
        shot = { ...shot, t };
      }
    }

    return { ...state, frame, popups, meter, meterDir, shot, score, bricks, streak, spot, clockMin, quip };
  },

  render(ctx, state) {
    // Arena backdrop.
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#0b1020");
    sky.addColorStop(1, "#141c33");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawClockBar(ctx, state);
    drawStands(ctx, state);
    drawCourt(ctx);
    drawHoop(ctx, state);

    const spot = SPOTS[state.spot];
    drawMayor(ctx, spot.x, state);
    if (state.shot) drawBall(ctx, state.shot);

    // Spot value tag.
    ctx.fillStyle = spot.pts === 3 ? "#7ee0ff" : "#FFD23F";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${spot.pts} PTS`, spot.x, FLOOR_Y + 22);

    drawMeter(ctx, state);
    drawScoreboard(ctx, state);

    // Popups.
    for (const p of state.popups) {
      ctx.globalAlpha = Math.min(1, p.ttl * 2);
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(6,10,22,0.9)";
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }

    // Quip ticker.
    ctx.fillStyle = "rgba(6,10,22,0.85)";
    ctx.fillRect(0, HEIGHT - 26, WIDTH, 26);
    ctx.fillStyle = "#7ee0ff";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(state.quip, WIDTH / 2, HEIGHT - 9);
    ctx.textAlign = "left";

    if (state.phase === "attract") {
      banner(ctx, "TAP TO TIP OFF", "tap when the meter is GREEN — first to 21");
    } else if (state.phase === "won") {
      banner(ctx, "KNICKS WIN — NOBODY SLEEPS", `final: ${state.score} · ${clockText(state.clockMin)} · tap to run it back`);
    } else if (state.phase === "gameover") {
      banner(ctx, "LIGHTS OUT. ACTUAL BEDTIME.", `you hung ${state.score} points · tap to sneak back out`);
    }
  },
};

/* ---------------------------------------------------------------- render */

function clockText(min: number): string {
  const h = 12 + Math.floor(min / 60);
  const hh = h > 12 ? h - 12 : 12;
  const mm = `${min % 60}`.padStart(2, "0");
  return `${hh}:${mm} AM`;
}

function drawClockBar(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  ctx.fillStyle = "rgba(6,10,22,0.92)";
  ctx.fillRect(0, 0, WIDTH, 44);
  ctx.fillStyle = "#F58426"; // Knicks orange
  ctx.fillRect(0, 44, WIDTH, 3);
  // The famous clock: always 12-something or later.
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.fillText(clockText(state.clockMin), WIDTH / 2, 28);
  ctx.font = "9px monospace";
  ctx.fillStyle = "#3DDC97";
  const blink = Math.floor(state.frame / 30) % 2 === 0;
  ctx.fillText(blink ? "● BEDTIME: SUSPENDED BY MAYORAL DECREE" : "   BEDTIME: SUSPENDED BY MAYORAL DECREE", WIDTH / 2, 40);
  ctx.textAlign = "left";
}

function drawStands(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  // Bleachers.
  ctx.fillStyle = "#101830";
  ctx.fillRect(0, 47, WIDTH, 90);
  // Pajama kids: the crowd grows as the score climbs (and it's a school night).
  const kids = Math.min(60, 8 + state.score * 3);
  const PJ = ["#7ee0ff", "#FFD23F", "#FF6B35", "#3DDC97", "#e88ccf", "#c4b5fd"];
  for (let i = 0; i < kids; i++) {
    const kx = 14 + (i * 37) % (WIDTH - 28);
    const row = i % 3;
    const ky = 62 + row * 24;
    const bob = state.streak >= 3 ? Math.sin((state.frame + i * 9) / 5) * 3 : Math.sin((state.frame + i * 13) / 22) * 1.2;
    ctx.fillStyle = PJ[i % PJ.length];
    ctx.fillRect(kx - 4, ky - 6 + bob, 8, 10); // pajama body
    ctx.fillStyle = "#e0b08c";
    ctx.beginPath();
    ctx.arc(kx, ky - 10 + bob, 4, 0, Math.PI * 2); // sleepy head
    ctx.fill();
  }
  // A few foam fingers when on fire.
  if (state.streak >= 3) {
    ctx.font = "10px monospace";
    ctx.fillStyle = "#F58426";
    for (let i = 0; i < 5; i++) {
      const fx = 40 + i * 85;
      ctx.fillText("☝", fx, 60 + Math.sin((state.frame + i * 20) / 6) * 4);
    }
  }
}

function drawCourt(ctx: CanvasRenderingContext2D) {
  // Hardwood.
  ctx.fillStyle = "#8a5a2b";
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y - 26);
  ctx.fillStyle = "#9c6a36";
  for (let x = 0; x < WIDTH; x += 34) ctx.fillRect(x, FLOOR_Y, 17, HEIGHT - FLOOR_Y - 26);
  // Baseline + paint.
  ctx.strokeStyle = "#F58426";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(WIDTH, FLOOR_Y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,107,182,0.8)"; // Knicks blue arc
  ctx.beginPath();
  ctx.arc(HOOP_X, FLOOR_Y, 300, Math.PI, Math.PI * 1.5);
  ctx.stroke();
}

function drawHoop(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  // Pole + backboard.
  ctx.fillStyle = "#3c465e";
  ctx.fillRect(HOOP_X + 40, RIM_Y - 40, 8, FLOOR_Y - RIM_Y + 40);
  ctx.fillStyle = "#dfe8f5";
  ctx.fillRect(HOOP_X + 18, RIM_Y - 52, 8, 74);
  ctx.strokeStyle = "#F58426";
  ctx.lineWidth = 2;
  ctx.strokeRect(HOOP_X + 18, RIM_Y - 52, 8, 74);
  // Rim.
  ctx.strokeStyle = "#FF6B35";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(HOOP_X - 22, RIM_Y);
  ctx.lineTo(HOOP_X + 18, RIM_Y);
  ctx.stroke();
  // Net (sways after a make).
  const sway = state.shot ? 0 : Math.sin(state.frame / 9) * 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 4; i++) {
    const nx = HOOP_X - 22 + i * 10;
    ctx.beginPath();
    ctx.moveTo(nx, RIM_Y);
    ctx.lineTo(HOOP_X - 12 + i * 6 + sway, RIM_Y + 26);
    ctx.stroke();
  }
}

function drawMayor(ctx: CanvasRenderingContext2D, x: number, state: PastBedtimeState) {
  const y = FLOOR_Y;
  const shooting = !!state.shot && state.shot.t < 0.35;
  ctx.save();
  ctx.translate(x, y);
  // Legs.
  ctx.fillStyle = "#dfe8f5"; // Knicks white shorts
  ctx.fillRect(-9, -34, 7, 18);
  ctx.fillRect(2, -34, 7, 18);
  ctx.fillStyle = "#F58426";
  ctx.fillRect(-9, -16, 7, 6);
  ctx.fillRect(2, -16, 7, 6); // sneakers
  // Jersey.
  ctx.fillStyle = "#006BB6";
  ctx.fillRect(-12, -62, 24, 30);
  ctx.fillStyle = "#F58426";
  ctx.fillRect(-12, -62, 24, 5);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("1", 0, -42);
  // Arms: up when shooting, ready otherwise.
  ctx.strokeStyle = "#a9744f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (shooting) {
    ctx.moveTo(-8, -58);
    ctx.lineTo(-14, -76);
    ctx.moveTo(8, -58);
    ctx.lineTo(16, -78);
  } else {
    ctx.moveTo(-8, -56);
    ctx.lineTo(-16, -44);
    ctx.moveTo(8, -56);
    ctx.lineTo(18, -50);
  }
  ctx.stroke();
  // Head: beard + glasses + the confidence of a man with a mandate.
  ctx.fillStyle = "#a9744f";
  ctx.beginPath();
  ctx.arc(0, -72, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#151a24"; // hair
  ctx.beginPath();
  ctx.arc(0, -76, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#151a24"; // beard
  ctx.fillRect(-8, -70, 16, 7);
  ctx.fillStyle = "#a9744f";
  ctx.fillRect(-5, -70, 10, 4); // mouth gap
  ctx.fillStyle = "#0b1020"; // glasses
  ctx.fillRect(-8, -76, 6, 4);
  ctx.fillRect(2, -76, 6, 4);
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, shot: BedtimeShot) {
  const t = shot.t;
  const sx = shot.fromX + 14;
  const sy = FLOOR_Y - 80;
  // Bricks fall short / clang off the front of the rim.
  const ex = shot.result === "brick" ? HOOP_X - 30 + shot.quality * 18 : HOOP_X - 2;
  const ey = shot.result === "brick" ? RIM_Y + 4 : RIM_Y + (shot.result === "good" ? 2 : 6);
  const x = sx + (ex - sx) * t;
  const peak = 120 + (1 - shot.quality) * 40;
  const y = sy + (ey - sy) * t - Math.sin(Math.PI * t) * peak;
  ctx.fillStyle = "#F58426";
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a3d12";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 8, y);
  ctx.stroke();
}

function drawMeter(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  const mx = 40;
  const mw = WIDTH - 80;
  const my = HEIGHT - 78;
  ctx.fillStyle = "rgba(6,10,22,0.85)";
  ctx.fillRect(mx - 8, my - 12, mw + 16, 40);
  // Track with zones: red edges, gold ok, green sweet center.
  ctx.fillStyle = "#5c2430";
  ctx.fillRect(mx, my, mw, 14);
  const okW = OK_HALF * mw * 2;
  ctx.fillStyle = "#8a6b1f";
  ctx.fillRect(mx + mw / 2 - okW / 2, my, okW, 14);
  const sweetW = SWEET_HALF * mw * 2;
  ctx.fillStyle = "#1f8a5a";
  ctx.fillRect(mx + mw / 2 - sweetW / 2, my, sweetW, 14);
  // Cursor.
  const cx = mx + state.meter * mw;
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - 2, my - 6, 4, 26);
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#7ee0ff";
  ctx.fillText("TAP ON GREEN TO SHOOT", WIDTH / 2, my + 24);
  ctx.textAlign = "left";
}

function drawScoreboard(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFD23F";
  ctx.fillText(`PTS ${state.score}/${WIN_SCORE}`, 12, 66);
  ctx.textAlign = "right";
  ctx.fillStyle = state.bricks >= 3 ? "#FF2E4D" : "#dfe8f5";
  ctx.fillText(`BRICKS ${"▮".repeat(state.bricks)}${"▯".repeat(MAX_BRICKS - state.bricks)}`, WIDTH - 12, 66);
  ctx.textAlign = "left";
}

function banner(ctx: CanvasRenderingContext2D, text: string, sub: string) {
  const y = HEIGHT / 2 - 26;
  ctx.fillStyle = "rgba(6,10,22,0.85)";
  ctx.fillRect(0, y, WIDTH, 52);
  ctx.textAlign = "center";
  ctx.fillStyle = "#F58426";
  ctx.font = "bold 13px monospace";
  ctx.fillText(text, WIDTH / 2, y + 22);
  ctx.fillStyle = "#FFD23F";
  ctx.font = "10px monospace";
  ctx.fillText(sub, WIDTH / 2, y + 40);
  ctx.textAlign = "left";
}

export const PAST_BEDTIME_DIMENSIONS = { width: WIDTH, height: HEIGHT };
