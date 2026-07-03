import type { MapPin, WinCategory } from "@/lib/types";

/**
 * THE GRID — tracked wins + moments.
 * Every entry is a pin on the illustrated map and a card in the dashboard.
 * Positions are percentages (0–100) of the map image. Add pins here; the map
 * and dashboard read straight from this array. No backend, no excuses.
 *
 * Card images + source links are hot-linked from external hosts (YouTube
 * thumbnails for the moments; NYC.gov, news outlets, and press stills for the
 * policy wins) — a broken URL just drops the image via PinCard's onError
 * fallback.
 */
export const MAP_PINS: MapPin[] = [
  /* ---- Moments -------------------------------------------------------- */
  {
    id: "formal-plunge",
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
    mapPosition: { x: 46, y: 33 },
    progress: 100,
    statusBanner: "POOL SEASON: UNLOCKED",
    image: "https://img.youtube.com/vi/daL_SR_IZuE/hqdefault.jpg",
    imageAlt: "The Formal Plunge at Thomas Jefferson Pool",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Why he took the plunge",
        kind: "press",
        href: "https://m.economictimes.com/news/new-updates/why-did-new-york-mayor-zohran-mamdani-jump-into-a-public-pool-fully-clothed-breaking-the-pool-dress-code-tradition-explained/articleshow/132045884.cms",
      },
      { label: "Suit-&-tie public swim", kind: "metric", value: "launched" },
      { label: "Outdoor pools open citywide", kind: "metric", value: "11 of 11" },
    ],
  },
  {
    id: "bridge-repair",
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
    mapPosition: { x: 52.5, y: 73.5 },
    progress: 92,
    statusBanner: "BUREAUCRACY LEVEL: DEFEATED",
    image: "https://img.youtube.com/vi/owzcyCMvz-Y/hqdefault.jpg",
    imageAlt: "The Williamsburg Bridge over the East River",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Streetsblog · grab a shovel",
        kind: "press",
        href: "https://nyc.streetsblog.org/2026/01/06/grab-a-shovel-mayor-mamdani-begins-fix-of-williamsburg-bridge-shitshow",
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
    mapPosition: { x: 37, y: 46 },
    progress: 100,
    statusBanner: "INCUMBENTS: UPSET",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "Primary night results",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Guardian · primary results",
        kind: "press",
        href: "https://www.theguardian.com/us-news/2026/jun/23/new-york-primary-results-house",
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
    mapPosition: { x: 92, y: 38 },
    progress: 100,
    statusBanner: "BARS → BILLS",
    image: "https://img.youtube.com/vi/Lc9jD6LU-08/hqdefault.jpg",
    imageAlt: "Mr. Cardamom heritage",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Guardian · Mr. Cardamom",
        kind: "press",
        href: "https://www.theguardian.com/music/2019/may/10/mr-cardamom-madhur-jaffrey-nani-video",
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
    mapPosition: { x: 81, y: 21 },
    progress: 100,
    statusBanner: "SMALL DOLLARS: MIGHTY",
    image: "https://img.youtube.com/vi/h-hmxt6NdMg/hqdefault.jpg",
    imageAlt: "Grassroots small-dollar donations",
    imageCredit: "via YouTube",
    references: [
      {
        label: "CBS · $3M transition fund",
        kind: "press",
        href: "https://www.cbsnews.com/newyork/news/zohran-mamdani-transition-expenses-fundraising-3-million/",
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
    mapPosition: { x: 72, y: 66 },
    progress: 100,
    statusBanner: "FIELD GAME: MAXED",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "Volunteer canvassers",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Citizens Union report (PDF)",
        kind: "article",
        href: "https://citizensunion.org/wp-content/uploads/2025/08/Citizens-Union-How-Big-Money-Lost-and-Small-Donors-Won-in-the-2025-NYC-Primary.pdf",
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
    mapPosition: { x: 50, y: 5 },
    progress: 100,
    statusBanner: "FIRST PITCH: LAID",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "High-school cricket origins",
    imageCredit: "via YouTube",
    references: [
      {
        label: "r/Cricket · the origin",
        kind: "article",
        href: "https://www.reddit.com/r/Cricket/comments/1oq8jxh/new_yorks_new_mayor_zohran_k_mamdani_once_played/",
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
    mapPosition: { x: 30, y: 78 },
    progress: 100,
    statusBanner: "TITLE: CELEBRATED",
    image: "https://img.youtube.com/vi/sdQXhisDTtA/hqdefault.jpg",
    imageAlt: "Championship ticker-tape parade",
    imageCredit: "via YouTube",
    references: [
      {
        label: "NYC.gov · parade & ceremony",
        kind: "article",
        href: "https://www.nyc.gov/mayors-office/news/2026/06/mayor-mamdani-announces-ticker-tape-parade-and-city-hall-ceremon",
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
    mapPosition: { x: 48, y: 39 },
    progress: 100,
    statusBanner: "RESIDENCY: REMIXED",
    image: "https://img.youtube.com/vi/SJzK8Ih6P8g/hqdefault.jpg",
    imageAlt: "Gracie Mansion transition",
    imageCredit: "via YouTube",
    references: [
      {
        label: "CBS · Gracie Mansion",
        kind: "press",
        href: "https://www.cbsnews.com/newyork/news/zohran-mamdani-gracie-mansion/",
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
    mapPosition: { x: 25, y: 59 },
    progress: 100,
    statusBanner: "SMALL DONORS: CAPPED OUT",
    image: "https://img.youtube.com/vi/pHeeNJ7YdEo/hqdefault.jpg",
    imageAlt: "Small-dollar fundraising milestone",
    imageCredit: "via YouTube",
    references: [
      {
        label: "Citizens Union report (PDF)",
        kind: "article",
        href: "https://citizensunion.org/wp-content/uploads/2025/08/Citizens-Union-How-Big-Money-Lost-and-Small-Donors-Won-in-the-2025-NYC-Primary.pdf",
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
    mapPosition: { x: 85, y: 42 },
    gameSlug: "bus-lane-blitz",
    progress: 35,
    statusBanner: "FARE BOX: DECOMMISSIONED",
    image:
      "https://s7d2.scene7.com/is/image/TWCNews/mamdani_lieber_flynn_buses_Cropped?wid=1250&hei=703&$wide-bg$",
    imageAlt: "A fare-free MTA city bus",
    imageCredit: "via Spectrum News NY1",
    references: [
      {
        label: "Rosa Lux · 100 days",
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
    mapPosition: { x: 36, y: 64 },
    gameSlug: "landlord-invaders",
    progress: 20,
    statusBanner: "RENT: FROZEN SOLID",
    image:
      "https://preview.redd.it/mamdanis-rent-freeze-is-approved-by-new-york-city-board-v0-sc9oix6i2x9h1.png?width=1080&crop=smart&auto=webp&s=b33fadba527841154a2d5bccdf916598b6bdc5ee",
    imageAlt: "Rent-stabilized apartment rowhouses",
    imageCredit: "via Reddit",
    references: [
      {
        label: "NYT · rent-freeze vote",
        kind: "press",
        href: "https://www.nytimes.com/2026/06/25/nyregion/nyc-rent-freeze-vote-mamdani.html",
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
    mapPosition: { x: 58, y: 6 },
    gameSlug: "toddler-tycoon",
    progress: 15,
    statusBanner: "CHILDCARE: UNIVERSAL",
    image:
      "https://www.nyc.gov/adobe/dynamicmedia/deliver/dm-aid--911cb3e0-19be-4b32-8217-875ffc940d0d/mayor-mamdani---governor-hochul-to-launch-free-child-care-for-tw--1-jpg.webp?preferwebp=true",
    imageAlt: "A universal free childcare classroom",
    imageCredit: "via NYC.gov",
    references: [
      {
        label: "NYC.gov · free child care",
        kind: "article",
        href: "https://www.nyc.gov/mayors-office/news/2026/01/mayor-mamdani---governor-hochul-to-launch-free-child-care-for-tw",
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
    mapPosition: { x: 72, y: 36 },
    gameSlug: "asphalt-attack",
    progress: 78,
    statusBanner: "BUREAUCRACY LEVEL: DEFEATED",
    image:
      "https://www.nyc.gov/mayors-office/news/2026/04/mayor-mamdani-fills-100-000th-pothole-in-first-100-days/_jcr_content/root/container_481968979/container/initialContent/image.coreimg.jpeg/1775501424772/mayor-mamdani-fills-100-000th-pothole-in-first-100-days--1.jpeg",
    imageAlt: "A freshly patched pothole",
    imageCredit: "via NYC.gov",
    references: [
      {
        label: "NYC.gov · 100,000th pothole",
        kind: "article",
        href: "https://www.nyc.gov/mayors-office/news/2026/04/mayor-mamdani-fills-100-000th-pothole-in-first-100-days",
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
    mapPosition: { x: 30, y: 52 },
    progress: 25,
    statusBanner: "WAGE FLOOR: RISING",
    image:
      "https://cdn.cityandstateny.com/media/img/cd/2025/02/13/Zohran_Mamdani_Uri_Thier/860x394.jpg?1739487042",
    imageAlt: "Workers rallying for a higher minimum wage",
    imageCredit: "via City & State NY",
    references: [
      {
        label: "City & State · $30/30 plan",
        kind: "article",
        href: "https://www.cityandstateny.com/policy/2025/02/mamdani-unveils-30-30-minimum-wage-push-part-mayoral-campaign/403015/",
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
    mapPosition: { x: 43, y: 5 },
    progress: 30,
    statusBanner: "PRICE GOUGING: CAPPED",
    image:
      "https://www.nyc.gov/adobe/dynamicmedia/deliver/dm-aid--bfc4d0c0-6190-4701-84f0-e6ca5035b733/mayor-mamdani-announces-la-marqueta-as-first-site-identified-for--1-jpg.webp?preferwebp=true",
    imageAlt: "A neighborhood grocery cooperative",
    imageCredit: "via NYC.gov",
    references: [
      {
        label: "NYC.gov · La Marqueta site",
        kind: "article",
        href: "https://www.nyc.gov/mayors-office/news/2026/04/mayor-mamdani-announces-la-marqueta-as-first-site-identified-for",
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
    mapPosition: { x: 67, y: 9 },
    progress: 60,
    statusBanner: "COPAY: ABOLISHED",
    image:
      "https://cdn.britannica.com/68/274768-050-25BE2F57/Zohran-Mamdani-Democratic-nominee-New-York-City-mayor-campaigning-April-2025.jpg",
    imageAlt: "A no-cost asthma inhaler",
    imageCredit: "via Britannica",
    references: [
      {
        label: "NYC.gov · enrollment push",
        kind: "article",
        href: "https://www.nyc.gov/mayors-office/news/2026/07/mayor-mamdani--nyc-health-agencies-intensify-enrollment-in-low--",
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
    mapPosition: { x: 86, y: 73 },
    progress: 15,
    statusBanner: "PUBLIC HOMES: FUNDED",
    image:
      "https://newyorkyimby.com/wp-content/uploads/2022/01/1225-Gerard-Avenue-Concourse-The-Bronx.jpg",
    imageAlt: "Public social housing",
    imageCredit: "via New York YIMBY",
    references: [
      {
        label: "NYC.gov · River Commons",
        kind: "article",
        href: "https://www.nyc.gov/mayors-office/news/2026/06/mayor-mamdani-breaks-ground-on--255-million-river-commons-develo",
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
    mapPosition: { x: 32, y: 85 },
    progress: 40,
    statusBanner: "CAMPUSES: ELECTRIFIED",
    image:
      "https://www.thenation.com/wp-content/uploads/2025/04/Zohran-Mamdani-AFP-Getty.jpg",
    imageAlt: "Rooftop solar panels on a school",
    imageCredit: "via The Nation",
    references: [
      {
        label: "The Nation · green schools",
        kind: "article",
        href: "https://www.thenation.com/article/environment/zohran-mamdani-green-schools-plan-climate/",
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
    mapPosition: { x: 41, y: 59 },
    progress: 55,
    statusBanner: "HIDDEN FEES: BANNED",
    image: "https://img.youtube.com/vi/F-doQOgXjxM/hqdefault.jpg",
    imageAlt: "An all-in price receipt",
    imageCredit: "via YouTube",
    references: [
      {
        label: "NYC.gov · junk-fee ban",
        kind: "article",
        href: "https://www.nyc.gov/mayors-office/news/2026/01/mamdani-administration-bans-hotel-hidden-fees-and-unexpected-cre",
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
