import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#13211b",
        cream: "#f5f1e8",
        lime: "#c9f66f",
        forest: "#1f5b45",
        orange: "#ff825c",
      },
      boxShadow: { soft: "0 18px 60px rgba(19,33,27,.10)" },
    },
  },
  plugins: [],
} satisfies Config;
