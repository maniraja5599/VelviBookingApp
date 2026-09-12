import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        velvi: {
          cream: "rgb(var(--velvi-cream-rgb, 250 247 242) / <alpha-value>)",
          creamLight: "rgb(var(--velvi-cream-light-rgb, 255 253 249) / <alpha-value>)",
          creamDark: "rgb(var(--velvi-cream-dark-rgb, 240 233 223) / <alpha-value>)",
          brown: "rgb(var(--velvi-brown-rgb, 74 46 24) / <alpha-value>)",
          brownDark: "rgb(var(--velvi-brown-dark-rgb, 44 24 16) / <alpha-value>)",
          brownLight: "rgb(var(--velvi-brown-light-rgb, 110 71 41) / <alpha-value>)",
          gold: "rgb(var(--velvi-gold-rgb, 200 146 52) / <alpha-value>)",
          goldLight: "rgb(var(--velvi-gold-light-rgb, 230 184 101) / <alpha-value>)",
          goldDark: "rgb(var(--velvi-gold-dark-rgb, 158 110 27) / <alpha-value>)",
          maroon: "#7A1C1C",
          maroonDark: "#541111",
          sacredGreen: "#22543D",
          sacredGreenLight: "#2F7A59",
          saffron: "#E06D24",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        tamil: ["'Mukta Malar'", "'Latha'", "'Tiro Tamil'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sacred: "0 4px 20px -2px rgba(74, 46, 24, 0.08)",
        card: "0 2px 10px rgba(74, 46, 24, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
