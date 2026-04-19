import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts}",
    "./src/lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F8F8F8",
        surface: "#F0F0F0",
        card: "#EBEBEB",
        border: "#DEDEDE",
        muted: "#CCCCCC",
        textMain: "#111111",
        textDim: "#888888",
        blue: "#2563EB",
        blueDim: "#DBEAFE",
        danger: "#991B1B",
      },
      fontFamily: {
        pixel: ['"VT323"', "monospace"],
        mono: ['"Share Tech Mono"', "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
