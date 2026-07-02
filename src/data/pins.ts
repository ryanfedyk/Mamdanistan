import type { MapPin, WinCategory } from "@/lib/types";

/**
 * THE GRID — tracked wins + moments.
 * Every entry is a pin on the illustrated map and a card in the dashboard.
 * Positions are percentages (0–100) of the map image. Add pins here; the map
 * and dashboard read straight from this array. No backend, no excuses.
 *
 * Card images are hot-linked from external hosts (YouTube thumbnails for the
 * moments, Wikimedia Commons for the policy stills) — a broken URL just drops
 * the image via PinCard's onError fallback.
 */
export const MAP_PINS: MapPin[] = [
  /* ---- Moments -------------------------------------------------------- */
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
    kind: "moment",
    coordinates: [40.7957, -73.9389],
    mapPosition: { x: 48.1, y: 28.3 },
    progress: 100,
    statusBanner: "POOL SEASON: UNLOCKED",
    image: "https://img.youtube.com/vi/gXIRylGjuwo/hqdefault.jpg",
    imageAlt: "The Formal Plunge at Thomas Jefferson Pool",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the Formal Plunge",
        kind: "press",
        href: "https://www.youtube.com/watch?v=gXIRylGjuwo",
      },
      { label: "Suit-&-tie public swim", kind: "metric", value: "launched" },
      { label: "Outdoor pools open citywide", kind: "metric", value: "11 of 11" },
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
    kind: "moment",
    coordinates: [40.7133, -73.9724],
    mapPosition: { x: 58.9, y: 51.4 },
    progress: 92,
    statusBanner: "BUREAUCRACY LEVEL: DEFEATED",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Williamsburg%20Bridge.jpg",
    imageAlt: "The Williamsburg Bridge over the East River",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Hands-on infrastructure fixes",
        kind: "press",
        href: "https://www.youtube.com/watch?v=gXIRylGjuwo",
      },
      { label: "Potholes patched on approach", kind: "metric", value: "340+" },
      { label: "Protected bike lane repaved", kind: "metric", value: "1.3 mi" },
    ],
  },
  {
    id: "primary-sweep",
    title: "The June '26 Primary Sweep",
    tagline: "Three for three. The machine woke up to a very different map.",
    description:
      "A clean sweep of left-wing congressional upsets in the June 2026 " +
      "primary — turnout the models swore was impossible. Pundits reach for " +
      "the 'anomaly' label; the anomaly keeps winning.",
    borough: "Manhattan",
    neighborhood: "Citywide",
    category: "campaign",
    kind: "moment",
    mapPosition: { x: 50.7, y: 68.4 },
    progress: 100,
    statusBanner: "INCUMBENTS: UPSET",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "Primary night results",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the night unfold",
        kind: "press",
        href: "https://www.youtube.com/watch?v=pHeeNJ7YdEo",
      },
      { label: "Congressional upsets", kind: "metric", value: "3-for-3" },
    ],
  },
  {
    id: "mr-cardamom-roots",
    title: "Mr. Cardamom's Heritage Site",
    tagline: "From rap bars to legislative reform. The pipeline is real.",
    description:
      "The Queens hip-hop lineage that ran from mixtape verses to actual " +
      "policy. A heritage marker for the idea that the mic and the mandate " +
      "share a borough.",
    borough: "Queens",
    neighborhood: "Jackson Heights",
    category: "culture",
    kind: "moment",
    mapPosition: { x: 62.1, y: 41.3 },
    progress: 100,
    statusBanner: "BARS → BILLS",
    image: "https://img.youtube.com/vi/Lc9jD6LU-08/hqdefault.jpg",
    imageAlt: "Mr. Cardamom heritage",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the story",
        kind: "press",
        href: "https://www.youtube.com/watch?v=Lc9jD6LU-08",
      },
      { label: "Origin arc", kind: "metric", value: "rap → reform" },
    ],
  },
  {
    id: "purse-donations",
    title: "The Astoria Purse-Fund",
    tagline: "Working-class trust, five and ten dollars at a time.",
    description:
      "A grassroots donation engine out of Astoria that turned pocket change " +
      "into a machine. No PACs, no yacht money — just a neighborhood deciding " +
      "it had a stake.",
    borough: "Queens",
    neighborhood: "Astoria",
    category: "campaign",
    kind: "moment",
    mapPosition: { x: 59.4, y: 37.8 },
    progress: 100,
    statusBanner: "SMALL DOLLARS: MIGHTY",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "Grassroots small-dollar donations",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the field report",
        kind: "press",
        href: "https://www.youtube.com/watch?v=pHeeNJ7YdEo",
      },
      { label: "Funding engine", kind: "metric", value: "grassroots" },
    ],
  },
  {
    id: "canvass-mobilization",
    title: "100,000 Doors",
    tagline: "The largest grassroots field operation anyone could trace.",
    description:
      "A hundred thousand volunteers knocking, calling, and showing up — a " +
      "ground game measured in city blocks, not ad buys. Democracy as a team " +
      "sport, sticky floor and all.",
    borough: "Brooklyn",
    neighborhood: "Citywide Field",
    category: "campaign",
    kind: "moment",
    mapPosition: { x: 46.5, y: 53.9 },
    progress: 100,
    statusBanner: "FIELD GAME: MAXED",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "Volunteer canvassers",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the ground game",
        kind: "press",
        href: "https://www.youtube.com/watch?v=pHeeNJ7YdEo",
      },
      { label: "Volunteers", kind: "metric", value: "100,000+" },
    ],
  },
  {
    id: "bronx-science-cricket",
    title: "Bronx Science Cricket Pitch",
    tagline: "The high-school cricket club that started a whole arc.",
    description:
      "Origins energy: the first competitive cricket pitch at Bronx Science — " +
      "a reminder that the story starts in a schoolyard before it ever reaches " +
      "City Hall.",
    borough: "The Bronx",
    neighborhood: "Bedford Park",
    category: "culture",
    kind: "moment",
    mapPosition: { x: 39.2, y: 14.6 },
    progress: 100,
    statusBanner: "FIRST PITCH: LAID",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "High-school cricket origins",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the origin",
        kind: "press",
        href: "https://www.youtube.com/watch?v=pHeeNJ7YdEo",
      },
      { label: "Origin", kind: "metric", value: "school club" },
    ],
  },
  {
    id: "knicks-parade",
    title: "The Knicks Ticker-Tape Parade",
    tagline: "Confetti on Broadway. The city exhaled at full volume.",
    description:
      "A 2026 championship ticker-tape parade capped with a City Hall " +
      "ceremony — for one afternoon the discourse paused and the whole town " +
      "just cheered.",
    borough: "Manhattan",
    neighborhood: "Canyon of Heroes",
    category: "culture",
    kind: "moment",
    mapPosition: { x: 47.9, y: 69.1 },
    progress: 100,
    statusBanner: "TITLE: CELEBRATED",
    image: "https://img.youtube.com/vi/WrT1UwRdYxs/hqdefault.jpg",
    imageAlt: "Championship ticker-tape parade",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the parade",
        kind: "press",
        href: "https://www.youtube.com/watch?v=WrT1UwRdYxs",
      },
      { label: "Ceremony", kind: "metric", value: "City Hall" },
    ],
  },
  {
    id: "gracie-mansion-shift",
    title: "Gracie Mansion, Reimagined",
    tagline: "Union culture moves into the mayor's house.",
    description:
      "An alternative-art transition at Gracie Mansion — folding union and " +
      "community culture into the mayoral residence. The people's house, " +
      "actually acting like it.",
    borough: "Manhattan",
    neighborhood: "Yorkville",
    category: "culture",
    kind: "moment",
    mapPosition: { x: 53.6, y: 33.5 },
    progress: 100,
    statusBanner: "RESIDENCY: REMIXED",
    image: "https://img.youtube.com/vi/WrT1UwRdYxs/hqdefault.jpg",
    imageAlt: "Gracie Mansion transition",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the transition",
        kind: "press",
        href: "https://www.youtube.com/watch?v=WrT1UwRdYxs",
      },
      { label: "Residency", kind: "metric", value: "reimagined" },
    ],
  },
  {
    id: "fundraising-capout",
    title: "Capped Out on Small Checks",
    tagline: "$8M primary limit — hit entirely on small-dollar checks.",
    description:
      "The campaign maxed the $8M primary limit without a single big-money " +
      "bundler — small donors did the whole thing. The 'you need billionaires " +
      "to win' thesis quietly deletes itself.",
    borough: "Manhattan",
    neighborhood: "Citywide Donors",
    category: "campaign",
    kind: "moment",
    mapPosition: { x: 48.3, y: 67.2 },
    progress: 100,
    statusBanner: "SMALL DONORS: CAPPED OUT",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "Small-dollar fundraising milestone",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Watch the breakdown",
        kind: "press",
        href: "https://www.youtube.com/watch?v=pHeeNJ7YdEo",
      },
      { label: "Primary limit", kind: "metric", value: "$8M small-dollar" },
    ],
  },

  /* ---- Policy wins ---------------------------------------------------- */
  {
    id: "fare-free-bus",
    title: "Fare-Free Transit Grid",
    tagline: "Tap your MetroCard on nothing. The bus is free now.",
    description:
      "Fare boxes are being quietly decommissioned to make public transit a " +
      "guaranteed city right. All-door boarding, no swipe, no tap, no stress. " +
      "Riders report the bus is somehow faster when nobody's fighting the " +
      "card reader. The MTA's accountants are lying down.",
    borough: "Queens",
    neighborhood: "Citywide Network",
    category: "transit",
    kind: "policy",
    mapPosition: { x: 32.4, y: 58.1 },
    gameSlug: "bus-lane-blitz",
    progress: 35,
    statusBanner: "FARE BOX: DECOMMISSIONED",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/MTA%20Bus%20New%20Flyer.jpg",
    imageAlt: "A fare-free MTA city bus",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "100 days: promising progress",
        kind: "article",
        href: "https://rosalux.nyc/100-days-of-mayor-mamdani-promising-progress/",
      },
      { label: "Fare eliminated", kind: "metric", value: "100%" },
      { label: "Free routes in service", kind: "metric", value: "5 boroughs" },
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
    borough: "Manhattan",
    neighborhood: "Stabilized Units Citywide",
    category: "housing",
    kind: "policy",
    mapPosition: { x: 55.2, y: 64.7 },
    gameSlug: "landlord-invaders",
    progress: 20,
    statusBanner: "RENT: FROZEN SOLID",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Brooklyn%20brownstones.jpg",
    imageAlt: "Rent-stabilized apartment rowhouses",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "100 days: promising progress",
        kind: "press",
        href: "https://rosalux.nyc/100-days-of-mayor-mamdani-promising-progress/",
      },
      { label: "Lease increases approved", kind: "metric", value: "0%" },
      { label: "Stabilized units protected", kind: "metric", value: "1,000,000" },
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
    borough: "The Bronx",
    neighborhood: "South Bronx",
    category: "infrastructure",
    kind: "policy",
    mapPosition: { x: 35.8, y: 22.1 },
    gameSlug: "toddler-tycoon",
    progress: 15,
    statusBanner: "CHILDCARE: UNIVERSAL",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Preschool.jpg",
    imageAlt: "A universal free childcare classroom",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "3-K & 2-Care", kind: "metric", value: "universal" },
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
    kind: "policy",
    mapPosition: { x: 52.4, y: 38.9 },
    gameSlug: "asphalt-attack",
    progress: 78,
    statusBanner: "BUREAUCRACY LEVEL: DEFEATED",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pothole.jpg",
    imageAlt: "A freshly patched pothole",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "Hazards patched", kind: "metric", value: "165,000" },
      { label: "Civics rescued", kind: "metric", value: "countless" },
    ],
  },
  {
    id: "minimum-wage-30",
    title: "The $30 Wage Floor",
    tagline: "Thirty an hour, on the clock. The tip-credit loophole is on notice.",
    description:
      "A staged climb to a $30 minimum wage by 2030 — tip credit folded in. " +
      "Paychecks go up; the 'nobody wants to work anymore' op-ed desk quietly " +
      "downsizes. The floor is rising and it isn't asking permission.",
    borough: "Manhattan",
    neighborhood: "Citywide Payrolls",
    category: "labor",
    kind: "policy",
    mapPosition: { x: 44.1, y: 71.3 },
    progress: 25,
    statusBanner: "WAGE FLOOR: RISING",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Fight%20for%2015%20rally.jpg",
    imageAlt: "Workers rallying for a higher minimum wage",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "Target wage floor", kind: "metric", value: "$30/hr" },
      { label: "Full phase-in", kind: "metric", value: "by 2030" },
    ],
  },
  {
    id: "public-groceries",
    title: "Public Grocery Co-ops",
    tagline: "Groceries at cost. The markup is now optional.",
    description:
      "State-subsidized food co-ops with non-profit cost ceilings, planted " +
      "where the chains pulled out. Milk and produce at cost; the food desert " +
      "gets watered. Somewhere a price-gouging algorithm returns an error.",
    borough: "The Bronx",
    neighborhood: "South Bronx",
    category: "food",
    kind: "policy",
    mapPosition: { x: 28.6, y: 42.4 },
    progress: 30,
    statusBanner: "PRICE GOUGING: CAPPED",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Grocery%20store.jpg",
    imageAlt: "A neighborhood grocery cooperative",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "Cost ceilings", kind: "metric", value: "non-profit" },
    ],
  },
  {
    id: "no-cost-inhalers",
    title: "$0 Inhalers For All",
    tagline: "Breathe free. The copay is extinct.",
    description:
      "A $0-copay rule on asthma inhalers in a city where the wrong ZIP code " +
      "wheezes on principle. The pharmacy counter stops being a toll booth. " +
      "Insurers file a strongly-worded sigh.",
    borough: "The Bronx",
    neighborhood: "Hunts Point",
    category: "health",
    kind: "policy",
    mapPosition: { x: 70.3, y: 18.2 },
    progress: 60,
    statusBanner: "COPAY: ABOLISHED",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Asthma%20inhaler.jpg",
    imageAlt: "A no-cost asthma inhaler",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "Copay", kind: "metric", value: "$0" },
    ],
  },
  {
    id: "social-housing-fund",
    title: "The $70B Social Housing Blueprint",
    tagline: "Seventy billion in public homes. Ground broken, not just promised.",
    description:
      "A ten-year, $70-billion public housing build — homes made to be lived " +
      "in, not flipped. Cranes over vacant lots, no luxury tier on the lease. " +
      "'The market will provide' takes early retirement.",
    borough: "Brooklyn",
    neighborhood: "East New York",
    category: "housing",
    kind: "policy",
    mapPosition: { x: 61.2, y: 78.5 },
    progress: 15,
    statusBanner: "PUBLIC HOMES: FUNDED",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/NYCHA%20housing.jpg",
    imageAlt: "Public social housing",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "Commitment", kind: "metric", value: "$70B" },
      { label: "Procurement horizon", kind: "metric", value: "10 years" },
    ],
  },
  {
    id: "green-school-hubs",
    title: "Green School Microgrids",
    tagline: "Fifty schools off the grid, onto the sun. Blackout-proof recess.",
    description:
      "Fifty campuses turned into climate microgrids — rooftop solar, " +
      "batteries, and a resilience hub for the next heat wave. The gym doubles " +
      "as a cooling center; the power bill becomes a rounding error.",
    borough: "Staten Island",
    neighborhood: "Citywide Campuses",
    category: "climate",
    kind: "policy",
    mapPosition: { x: 19.5, y: 84.1 },
    progress: 40,
    statusBanner: "CAMPUSES: ELECTRIFIED",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Rooftop%20solar%20panels.jpg",
    imageAlt: "Rooftop solar panels on a school",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "Campuses upgraded", kind: "metric", value: "50" },
    ],
  },
  {
    id: "anti-junk-fees",
    title: "The Junk-Fee Guillotine",
    tagline: "The price on the tag is the price you pay. Revolutionary, apparently.",
    description:
      "An all-in pricing mandate — no surprise 'service,' 'convenience,' or " +
      "'because-we-can' fees at checkout. Ticket resellers and delivery apps " +
      "discover honesty. The fine print files for unemployment.",
    borough: "Manhattan",
    neighborhood: "Consumer Protection",
    category: "consumer",
    kind: "policy",
    mapPosition: { x: 49.8, y: 66.2 },
    progress: 55,
    statusBanner: "HIDDEN FEES: BANNED",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Receipt.jpg",
    imageAlt: "An all-in price receipt",
    imageCredit: "via Wikimedia Commons",
    references: [
      {
        label: "Mayor's 100 days: the agenda",
        kind: "article",
        href: "https://www.nyc.gov/content/100days/pages/",
      },
      { label: "Pricing", kind: "metric", value: "all-in" },
      { label: "Hidden fees", kind: "metric", value: "banned" },
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
  labor: "#7C3AED", // purple
  health: "#14B8A6", // teal
  food: "#16A34A", // green
  climate: "#0EA5E9", // sky blue
  consumer: "#F59E0B", // amber
  campaign: "#4F46E5", // indigo
  culture: "#EC4899", // pink
};

/** Pixel-flag glyph per category, used on markers + legend. */
export const CATEGORY_GLYPHS: Record<WinCategory, string> = {
  pools: "🏊",
  infrastructure: "🚧",
  housing: "🏘️",
  transit: "🚌",
  parks: "🌳",
  labor: "💵",
  health: "🩺",
  food: "🥕",
  climate: "☀️",
  consumer: "🏷️",
  campaign: "🗳️",
  culture: "🎭",
};
