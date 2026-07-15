import type { BaseGameState, GameEngine } from "@/lib/types";

/**
 * "PAST BEDTIME" v2 — Mamdani suits up for the Knicks, and by order of the
 * Mayor, every kid in the city is allowed to stay up and watch.
 * (Concept + design notes by a junior game designer. 🏀)
 *
 * Full-court view from behind the OTHER goal: the hoop faces you at the top
 * of the screen. Move the Mayor with arrows / the D-pad, dribble THROUGH the
 * defenders (gray-suit Haters — get touched and it's a steal), and tap the
 * goal (or SHOOT) to let it fly. Open looks close to the rim almost always
 * drop; contested heaves are a prayer. First to 21 wins the night; five
 * misses/steals and it's lights out for real.
 *
 * The clock at the top starts at 12:00 AM and only gets LATER — that's the
 * whole point — and the pajama-kid crowd grows with the score. The Mayor's
 * face is the real pixel-art head from the Hot Take sprite set.
 */

const WIDTH = 440;
const HEIGHT = 620;

const HOOP = { x: WIDTH / 2, y: 168 }; // rim center (face-on at the top)
const COURT = { top: 205, bottom: 548, left: 26, right: WIDTH - 26 };
const THREE_R = 250; // distance from rim = 3-point land

const WIN_SCORE = 21;
const MAX_MISSES = 5;
const PLAYER_SPEED = 185; // px/s
const STEAL_RADIUS = 20;
const SHOT_AIRTIME = 0.75;

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
const QUIPS_STEAL = [
  "STOLEN! The Haters strike.",
  "Picked his pocket. Boo this suit.",
  "Turnover! The bedtime lobby cheers.",
];

export interface Defender {
  x: number;
  y: number;
  hx: number; // home spot
  hy: number;
  seed: number;
}

export interface BedtimeShot {
  t: number;
  fromX: number;
  fromY: number;
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
  clockMin: number; // minutes past midnight — only ever goes up
  misses: number; // bricks + steals
  streak: number;
  px: number;
  py: number;
  vx: number; // held-direction velocity (-1/0/1)
  vy: number;
  invuln: number; // seconds of post-steal grace
  defenders: Defender[];
  shot: BedtimeShot | null;
  popups: Popup[];
  quip: string;
}

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function homeSpots(n: number): Array<[number, number]> {
  const spots: Array<[number, number]> = [
    [WIDTH / 2, 300],
    [WIDTH / 2 - 95, 360],
    [WIDTH / 2 + 95, 360],
    [WIDTH / 2, 430],
  ];
  return spots.slice(0, n);
}

function defendersFor(score: number, seedBase: number): Defender[] {
  const n = Math.min(4, 2 + Math.floor(score / 8));
  return homeSpots(n).map(([hx, hy], i) => ({
    x: hx + (rand(seedBase + i) - 0.5) * 40,
    y: hy,
    hx,
    hy,
    seed: seedBase + i * 7.3,
  }));
}

