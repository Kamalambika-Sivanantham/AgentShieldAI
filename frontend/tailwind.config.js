/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "rgb(var(--color-base) / <alpha-value>)",
          panel: "rgb(var(--color-base-panel) / <alpha-value>)",
          raised: "rgb(var(--color-base-raised) / <alpha-value>)",
          line: "rgb(var(--color-base-line) / <alpha-value>)",
        },
        signal: {
          teal: "#3DDCC7",
          cyan: "#5FC9E8",
          amber: "#E8B15F",
          red: "#EF6461",
          violet: "#8B7EF0",
        },
        ink: {
          hi: "rgb(var(--color-ink-hi) / <alpha-value>)",
          mid: "rgb(var(--color-ink-mid) / <alpha-value>)",
          low: "rgb(var(--color-ink-low) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(61,220,199,0.15), 0 0 24px rgba(61,220,199,0.08)",
        glowRed: "0 0 0 1px rgba(239,100,97,0.25), 0 0 24px rgba(239,100,97,0.12)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
