# 🚩 Welcome to Mamdanistan

> The potholes are fixed. The pools are open. **Panic accordingly.**

A tongue-in-cheek, self-aware civic dashboard and retro arcade. It co-opts
sensationalized "socialist takeover" tropes to frame standard municipal
maintenance — pool openings, pothole repairs, neighborhood wins — as
high-stakes 16-bit arcade missions.

**Tone:** satirical, deeply local, unapologetically witty.

**Aesthetic — two worlds, mobile-first:**
- **The site** wears a 1970s NYC campaign-poster look: warm cream paper, deep
  NYC blue + taxi yellow, a brick-orange accent, retro Fraunces serif display
  type, and sunburst/halftone textures.
- **The Arcade** keeps the classic 16-bit dark-cabinet skin (pixel type,
  scanlines, neon) — scoped to `/arcade` via a nested layout.

Everything is built mobile-first, and both mini-games ship real on-screen touch
controls (tap-to-flap; a thumb D-pad) alongside keyboard support.

---

## Two experiences

### A. The Grid — `/grid`

An interactive tactical map of NYC's five boroughs tracking hyper-local
legislative and material wins. Clicking a pixel-flag pin pulls a localized
card with related news clips, press, and policy metrics.

Built on **React-Leaflet** over a dark CARTO basemap. Seed data ships two
high-profile wins (Thomas Jefferson Pool, Williamsburg Bridge) to establish
the schema.

### B. The Arcade — `/arcade`

Gamified civic engagement via lightweight **HTML5 Canvas** mini-games:

- **Formal Plunge** — a flappy-blazer physics diver; thread the bureaucratic
  red tape in full business attire to unlock public pools.
- **Fix the City** — a grid-clearing infrastructure sprint against a ticking
  bureaucratic clock.

Both ship as playable prototype loops built on a shared `GameEngine` contract.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom bold arcade palette (`tailwind.config.ts`)
- **React-Leaflet / Leaflet** for the map
- **HTML5 Canvas** + `requestAnimationFrame` for the arcade
- Pixel fonts via `next/font` (Press Start 2P + VT323)

## Project layout

```
src/
├── app/                  # routes (App Router)
│   ├── page.tsx          # landing / war-room dashboard
│   ├── grid/             # The Grid (map)
│   └── arcade/           # The Arcade hub + per-game cabinets
├── components/
│   ├── ui/               # ProgressBar, PixelButton, StatusBanner
│   ├── map/              # ImpactMap (Leaflet), PinCard  ← spatial logic
│   └── arcade/           # GameCanvas host               ← game canvas
├── games/                # engine loops (formalPlunge, fixTheCity)
├── data/                 # seed data (pins, arcade cabinets)
└── lib/                  # shared TypeScript interfaces
```

Spatial logic (`components/map`, `data/pins`) and game-canvas code
(`components/arcade`, `games`) stay cleanly separated — they only share the
type definitions in `lib/types.ts`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Deployment (Firebase Hosting)

The app builds to a fully static site (`output: "export"` → `./out`) and
auto-deploys to **Firebase Hosting** via GitHub Actions:

- **`.github/workflows/firebase-hosting-merge.yml`** — deploys the **live**
  site on every push to `main` (i.e. when a PR merges).
- **`.github/workflows/firebase-hosting-pr.yml`** — deploys each PR to a
  temporary **preview channel** and comments the URL on the PR.

### One-time setup (required before deploys run)

The workflows need a Firebase service account stored as a repo secret named
`FIREBASE_SERVICE_ACCOUNT_MAMDANISTAN`. Easiest path:

```bash
npm i -g firebase-tools
firebase login
firebase init hosting:github   # in this repo — generates the secret + workflows
```

…or do it manually:

1. Firebase Console → ⚙️ **Project settings → Service accounts → Generate new
   private key** (downloads a JSON file).
2. GitHub → repo **Settings → Secrets and variables → Actions → New secret**,
   name `FIREBASE_SERVICE_ACCOUNT_MAMDANISTAN`, paste the JSON contents.
3. Ensure **Hosting** is enabled for the `mamdanistan` project in the console.

### Deploy manually

```bash
npm run build
firebase deploy --only hosting     # or: npx firebase-tools deploy --only hosting
```

## Adding a win to The Grid

Append a `MapPin` to `src/data/pins.ts`. The map, dashboard, and cards all
read from that array — no backend required.

## Adding an arcade cabinet

1. Implement the `GameEngine<TState>` contract in `src/games/`.
2. Register an `ArcadeCabinet` in `src/data/games.ts`.
3. Add a route under `src/app/arcade/<id>/` that mounts `<GameCanvas>`.

---

_Made in the five boroughs. Satire. Probably._