function freshState(phase: PastBedtimeState["phase"]): PastBedtimeState {
  return {
    phase,
    score: 0,
    timeLeft: null,
    frame: 0,
    clockMin: 0,
    misses: 0,
    streak: 0,
    px: WIDTH / 2,
    py: 505,
    vx: 0,
    vy: 0,
    invuln: 0,
    defenders: defendersFor(0, 11),
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
      if (intent === "start" || intent === "shoot" || intent === "tap")
        return freshState("playing");
      return state;
    }
    switch (intent) {
      case "left":
        return { ...state, vx: -1 };
      case "right":
        return { ...state, vx: 1 };
      case "leftoff":
        return state.vx < 0 ? { ...state, vx: 0 } : state;
      case "rightoff":
        return state.vx > 0 ? { ...state, vx: 0 } : state;
      case "up":
        return { ...state, vy: -1 };
      case "down":
        return { ...state, vy: 1 };
      case "upoff":
        return state.vy < 0 ? { ...state, vy: 0 } : state;
      case "downoff":
        return state.vy > 0 ? { ...state, vy: 0 } : state;
    }
    if ((intent === "shoot" || intent === "tap") && !state.shot) {
      // Resolve the look: distance + how contested it is.
      const d = Math.hypot(state.px - HOOP.x, state.py - HOOP.y);
      const nearest = Math.min(
        ...state.defenders.map((f) => Math.hypot(f.x - state.px, f.y - state.py)),
        999,
      );
      let p = d < 110 ? 0.98 : d < 230 ? 0.82 : d < 330 ? 0.65 : 0.45;
      if (nearest < 30) p -= 0.3;
      else if (nearest < 60) p -= 0.12;
      const roll = rand(state.frame * 1.37);
      const make = roll < p;
      const result: BedtimeShot["result"] = make
        ? roll < p * 0.55
          ? "swish"
          : "good"
        : "brick";
      const pts = d > THREE_R ? 3 : 2;
      return {
        ...state,
        shot: { t: 0, fromX: state.px, fromY: state.py, result, pts: make ? pts : 0 },
      };
    }
    return state;
  },

  update(state, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const frame = state.frame + 1;
    if (state.phase !== "playing") return { ...state, frame };

    let popups = state.popups
      .map((p) => ({ ...p, y: p.y - 24 * dt, ttl: p.ttl - dt }))
      .filter((p) => p.ttl > 0);

    // ---- move the Mayor ----
    let px = state.px + state.vx * PLAYER_SPEED * dt;
    let py = state.py + state.vy * PLAYER_SPEED * dt;
    px = Math.max(COURT.left + 14, Math.min(COURT.right - 14, px));
    py = Math.max(COURT.top + 10, Math.min(COURT.bottom, py));

    // ---- defenders: chase when close, drift home otherwise ----
    const chaseR = 140;
    const speed = Math.min(100, 48 + state.score * 2.5);
    let defenders = state.defenders.map((f) => {
      const toP = Math.hypot(px - f.x, py - f.y);
      const [tx, ty] = toP < chaseR && !state.shot ? [px, py] : [f.hx, f.hy];
      const dx = tx - f.x;
      const dy = ty - f.y;
      const dd = Math.hypot(dx, dy) || 1;
      let nx = f.x + (dx / dd) * speed * dt;
      let ny = f.y + (dy / dd) * speed * dt;
      // wobble so they feel alive
      nx += Math.sin((frame + f.seed * 40) / 14) * 0.4;
      return { ...f, x: nx, y: ny };
    });
    // keep defenders from stacking
    for (let i = 0; i < defenders.length; i++) {
      for (let j = i + 1; j < defenders.length; j++) {
        const a = defenders[i];
        const b = defenders[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d < 34 && d > 0) {
          const push = (34 - d) / 2;
          defenders[i] = { ...a, x: a.x - (dx / d) * push, y: a.y - (dy / d) * push };
          defenders[j] = { ...b, x: b.x + (dx / d) * push, y: b.y + (dy / d) * push };
        }
      }
    }

    let { score, misses, streak, clockMin, quip, shot, invuln } = state;
    invuln = Math.max(0, invuln - dt);

    // ---- steals ----
    if (!shot && invuln <= 0) {
      const thief = defenders.find((f) => Math.hypot(f.x - px, f.y - py) < STEAL_RADIUS);
      if (thief) {
        misses += 1;
        streak = 0;
        invuln = 1.8;
        quip = QUIPS_STEAL[Math.floor(rand(frame * 1.9) * QUIPS_STEAL.length)];
        popups.push({ x: px, y: py - 40, text: "STOLEN!", ttl: 1.1, color: "#FF2E4D" });
        px = WIDTH / 2;
        py = 505;
        defenders = defendersFor(score, frame);
        if (misses >= MAX_MISSES) {
          return {
            ...state,
            frame,
            popups,
            px,
            py,
            defenders,
            misses,
            streak,
            invuln,
            phase: "gameover",
            quip: "Even the Mayor can't save this one. Bed.",
          };
        }
      }
    }

    // ---- ball flight ----
    if (shot) {
      const t = shot.t + dt / SHOT_AIRTIME;
      if (t >= 1) {
        clockMin += 4 + Math.floor(rand(frame) * 6); // always later, never earlier
        if (shot.result === "brick") {
          misses += 1;
          streak = 0;
          quip = QUIPS_BRICK[Math.floor(rand(frame * 1.7) * QUIPS_BRICK.length)];
          popups.push({ x: HOOP.x, y: HOOP.y - 26, text: "BRICK.", ttl: 1, color: "#FF2E4D" });
        } else {
          score += shot.pts;
          streak += 1;
          quip =
            shot.result === "swish"
              ? QUIPS_SWISH[Math.floor(rand(frame * 2.3) * QUIPS_SWISH.length)]
              : QUIPS_GOOD[Math.floor(rand(frame * 3.1) * QUIPS_GOOD.length)];
          popups.push({
            x: HOOP.x,
            y: HOOP.y - 26,
            text: shot.result === "swish" ? `SWISH! +${shot.pts}` : `+${shot.pts}`,
            ttl: 1.1,
            color: shot.result === "swish" ? "#3DDC97" : "#FFD23F",
          });
          if (streak >= 3)
            popups.push({ x: px, y: py - 44, text: `ON FIRE x${streak}`, ttl: 1.1, color: "#FF6B35" });
          defenders = defendersFor(score, frame);
        }
        shot = null;
        if (score >= WIN_SCORE) {
          return {
            ...state,
            frame,
            popups,
            px,
            py,
            defenders,
            score,
            misses,
            streak,
            clockMin,
            invuln,
            shot: null,
            phase: "won",
            quip: "KNICKS WIN! Nobody sleeps! (Mayor's orders.)",
          };
        }
        if (misses >= MAX_MISSES) {
          return {
            ...state,
            frame,
            popups,
            px,
            py,
            defenders,
            score,
            misses,
            streak,
            clockMin,
            invuln,
            shot: null,
            phase: "gameover",
            quip: "Even the Mayor can't save this one. Bed.",
          };
        }
      } else {
        shot = { ...shot, t };
      }
    }

    return {
      ...state,
      frame,
      popups,
      px,
      py,
      defenders,
      score,
      misses,
      streak,
      clockMin,
      quip,
      shot,
      invuln,
    };
  },

  render(ctx, state) {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#0b1020");
    sky.addColorStop(1, "#141c33");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawClockBar(ctx, state);
    drawStands(ctx, state);
    drawCourt(ctx);
    drawHoop(ctx, state);

    // Defenders behind/ahead of the player by y for simple depth.
    const drawables: Array<{ y: number; draw: () => void }> = [
      { y: state.py, draw: () => drawMayor(ctx, state) },
      ...state.defenders.map((f) => ({ y: f.y, draw: () => drawDefender(ctx, f, state.frame) })),
    ];
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    if (state.shot) drawBall(ctx, state.shot);

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

    drawScoreboard(ctx, state);

    // Quip ticker.
    ctx.fillStyle = "rgba(6,10,22,0.85)";
    ctx.fillRect(0, HEIGHT - 26, WIDTH, 26);
    ctx.fillStyle = "#7ee0ff";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(state.quip, WIDTH / 2, HEIGHT - 9);
    ctx.textAlign = "left";

    if (state.phase === "attract") {
      banner(ctx, "TAP TO TIP OFF", "arrows/D-pad to dribble · tap the goal to shoot");
    } else if (state.phase === "won") {
      banner(
        ctx,
        "KNICKS WIN — NOBODY SLEEPS",
        `final: ${state.score} · ${clockText(state.clockMin)} · tap to run it back`,
      );
    } else if (state.phase === "gameover") {
      banner(ctx, "LIGHTS OUT. ACTUAL BEDTIME.", `you hung ${state.score} points · tap to sneak back out`);
    }
  },
};

