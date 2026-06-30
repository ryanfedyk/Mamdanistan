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
    mapPosition: { x: 41, y: 24 }, // East Harlem, just NE of Central Park's top
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
    mapPosition: { x: 50, y: 57 }, // Williamsburg Bridge (red span) over the East River
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
  {
    id: "fare-free-bus",
    title: "Fare-Free Transit Grid",
    tagline: "Tap your MetroCard on nothing. The bus is free now.",
    description:
      "Fare boxes are being quietly decommissioned to make public transit a " +
      "guaranteed city right. All-door boarding, no swipe, no tap, no stress. " +
      "Riders report the bus is somehow faster when nobody's fighting the " +
      "card reader. The MTA's accountants are lying down.",
    borough: "The Bronx",
    neighborhood: "Fordham Road Corridor",
    category: "transit",
    mapPosition: { x: 48.2, y: 62.5 },
    gameSlug: "bus-lane-blitz",
    progress: 35,
    statusBanner: "FARE BOX: DECOMMISSIONED",
    references: [
      { label: "Riders board through every door", kind: "article" },
      { label: "Free routes in service", kind: "metric", value: "5 boroughs" },
      { label: "Avg. boarding time", kind: "metric", value: "−40%" },
    ],
  },
  {
    id: "rent-freeze",
    title: "The Million-Unit Rent Freeze",
    tagline: "1,000,000 apartments. Zero rent hikes. Landlords furious.",
    description:
      "Rents frozen on a million stabilized apartments to protect working-class " +
      "tenants. Somewhere, a landlord refreshes a spreadsheet that refuses to " +
      "go up. Tenants exhale for the first time since the lease was signed.",
    borough: "Brooklyn",
    neighborhood: "Stabilized Units Citywide",
    category: "housing",
    mapPosition: { x: 65.1, y: 50.4 },
    gameSlug: "landlord-invaders",
    progress: 20,
    statusBanner: "RENT: FROZEN SOLID",
    references: [
      { label: "Tenants exhale for the first time", kind: "press" },
      { label: "Stabilized units protected", kind: "metric", value: "1,000,000" },
      { label: "Scheduled rent hikes", kind: "metric", value: "0" },
    ],
  },
  {
    id: "universal-childcare",
    title: "Universal Toddler Oasis",
    tagline: "Free childcare for every 2-year-old. The yacht class is chipping in.",
    description:
      "Universal free childcare for two-year-olds, funded by a modest tax on " +
      "the ultra-rich. Toddlers gain an oasis; hedge funds gain a slightly " +
      "smaller third home. The kids do not care about the discourse. They are " +
      "eating snacks.",
    borough: "Manhattan",
    neighborhood: "East Harlem",
    category: "infrastructure",
    mapPosition: { x: 35.8, y: 22.1 },
    gameSlug: "toddler-tycoon",
    progress: 15,
    statusBanner: "CHILDCARE: UNIVERSAL",
    references: [
      { label: "Funded by taxing the ultra-rich", kind: "article" },
      { label: "2-year-olds covered", kind: "metric", value: "all of them" },
      { label: "Out-of-pocket cost", kind: "metric", value: "$0" },
    ],
  },
  {
    id: "pothole-blitz",
    title: "The 165K Pothole Patch",
    tagline: "165,000 potholes paved. Bureaucracy paved over too.",
    description:
      "A record-pace blitz patching 165,000 road hazards across the five " +
      "boroughs. Your fillings are safe. Your axle is safe. The pothole that " +
      "ate a Honda Civic in 2019 has been brought to justice.",
    borough: "Queens",
    neighborhood: "Citywide Roadways",
    category: "infrastructure",
    mapPosition: { x: 52.4, y: 38.9 },
    gameSlug: "asphalt-attack",
    progress: 78,
    statusBanner: "BUREAUCRACY LEVEL: DEFEATED",
    references: [
      { label: "Road hazards cleared in record time", kind: "article" },
      { label: "Potholes filled", kind: "metric", value: "165,000" },
      { label: "Civics rescued", kind: "metric", value: "countless" },
    ],
  },
];

/** Lookup helper for routing / detail views. */
export function getPinById(id: string): MapPin | undefined {
  return MAP_PINS.find((pin) => pin.id === id);
}

/** Hex accents per win category — campaign palette; keeps markers + cards in sync. */
export const CATEGORY_COLORS: Record<WinCategory, string> = {
  pools: "#241AC9", // electric blue (water)
  infrastructure: "#FF0000", // red
  housing: "#FFA500", // orange
  transit: "#241AC9", // blue
  parks: "#FFA500", // orange
};

/** Pixel-flag glyph per category, used on markers + legend. */
export const CATEGORY_GLYPHS: Record<WinCategory, string> = {
  pools: "🏊",
  infrastructure: "🚧",
  housing: "🏘️",
  transit: "🚌",
  parks: "🌳",
};
