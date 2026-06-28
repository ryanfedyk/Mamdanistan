import type { Config } from "tailwindcss";

/**
 * Mamdanistan Design System
 * -------------------------
 * A bold, high-contrast 16-bit arcade nation-builder palette.
 * Polished modern vector map energy meets pixel-art flag chaos.
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
        // Core ideological palette — loud on purpose.
        mamdani: {
          red: "#FF2E4D", // "panic accordingly" alarm red
          ember: "#FF6B35", // pothole-warning orange
          gold: "#FFD23F", // medallion / civic-win gold
          mint: "#3DDC97", // pools-are-open green
          cyan: "#21D4FD", // tactical map glow
          ink: "#0B0E1A", // deep arcade-cabinet black-blue
          slate: "#161B2E", // panel background
          steel: "#27304D", // borders / grid lines
          fog: "#9AA7C7", // muted UI text
        },
      },
      fontFamily: {
        // Wired up via next/font in layout.tsx as CSS variables.
        pixel: ["var(--font-pixel)", "monospace"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Chunky offset shadows = arcade button depth.
        pixel: "4px 4px 0 0 rgba(0,0,0,0.6)",
        "pixel-lg": "6px 6px 0 0 rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(33,212,253,0.45)",
        "glow-red": "0 0 22px rgba(255,46,77,0.5)",
      },
      backgroundImage: {
        "scanlines":
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
        "flag-wave": {
          "0%, 100%": { transform: "skewX(0deg) scaleY(1)" },
          "50%": { transform: "skewX(-4deg) scaleY(0.98)" },
        },
        "fill-up": {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-fill, 100%)" },
        },
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        "press-start": "press-start 1.4s ease-in-out infinite",
        "flag-wave": "flag-wave 2.5s ease-in-out infinite",
        "fill-up": "fill-up 1.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
