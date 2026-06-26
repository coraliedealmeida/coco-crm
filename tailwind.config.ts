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
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 24px rgba(139, 92, 246, 0.08)",
        softer: "0 1px 12px rgba(29, 28, 31, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
