import type { Config } from "tailwindcss";

/**
 * Mamdanistan Design System — TWO worlds.
 *
 *  1. `campaign.*`  — the default site skin. A 1970s NYC campaign-poster vibe:
 *                     warm cream paper, deep NYC blue, taxi yellow, brick-orange
 *                     accent, retro serif display type, sunburst + halftone.
 *
 *  2. `mamdani.*`   — the Arcade-only skin. The classic 16-bit dark cabinet
 *                     palette. Scoped to /arcade via a nested layout.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Campaign skin (default site) ----
        campaign: {
          blue: "#1B3A9C", // deep NYC cobalt
          navy: "#0E2150", // ink-blue, headings on cream
          sky: "#5B7FD4", // soft secondary blue
          sun: "#FFC72C", // taxi / sun yellow
          gold: "#F2A516", // deeper gold
          cream: "#FBF3DE", // warm paper background
          paper: "#F4E8C8", // panel paper
          brick: "#E2542C", // 70s orange-red accent
          ink: "#14213D", // primary body text
        },

        // ---- Arcade skin (/arcade only) ----
        mamdani: {
          red: "#FF2E4D",
          ember: "#FF6B35",
          gold: "#FFD23F",
          mint: "#3DDC97",
          cyan: "#21D4FD",
          ink: "#0B0E1A",
          slate: "#161B2E",
          steel: "#27304D",
          fog: "#9AA7C7",
        },
      },
      fontFamily: {
        // Campaign type
        display: ["var(--font-display)", "Georgia", "serif"], // Fraunces
        sans: ["var(--font-sans)", "system-ui", "sans-serif"], // DM Sans
        // Arcade type
        pixel: ["var(--font-pixel)", "monospace"], // Press Start 2P
        terminal: ["var(--font-terminal)", "monospace"], // VT323
      },
      boxShadow: {
        // Campaign: hard 70s poster offset (blue ink)
        poster: "5px 5px 0 0 #0E2150",
        "poster-sun": "5px 5px 0 0 #F2A516",
        "poster-sm": "3px 3px 0 0 #0E2150",
        // Arcade: chunky cabinet depth
        pixel: "4px 4px 0 0 rgba(0,0,0,0.6)",
        "pixel-lg": "6px 6px 0 0 rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(33,212,253,0.45)",
        "glow-red": "0 0 22px rgba(255,46,77,0.5)",
      },
      backgroundImage: {
        scanlines:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
        "grid-tactical":
          "linear-gradient(rgba(33,212,253,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(33,212,253,0.08) 1px, transparent 1px)",
        // 70s sunburst rays (place behind heroes)
        sunburst:
          "repeating-conic-gradient(from 0deg at 50% 50%, #F2A516 0deg 10deg, #FFC72C 10deg 20deg)",
        // halftone dot wash
        halftone:
          "radial-gradient(circle, rgba(14,33,80,0.16) 1.1px, transparent 1.4px)",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "press-start": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "flag-wave": {
          "0%, 100%": { transform: "skewX(0deg) scaleY(1)" },
          "50%": { transform: "skewX(-4deg) scaleY(0.98)" },
        },
        "fill-up": {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-fill, 100%)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        "press-start": "press-start 1.4s ease-in-out infinite",
        "flag-wave": "flag-wave 2.5s ease-in-out infinite",
        "fill-up": "fill-up 1.2s ease-out forwards",
        "spin-slow": "spin-slow 60s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
