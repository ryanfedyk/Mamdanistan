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
        // Brand colors sampled from zohranfornyc.com.
        campaign: {
          blue: "#2619D1", // electric ultramarine (donate panel / wordmark)
          navy: "#180F78", // dark brand blue — borders, shadows, strong text
          sky: "#5B6FE0", // soft secondary blue
          sun: "#FFAB00", // brand amber-orange (primary accent)
          gold: "#E59A00", // deeper orange
          cream: "#FBF3DE", // warm 70s paper background
          paper: "#F4E8C8", // panel paper
          brick: "#F0431F", // punchy red-orange (wordmark shadow / alerts)
          ink: "#1A1466", // primary body text (brand-blue ink)
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
        // Campaign: hard 70s poster offset (brand-blue ink)
        poster: "5px 5px 0 0 #180F78",
        "poster-sun": "5px 5px 0 0 #E59A00",
        "poster-sm": "3px 3px 0 0 #180F78",
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
          "repeating-conic-gradient(from 0deg at 50% 50%, #FFAB00 0deg 10deg, #E59A00 10deg 20deg)",
        // halftone dot wash
        halftone:
          "radial-gradient(circle, rgba(24,15,120,0.16) 1.1px, transparent 1.4px)",
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
