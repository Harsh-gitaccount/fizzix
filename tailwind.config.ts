import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        atlas: {
          bg: '#0C1222',
          surface: '#141E33',
          border: '#1E2D4A',
          accent: '#E8740C',
          'accent-light': '#F5923A',
          muted: '#64748B',
          dim: '#475569',
        },
      },
    },
  },
  plugins: [],
};
export default config;
