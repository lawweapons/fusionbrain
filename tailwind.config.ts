import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#17171a",
        panel: "#1e1e22",
        border: "#2a2a2d",
        muted: "#7d7a76",
        text: "#e8e6e3",
        accent: "#b8621b",
        "accent-soft": "#8a491a"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