/* ---------------------------------------------------------------- assets */

interface Sprite {
  img: HTMLImageElement | null;
  ready: boolean;
}
function loadSprite(src: string): Sprite {
  const sp: Sprite = { img: null, ready: false };
  if (typeof window !== "undefined") {
    const img = new Image();
    img.onload = () => {
      sp.ready = true;
    };
    img.src = src;
    sp.img = img;
  }
  return sp;
}
const HEADS = {
  calm: loadSprite("/sprites/bedtime/head_calm.webp"),
  grin: loadSprite("/sprites/bedtime/head_grin.webp"),
  hype: loadSprite("/sprites/bedtime/head_hype.webp"),
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
  ctx.fillStyle = "#F58426";
  ctx.fillRect(0, 44, WIDTH, 3);
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.fillText(clockText(state.clockMin), WIDTH / 2, 28);
  ctx.font = "9px monospace";
  ctx.fillStyle = "#3DDC97";
  const blink = Math.floor(state.frame / 30) % 2 === 0;
  ctx.fillText(
    blink ? "● BEDTIME: SUSPENDED BY MAYORAL DECREE" : "   BEDTIME: SUSPENDED BY MAYORAL DECREE",
    WIDTH / 2,
    40,
  );
  ctx.textAlign = "left";
}

