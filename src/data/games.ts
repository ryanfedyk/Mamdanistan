import type { ArcadeCabinet } from "@/lib/types";

/**
 * THE ARCADE — cabinet catalog.
 * Drives the arcade hub menu. Each entry maps to a route under /arcade.
 */
export const ARCADE_CABINETS: ArcadeCabinet[] = [
  {
    id: "formal-plunge",
    title: "Formal Plunge",
    blurb: "Suit up. Dive in. Unlock the pools.",
    howToPlay:
      "Press SPACE to flap your blazer and stay airborne. Thread past " +
      "Permit Forms, Zoning Hearings, and Community Board Vol. IV to splash " +
      "down clean and unlock another public pool.",
    accent: "mamdani-mint",
    glyph: "🤿",
    status: "stub",
  },
  {
    id: "fix-the-city",
    title: "Fix the City",
    blurb: "Clear the lanes. Patch the potholes. Beat the clock.",
    howToPlay:
      "Use the ARROW KEYS to roll across the grid. Stop on every pothole, " +
      "blocked lane, and pile of debris to clear it before the bureaucratic " +
      "clock runs out. Gridlock is the only true enemy.",
    accent: "mamdani-ember",
    glyph: "🚧",
    status: "stub",
  },
];

/** Lookup helper for the per-game cabinet pages. */
export function getCabinet(id: string): ArcadeCabinet | undefined {
  return ARCADE_CABINETS.find((c) => c.id === id);
}
