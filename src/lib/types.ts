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
export type GameId = "formal-plunge" | "fix-the-city";

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
  /** Emoji/pixel marquee glyph until real sprites land. */
  glyph: string;
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

export interface PlungeObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Bureaucratic flavor, e.g. "Permit Form B-7". */
  label: string;
}

export interface FormalPlungeState extends BaseGameState {
  /** Diver position + velocity in canvas space. */
  diver: { x: number; y: number; vy: number };
  /** Incoming red-tape gauntlet. */
  obstacles: PlungeObstacle[];
  /** Pools unlocked = wins banked this run. */
  poolsUnlocked: number;
}

/* ---- "Fix the City" — grid-clearing infrastructure sprint ------------- */

/** A single cell hazard the player must clear. */
export interface CityHazard {
  /** Grid column. */
  col: number;
  /** Grid row. */
  row: number;
  type: "pothole" | "blocked-lane" | "debris";
  /** True once the player has cleared it. */
  cleared: boolean;
}

export interface FixTheCityState extends BaseGameState {
  /** Player position on the grid. */
  player: { col: number; row: number };
  grid: { cols: number; rows: number };
  hazards: CityHazard[];
  /** Hazards cleared this run. */
  fixed: number;
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
