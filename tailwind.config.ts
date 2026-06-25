import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        ink: "#1D1C1F",
        accent: "#8B5CF6",
        "accent-light": "#C4B5FD",
        soft: "#F4F2FF",
        cta: "#CCFF00",
      },
      fontFamily: {
        sans: ["var(--font-bricolage)"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
