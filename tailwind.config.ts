import type { Config } from "tailwindcss";

/**
 * Mamdanistan Design System — TWO worlds.
 *
 *  1. `brutal.*` / semantic tokens — the default site skin. Neo-brutalist:
 *     pure electric blue / orange / red, 4px black borders, hard offset
 *     shadows, Inter black uppercase, sharp corners on a light surface.
 *
 *  2. `mamdani.*` — the Arcade-only skin. The classic 16-bit dark cabinet
 *     palette. Scoped to /arcade via a nested layout.
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
        // ---- Neo-brutalist skin (default site) ----
        primary: "#241AC9", // electric blue
        secondary: "#FFA500", // orange
        tertiary: "#FF0000", // red
        background: "#f9f9f9",
        surface: "#ffffff",
        "on-primary": "#ffffff",
        "on-secondary": "#000000",
        "on-surface": "#1b1b1b",
        outline: "#000000",

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
      borderRadius: {
        // Brutalism = sharp corners. Pills stay round.
        DEFAULT: "0rem",
        sm: "0rem",
        md: "0rem",
        lg: "0rem",
        xl: "0rem",
        "2xl": "0rem",
        full: "9999px",
      },
      fontFamily: {
        // Campaign/site type: one heavy grotesque.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"], // Inter
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Arcade type.
        pixel: ["var(--font-pixel)", "monospace"], // Press Start 2P
        terminal: ["var(--font-terminal)", "monospace"], // VT323
      },
      boxShadow: {
        // Brutalist hard offsets (no blur).
        brutal: "6px 6px 0 0 #000000",
        "brutal-sm": "3px 3px 0 0 #000000",
        "brutal-lg": "8px 8px 0 0 #000000",
        "brutal-blue": "8px 8px 0 0 #241AC9",
        "brutal-yellow": "8px 8px 0 0 #FFA500",
        "brutal-red": "8px 8px 0 0 #FF0000",
        // Arcade cabinet depth.
        pixel: "4px 4px 0 0 rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(33,212,253,0.45)",
        "glow-red": "0 0 22px rgba(255,46,77,0.5)",
      },
      backgroundImage: {
        scanlines:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
        "grid-tactical":
          "linear-gradient(rgba(33,212,253,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(33,212,253,0.08) 1px, transparent 1px)",
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
        "fill-up": {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-fill, 100%)" },
        },
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        "press-start": "press-start 1.4s ease-in-out infinite",
        "fill-up": "fill-up 1.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
