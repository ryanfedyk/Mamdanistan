import type { MapPin, WinCategory } from "@/lib/types";

/**
 * THE GRID — seed intelligence.
 * Two confirmed wins to establish the schema. Add pins here; the map and
 * the dashboard read straight from this array. No backend, no excuses.
 */
export const MAP_PINS: MapPin[] = [
  {
    id: "thomas-jefferson-pool",
    title: "Thomas Jefferson Pool",
    tagline: "He wore the suit. He took the dive. The season is open.",
    description:
      "Opening day at the outdoor pool was supposed to be a ribbon-cutting. " +
      "Instead, a fully-suited cannonball heard 'round East Harlem. Free " +
      "community swim programming expanded the same week. Lifeguards: hired. " +
      "Vibes: immaculate. Concerned op-ed writers: sweating.",
    borough: "Manhattan",
    neighborhood: "East Harlem",
    category: "pools",
    coordinates: [40.7957, -73.9389],
    progress: 100,
    statusBanner: "POOL SEASON: UNLOCKED",
    references: [
      {
        label: "The Formal Plunge, frame by frame",
        kind: "press",
      },
      {
        label: "Free swim slots added this summer",
        kind: "metric",
        value: "+18 sessions/wk",
      },
      {
        label: "Outdoor pools open citywide",
        kind: "metric",
        value: "11 of 11",
      },
    ],
  },
  {
    id: "williamsburg-bridge",
    title: "Williamsburg Bridge",
    tagline: "The bumps are gone. The bike lane is glorious. You're welcome.",
    description:
      "Notorious for rattling fillings loose, the bridge approach got the " +
      "hands-on treatment — potholes patched and bike lanes repaved shoulder " +
      "to shoulder with city crews. Commuters report a suspicious absence of " +
      "suffering. Investigations into 'who fixed it' are ongoing.",
    borough: "Brooklyn",
    neighborhood: "Williamsburg ↔ Lower East Side",
    category: "infrastructure",
    coordinates: [40.7133, -73.9724],
    progress: 92,
    statusBanner: "BUREAUCRACY LEVEL: DEFEATED",
    references: [
      {
        label: "Crews tackle the infamous 'bumps'",
        kind: "article",
      },
      {
        label: "Potholes patched on approach",
        kind: "metric",
        value: "340+",
      },
      {
        label: "Protected bike lane repaved",
        kind: "metric",
        value: "1.3 mi",
      },
    ],
  },
];

/** Lookup helper for routing / detail views. */
export function getPinById(id: string): MapPin | undefined {
  return MAP_PINS.find((pin) => pin.id === id);
}

/** Hex accents per win category — campaign palette; keeps markers + cards in sync. */
export const CATEGORY_COLORS: Record<WinCategory, string> = {
  pools: "#2619D1", // brand electric blue (water)
  infrastructure: "#F0431F", // brand red-orange
  housing: "#FFAB00", // brand amber-orange
  transit: "#5B6FE0", // soft sky blue
  parks: "#5F8A3A", // 70s olive green
};

/** Pixel-flag glyph per category, used on markers + legend. */
export const CATEGORY_GLYPHS: Record<WinCategory, string> = {
  pools: "🏊",
  infrastructure: "🚧",
  housing: "🏘️",
  transit: "🚌",
  parks: "🌳",
};
