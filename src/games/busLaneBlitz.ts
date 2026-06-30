import type { BaseGameState, GameEngine, GamePhase } from "@/lib/types";

/**
 * "BUS LANE BLITZ" — a lane-runner.
 * Your fare-free bus barrels down the avenue; double-parked cars, cones, and
 * decommissioned fare boxes clog the lanes. Switch lanes (up/down) to keep a
 * clear path and survive the clock to blitz the bus lane open.
 */

const W = 440;
const H = 300;
const LANES = 4;
const LANE_H = H / LANES;
const BUS_X = 60;
const BUS_W = 56;
const BUS_H = LANE_H * 0.56;
const OBS_W = 42;
const OBS_H = LANE_H * 0.56;
const START_TIME = 30;

type ObsKind = "car" | "cone" | "farebox";
interface Obstacle {
  lane: number;
  x: number;
  kind: ObsKind;
}

export interface BusLaneBlitzState extends BaseGameState {
  lane: number;
  obstacles: Obstacle[];
  cleared: number;
}

const KINDS: ObsKind[] = ["car", "cone", "farebox"];
const GLYPH: Record<ObsKind, string> = { car: "🚗", cone: "🚧", farebox: "💳" };

const laneY = (lane: number) => lane * LANE_H + (LANE_H - BUS_H) / 2;

export const busLaneBlitz: GameEngine<BusLaneBlitzState> = {
  init(): BusLaneBlitzState {
    return {
      phase: "attract",
      score: 0,
      timeLeft: START_TIME,
      frame: 0,
      lane: 1,
      obstacles: [],
      cleared: 0,
    };
  },

  handleInput(state, intent) {
    if (intent === "start") {
      if (state.phase === "playing") return state;
      return { ...busLaneBlitz.init(), phase: "playing" };
    }
    if (intent === "reset") return busLaneBlitz.init();
    if (state.phase !== "playing") return state;
    if (intent === "up") return { ...state, lane: Math.max(0, state.lane - 1) };
    if (intent === "down")
      return { ...state, lane: Math.min(LANES - 1, state.lane + 1) };
    return state;
  },

  update(state, deltaMs) {
    if (state.phase !== "playing" || state.timeLeft === null) return state;
    const frame = state.frame + 1;
    const timeLeft = state.timeLeft - deltaMs / 1000;
    if (timeLeft <= 0) return { ...state, frame, timeLeft: 0, phase: "won" };

    const elapsed = START_TIME - timeLeft;
    const speed = 2.6 + elapsed * 0.12;
    let score = state.score;
    let cleared = state.cleared;

    // Scroll obstacles; score the ones that exit the left edge.
    const obstacles: Obstacle[] = [];
    for (const o of state.obstacles) {
      const x = o.x - speed;
      if (x < -OBS_W) {
        score += 10;
        cleared += 1;
      } else {
        obstacles.push({ ...o, x });
      }
    }

    // Spawn, faster over time, never stacking in the same lane.
    const interval = Math.max(20, 46 - Math.floor(elapsed * 1.1));
    if (frame % interval === 0) {
      const lane = Math.floor(Math.random() * LANES);
      if (!obstacles.some((o) => o.lane === lane && o.x > W - 50)) {
        obstacles.push({
          lane,
          x: W + 10,
          kind: KINDS[Math.floor(Math.random() * KINDS.length)],
        });
      }
    }

    // Collision in the player's lane.
    const hit = obstacles.some(
      (o) => o.lane === state.lane && o.x < BUS_X + BUS_W && o.x + OBS_W > BUS_X,
    );
    const phase: GamePhase = hit ? "gameover" : "playing";

    return { ...state, frame, timeLeft, obstacles, score, cleared, phase };
  },

  render(ctx, state) {
    ctx.fillStyle = "#0B0E1A";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(33,212,253,0.18)";
    ctx.lineWidth = 1;
    for (let l = 1; l < LANES; l++) {
      ctx.beginPath();
      ctx.moveTo(0, l * LANE_H);
      ctx.lineTo(W, l * LANE_H);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(61,220,151,0.10)";
    ctx.fillRect(0, state.lane * LANE_H, W, LANE_H);

    ctx.font = "20px monospace";
    ctx.textAlign = "center";
    for (const o of state.obstacles) {
      const y = laneY(o.lane);
      ctx.fillText(GLYPH[o.kind], o.x + OBS_W / 2, y + OBS_H / 2 + 7);
    }

    const by = laneY(state.lane);
    ctx.fillStyle = "#3DDC97";
    ctx.fillRect(BUS_X, by, BUS_W, BUS_H);
    ctx.fillStyle = "#0B0E1A";
    ctx.fillText("🚌", BUS_X + BUS_W / 2, by + BUS_H / 2 + 7);

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFD23F";
    ctx.font = "10px monospace";
    ctx.fillText(`SCORE ${state.score}`, 10, 16);

    if (state.phase === "attract") banner(ctx, "UP / DOWN — KEEP THE LANE CLEAR");
    else if (state.phase === "won") banner(ctx, "BUS LANE BLITZED — FARE-FREE!");
    else if (state.phase === "gameover") banner(ctx, "FENDER BENDER — TAP RESET");
  },
};

function banner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(11,14,26,0.78)";
  ctx.fillRect(0, H / 2 - 16, W, 32);
  ctx.fillStyle = "#21D4FD";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H / 2 + 3);
  ctx.textAlign = "left";
}

export const BUS_LANE_BLITZ_DIMENSIONS = { width: W, height: H };