function drawStands(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  ctx.fillStyle = "#101830";
  ctx.fillRect(0, 47, WIDTH, 60);
  const kids = Math.min(46, 8 + state.score * 2);
  const PJ = ["#7ee0ff", "#FFD23F", "#FF6B35", "#3DDC97", "#e88ccf", "#c4b5fd"];
  for (let i = 0; i < kids; i++) {
    const kx = 12 + (i * 29) % (WIDTH - 24);
    const row = i % 2;
    const ky = 66 + row * 22;
    const bob =
      state.streak >= 3
        ? Math.sin((state.frame + i * 9) / 5) * 3
        : Math.sin((state.frame + i * 13) / 22) * 1.2;
    ctx.fillStyle = PJ[i % PJ.length];
    ctx.fillRect(kx - 4, ky - 6 + bob, 8, 10);
    ctx.fillStyle = "#e0b08c";
    ctx.beginPath();
    ctx.arc(kx, ky - 10 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCourt(ctx: CanvasRenderingContext2D) {
  // Hardwood, full court panel.
  ctx.fillStyle = "#8a5a2b";
  ctx.fillRect(0, 110, WIDTH, COURT.bottom - 110 + 26);
  ctx.fillStyle = "#9c6a36";
  for (let x = 0; x < WIDTH; x += 34) ctx.fillRect(x, 110, 17, COURT.bottom - 110 + 26);
  // Painted key under the hoop.
  ctx.fillStyle = "rgba(0,107,182,0.55)";
  ctx.fillRect(WIDTH / 2 - 72, 110, 144, 150);
  ctx.strokeStyle = "#dfe8f5";
  ctx.lineWidth = 3;
  ctx.strokeRect(WIDTH / 2 - 72, 110, 144, 150);
  // Free-throw circle.
  ctx.beginPath();
  ctx.arc(WIDTH / 2, 260, 46, 0, Math.PI);
  ctx.stroke();
  // Three-point arc.
  ctx.strokeStyle = "#F58426";
  ctx.beginPath();
  ctx.arc(HOOP.x, HOOP.y, THREE_R, 0.22, Math.PI - 0.22);
  ctx.stroke();
  // Half-court line + circle at the bottom.
  ctx.strokeStyle = "#dfe8f5";
  ctx.beginPath();
  ctx.moveTo(0, COURT.bottom + 12);
  ctx.lineTo(WIDTH, COURT.bottom + 12);
  ctx.stroke();
}

function drawHoop(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  const x = HOOP.x;
  // Backboard, face-on.
  ctx.fillStyle = "rgba(223,232,245,0.92)";
  ctx.fillRect(x - 54, 112, 108, 44);
  ctx.strokeStyle = "#F58426";
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 54, 112, 108, 44);
  ctx.strokeRect(x - 20, 128, 40, 26);
  // Rim: face-on ellipse.
  ctx.strokeStyle = "#FF6B35";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x, HOOP.y, 26, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Net.
  const sway = Math.sin(state.frame / 9) * 1.4;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 5; i++) {
    const nx = x - 24 + i * 9.6;
    ctx.beginPath();
    ctx.moveTo(nx, HOOP.y + 3);
    ctx.lineTo(x - 15 + i * 6 + sway, HOOP.y + 30);
    ctx.stroke();
  }
}

function drawMayor(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  const { px: x, py: y } = state;
  const shooting = !!state.shot && state.shot.t < 0.4;
  const moving = state.vx !== 0 || state.vy !== 0;
  const step = moving ? Math.sin(state.frame / 4) * 3 : 0;
  const flash = state.invuln > 0 && Math.floor(state.frame / 5) % 2 === 0;
  if (flash) ctx.globalAlpha = 0.45;

  // Legs + sneakers.
  ctx.fillStyle = "#dfe8f5";
  ctx.fillRect(x - 10, y - 22, 8, 14 + step * 0.4);
  ctx.fillRect(x + 2, y - 22, 8, 14 - step * 0.4);
  ctx.fillStyle = "#F58426";
  ctx.fillRect(x - 11, y - 8 + step * 0.4, 10, 6);
  ctx.fillRect(x + 1, y - 8 - step * 0.4, 10, 6);
  // Jersey.
  ctx.fillStyle = "#006BB6";
  ctx.fillRect(x - 13, y - 52, 26, 32);
  ctx.fillStyle = "#F58426";
  ctx.fillRect(x - 13, y - 52, 26, 4);
  ctx.fillRect(x - 13, y - 24, 26, 3);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("1", x, y - 32);
  // Arms.
  ctx.strokeStyle = "#a9744f";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (shooting) {
    ctx.moveTo(x - 9, y - 48);
    ctx.lineTo(x - 13, y - 70);
    ctx.moveTo(x + 9, y - 48);
    ctx.lineTo(x + 14, y - 72);
  } else {
    ctx.moveTo(x - 11, y - 46);
    ctx.lineTo(x - 19, y - 32 + step);
    ctx.moveTo(x + 11, y - 46);
    ctx.lineTo(x + 19, y - 34 - step);
  }
  ctx.stroke();
  // The real head.
  const head =
    state.phase !== "playing" || state.streak >= 3
      ? HEADS.grin
      : state.shot
        ? HEADS.hype
        : HEADS.calm;
  if (head.ready && head.img) {
    const hw = 34;
    const hh = (head.img.height / head.img.width) * hw;
    ctx.drawImage(head.img, x - hw / 2, y - 52 - hh + 4, hw, hh);
  } else {
    ctx.fillStyle = "#a9744f";
    ctx.beginPath();
    ctx.arc(x, y - 62, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  // Dribbling ball at his side while he holds it.
  if (!state.shot) {
    const bounce = Math.abs(Math.sin(state.frame / 6)) * 14;
    drawBallAt(ctx, x + 20, y - 8 - bounce, 7);
  }
  ctx.globalAlpha = 1;
}

function drawDefender(ctx: CanvasRenderingContext2D, f: Defender, frame: number) {
  const x = f.x;
  const y = f.y;
  const shuffle = Math.sin((frame + f.seed * 40) / 7) * 2;
  // Legs.
  ctx.fillStyle = "#2b3242";
  ctx.fillRect(x - 9, y - 20, 7, 14);
  ctx.fillRect(x + 2, y - 20, 7, 14);
  // Suit torso.
  ctx.fillStyle = "#3c465e";
  ctx.fillRect(x - 12, y - 48, 24, 30);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 3, y - 48, 6, 12);
  ctx.fillStyle = "#FF2E4D";
  ctx.fillRect(x - 1.5, y - 48, 3, 14); // tie
  // Defense arms, out wide.
  ctx.strokeStyle = "#d8b08c";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 44);
  ctx.lineTo(x - 24, y - 52 + shuffle);
  ctx.moveTo(x + 11, y - 44);
  ctx.lineTo(x + 24, y - 52 - shuffle);
  ctx.stroke();
  // Gray-haired hater head.
  ctx.fillStyle = "#d8b08c";
  ctx.beginPath();
  ctx.arc(x, y - 58, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9aa3b5";
  ctx.beginPath();
  ctx.arc(x, y - 62, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(x - 6, y - 60, 4, 3);
  ctx.fillRect(x + 2, y - 60, 4, 3);
  // frown
  ctx.fillRect(x - 4, y - 52, 8, 2);
}

function drawBallAt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = "#F58426";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a3d12";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.stroke();
}

function drawBall(ctx: CanvasRenderingContext2D, shot: BedtimeShot) {
  const t = shot.t;
  const ex = shot.result === "brick" ? HOOP.x - 30 : HOOP.x;
  const ey = shot.result === "brick" ? HOOP.y - 6 : HOOP.y + 2;
  const x = shot.fromX + (ex - shot.fromX) * t;
  const dist = Math.hypot(shot.fromX - HOOP.x, shot.fromY - HOOP.y);
  const peak = 90 + dist * 0.25;
  const y = shot.fromY - 40 + (ey - shot.fromY + 40) * t - Math.sin(Math.PI * t) * peak;
  drawBallAt(ctx, x, y, 8);
}

function drawScoreboard(ctx: CanvasRenderingContext2D, state: PastBedtimeState) {
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFD23F";
  ctx.fillText(`PTS ${state.score}/${WIN_SCORE}`, 10, 60);
  ctx.textAlign = "right";
  ctx.fillStyle = state.misses >= 3 ? "#FF2E4D" : "#dfe8f5";
  ctx.fillText(
    `MISSES ${"▮".repeat(state.misses)}${"▯".repeat(MAX_MISSES - state.misses)}`,
    WIDTH - 10,
    60,
  );
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
/** The hoop's tap zone (canvas coords) — tapping here shoots. */
export function isGoalTap(_px: number, py: number): boolean {
  return py < 230;
}
