/**
 * Mamdanistan — Core Type System
 * ==============================
 * Two domains, one revolution:
 *   1. Spatial logic  → The Grid (Impact Map)
 *   2. Game loops      → The Arcade (canvas mini-games)
 *
 * Keep these interfaces flat and scannable. The map and the arcade
 * never import each other's runtime code — only these shared shapes.
 */

/* ======================================================================
 * THE GRID — spatial / map domain
 * ==================================================================== */

/** The five boroughs, our entire theater of operations. */
export type Borough =
  | "Manhattan"
  | "Brooklyn"
  | "Queens"
  | "The Bronx"
  | "Staten Island";

/** Geographic point in [lat, lng] order (Leaflet's native convention). */
export type LatLng = [number, number];

/** The flavor of win — drives pin color + pixel-flag iconography. */
export type WinCategory =
  | "pools" // free public swimming, formal dives encouraged
  | "infrastructure" // potholes, bridges, bike lanes
  | "housing" // material wins for tenants
  | "transit" // buses, ferries, fare relief
  | "parks"; // green space, public commons

/** A press clip, news article, or policy metric attached to a win. */
export interface PinReference {
  /** Headline-style label. Lean into the satire. */
  label: string;
  /** Optional outbound link (press, gov record, etc.). */
  href?: string;
  /** Distinguishes a citation from a hard number. */
  kind: "article" | "press" | "metric";
  /** For kind === "metric": the bragworthy figure, e.g. "1,200 swims/day". */
  value?: string;
}

/**
 * A single tracked win on the tactical map.
 * Clicking its pin pulls this whole object into the localized card view.
 */
export interface MapPin {
  /** Stable slug used for routing + React keys. */
  id: string;
  /** Display name of the site. */
  title: string;
  /** One-line, witty, on-brand summary. */
  tagline: string;
  /** Longer card body — still satirical, still local. */
  description: string;
  borough: Borough;
  /** Human-readable neighborhood, e.g. "East Harlem". */
  neighborhood: string;
  category: WinCategory;
  /** Optional real-world geo point (legacy; the illustrated map uses mapPosition). */
  coordinates?: LatLng;
  /**
   * Position on the illustrated map, as percentages (0–100) of the image's
   * width/height. Used to place the pin overlay. Omit to hide the pin.
   */
  mapPosition?: { x: number; y: number };
  /** Optional arcade cabinet slug this win links to (e.g. "fix-the-city"). */
  gameSlug?: string;
  /** 0–100. Drives the cheeky progress bar on the card. */
  progress: number;
  /** Pixel-flag status banner, e.g. "BUREAUCRACY LEVEL: DEFEATED". */
  statusBanner: string;
  references: PinReference[];
}

/* ======================================================================
 * THE ARCADE — game-loop domain
 * ==================================================================== */

/** Every mini-game advances through this lifecycle. */
export type GamePhase = "attract" | "playing" | "paused" | "won" | "gameover";

/** Identifiers for the seeded cabinets. */
export type GameId =
  | "formal-plunge"
  | "fix-the-city"
  | "landlord-invaders"
  | "bus-lane-blitz"
  | "toddler-tycoon"
  | "asphalt-attack"
  | "hot-mic";

/** Catalog entry shown on the arcade hub menu. */
export interface ArcadeCabinet {
  id: GameId;
  title: string;
  /** Marquee one-liner under the title. */
  blurb: string;
  /** Longer "insert coin" description. */
  howToPlay: string;
  /** Tailwind accent color token, e.g. "mamdani-cyan". */
  accent: string;
  /** Emoji/pixel marquee glyph — the fallback when no hero art exists. */
  glyph: string;
  /** Wide marquee/hero art (webp). Used as the game's icon everywhere it's
   *  linked from; falls back to `glyph` when absent. */
  hero?: string;
  /** Smaller webp for compact tiles and icons. */
  heroThumb?: string;
  /** Ships a playable loop yet? */
  status: "playable" | "stub";
}

/**
 * Shared base for every game's runtime state. Individual games extend
 * this with their own fields. Kept minimal so the render loop stays cheap.
 */
export interface BaseGameState {
  phase: GamePhase;
  score: number;
  /** Seconds remaining on the ticking clock; null = untimed. */
  timeLeft: number | null;
  /** Monotonic frame counter, handy for sprite animation. */
  frame: number;
}

/* ---- "Formal Plunge" — suited physics diver --------------------------- */

/** The pool-crashing billionaires Zohran has to dodge. */
export type BillionaireKind = "elon" | "baron" | "snorkeler" | "swan";

export interface PlungeObstacle {
  /** Center position + full sprite box in canvas space. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Which billionaire this is — drives sprite + size. */
  kind: BillionaireKind;
  /** Per-enemy phase seed for animation + vertical bob. */
  seed: number;
}

export interface FormalPlungeState extends BaseGameState {
  /** "dive" plays the scripted plunge; "swim" is the dodging loop. */
  mode: "dive" | "swim";
  /** Frames elapsed inside the dive animation. */
  diveT: number;
  /** Zohran's position + vertical velocity in canvas space. */
  diver: { x: number; y: number; vy: number };
  /** Incoming bureaucrats & naysayers to dodge. */
  obstacles: PlungeObstacle[];
  /** Frame index at which the next foe spawns. */
  nextSpawn: number;
  /** How far the pool background has scrolled (px) — drives the moving water. */
  bgScroll: number;
  /** Finish-line x once it appears (null until the home stretch), in canvas px. */
  finishX: number | null;
  /** Laps banked = wins racked up this run. */
  poolsUnlocked: number;
}

/* ---- "Fix the City" — Frogger-style traffic-dodging repair sprint ------ */

/** Kinds of infrastructure hazard the player must patch. */
export type CityHazardType =
  | "pothole"
  | "construction"
  | "debris"
  | "hydrant"
  | "signal";

/** A single repair job that pops up on a traffic lane (whack-a-mole). */
export interface CityHazard {
  /** Grid column. */
  col: number;
  /** Grid row (always a traffic lane). */
  row: number;
  type: CityHazardType;
  /** 0→1 pop-in animation progress. */
  pop: number;
}

/** A car streaming across one traffic lane. */
export interface TrafficCar {
  /** Lane row it travels in. */
  row: number;
  /** Center x in canvas px. */
  x: number;
  /** Horizontal velocity in px/sec (sign = direction). */
  vx: number;
  /** Body width in px. */
  w: number;
}

export interface FixTheCityState extends BaseGameState {
  /** Player position on the grid. */
  player: { col: number; row: number };
  grid: { cols: number; rows: number };
  /** Active repair jobs on the board. */
  hazards: CityHazard[];
  /** Live traffic. */
  cars: TrafficCar[];
  /** Total repairs needed to win. */
  quota: number;
  /** Repairs completed this run. */
  fixed: number;
  /** Seconds of post-hit invulnerability remaining. */
  invuln: number;
  /** Times struck by traffic this run. */
  hits: number;
  /** Seconds until the next hazard may pop up. */
  spawnTimer: number;
}

/**
 * The contract every canvas game implements. Pure-ish functions so the
 * loop is testable and the render layer stays dumb. `update` is called
 * once per animation frame with the elapsed delta (ms).
 */
export interface GameEngine<TState extends BaseGameState> {
  init: () => TState;
  update: (state: TState, deltaMs: number) => TState;
  /** Translate an input intent into a new state (jump, move, etc.). */
  handleInput: (state: TState, intent: string) => TState;
  render: (ctx: CanvasRenderingContext2D, state: TState) => void;
}
