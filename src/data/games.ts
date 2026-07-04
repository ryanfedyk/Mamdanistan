import type { ArcadeCabinet } from "@/lib/types";

/**
 * THE ARCADE — cabinet catalog.
 * Drives the arcade hub menu. Each entry maps to a route under /arcade.
 */
export const ARCADE_CABINETS: ArcadeCabinet[] = [
  {
    id: "formal-plunge",
    title: "Formal Plunge",
    blurb: "Suit up. Dive in. Dodge the billionaires.",
    howToPlay:
      "Tap to launch Zohran off the high board. He swims the lap on his own — " +
      "you press UP / DOWN (or ↑ ↓ / W S) to glide and dodge the billionaires " +
      "crashing the public pool: rocket-suit bros, robber barons, cash-divers, " +
      "and swan-float tycoons. One touch drags you under.",
    accent: "mamdani-mint",
    glyph: "🏊",
    hero: "/games/formal-plunge-hero.webp",
    heroThumb: "/games/formal-plunge-icon.webp",
    status: "playable",
  },
  {
    id: "landlord-invaders",
    title: "Landlord Invaders",
    blurb: "Freeze the rent. Evict the evictors.",
    howToPlay:
      "Slide your Rent-Freeze cannon with the ◀ ▶ buttons (or arrow keys) " +
      "and TAP FIRE (or SPACE) to launch eviction notices at the descending " +
      "rent-hike landlords. Clear the board before one reaches street level.",
    accent: "mamdani-red",
    glyph: "💼",
    status: "stub",
  },
  {
    id: "bus-lane-blitz",
    title: "Bus Lane Blitz",
    blurb: "Dodge the clutter. Free the bus.",
    howToPlay:
      "Use UP / DOWN (or the D-pad) to switch lanes and keep your fare-free " +
      "bus out of double-parked cars, cones, and dead fare boxes. Survive the " +
      "clock to blitz the bus lane wide open.",
    accent: "mamdani-cyan",
    glyph: "🚌",
    status: "stub",
  },
  {
    id: "toddler-tycoon",
    title: "Toddler Tycoon",
    blurb: "Catch every kid. Childcare for all.",
    howToPlay:
      "Slide the Toddler Oasis with ◀ ▶ (or the D-pad) to catch toddlers " +
      "raining from the sky into free childcare. Survive the clock — drop too " +
      "many and the program goes 'under review.'",
    accent: "mamdani-gold",
    glyph: "🧒",
    status: "stub",
  },
  {
    id: "asphalt-attack",
    title: "Asphalt Attack",
    blurb: "Patch potholes. Pave over bureaucracy.",
    howToPlay:
      "TAP potholes as they erupt across the grid to patch them before they " +
      "cure into permanent craters. Survive the clock; let too many set and " +
      "the road wins.",
    accent: "mamdani-ember",
    glyph: "🕳️",
    status: "stub",
  },
  {
    id: "hot-mic",
    title: "Hot Take",
    blurb: "Survive the press. Stay on message.",
    howToPlay:
      "A hostile interview gauntlet. Each question is a trap — pick the answer " +
      "that pivots back to local material wins (pools, rent, buses). Stay on " +
      "message to build Momentum and starve the Noise meter. Take the bait and " +
      "you become the headline.",
    accent: "mamdani-cyan",
    glyph: "🎙️",
    status: "playable",
  },
  {
    id: "fix-the-city",
    title: "Fix the City",
    blurb: "Cross the traffic. Patch every hazard. Beat the gridlock.",
    howToPlay:
      "Frogger-style. Hop across lanes of moving traffic with the D-pad (or " +
      "arrows / WASD) to reach potholes, cones, debris, hydrants, and dead " +
      "signals — stop on each to fix it. New jobs keep popping up; clear the " +
      "whole quota before the clock runs out. Get clipped by a car and you're " +
      "knocked back to the depot, minus precious seconds.",
    accent: "mamdani-ember",
    glyph: "🚧",
    hero: "/games/fix-the-city-hero.webp",
    heroThumb: "/games/fix-the-city-icon.webp",
    status: "playable",
  },
];

/** Lookup helper for the per-game cabinet pages. */
export function getCabinet(id: string): ArcadeCabinet | undefined {
  return ARCADE_CABINETS.find((c) => c.id === id);
}
