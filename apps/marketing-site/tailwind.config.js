/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        // 60% Neutral (Backgrounds & Surfaces)
        neutral: {
          bg: "#F8FAFC", // slate-50 dashboard area
          surface: "#FFFFFF",
          border: "#E2E8F0",
          text: "#0F172A",
          muted: "#64748B"
        },
        // 30% Primary (Headers, Sidebar, Main Structure)
        primary: {
          DEFAULT: "#4F46E5", // Indigo 600
          hover: "#4338CA",
          light: "#EEF2FF",
          dark: "#1E1B4B"
        },
        // 10% Accent (Action CTA buttons - Tangerine Orange)
        accent: {
          DEFAULT: "#F97316", // Orange 500
          hover: "#EA580C",
          light: "#FFF7ED"
        }
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
