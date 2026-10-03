import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
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
        fb: {
          page: '#FAF9F6',
          ink: '#1B2249',
          accent: '#E8740C',
          'accent-hover': '#D16A0A',
          muted: '#6B7186',
          rule: '#E5E2DC',
          dim: '#9B9EAD',
          paper: '#F3F1EC',
          field: '#141830',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
