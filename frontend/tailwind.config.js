/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Every colour is a CSS variable (src/styles/theme.css), so the colour-blind and
      // high-contrast themes can swap them app-wide. <alpha-value> keeps bg-brand/10 etc. working.
      colors: {
        brand: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          dark: "rgb(var(--c-brand-dark) / <alpha-value>)",
          light: "rgb(var(--c-brand-light) / <alpha-value>)",
          soft: "rgb(var(--c-brand-soft) / <alpha-value>)",
          mist: "rgb(var(--c-brand-mist) / <alpha-value>)",
        },
        cream: "rgb(var(--c-cream) / <alpha-value>)",
        sand: "rgb(var(--c-sand) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        red: { 50: "rgb(var(--c-red-50) / <alpha-value>)", 100: "rgb(var(--c-red-100) / <alpha-value>)", 200: "rgb(var(--c-red-200) / <alpha-value>)", 300: "rgb(var(--c-red-300) / <alpha-value>)", 400: "rgb(var(--c-red-400) / <alpha-value>)", 500: "rgb(var(--c-red-500) / <alpha-value>)", 600: "rgb(var(--c-red-600) / <alpha-value>)", 700: "rgb(var(--c-red-700) / <alpha-value>)", 800: "rgb(var(--c-red-800) / <alpha-value>)", 900: "rgb(var(--c-red-900) / <alpha-value>)" },
        green: { 50: "rgb(var(--c-green-50) / <alpha-value>)", 100: "rgb(var(--c-green-100) / <alpha-value>)", 200: "rgb(var(--c-green-200) / <alpha-value>)", 300: "rgb(var(--c-green-300) / <alpha-value>)", 400: "rgb(var(--c-green-400) / <alpha-value>)", 500: "rgb(var(--c-green-500) / <alpha-value>)", 600: "rgb(var(--c-green-600) / <alpha-value>)", 700: "rgb(var(--c-green-700) / <alpha-value>)", 800: "rgb(var(--c-green-800) / <alpha-value>)", 900: "rgb(var(--c-green-900) / <alpha-value>)" },
        emerald: { 50: "rgb(var(--c-emerald-50) / <alpha-value>)", 100: "rgb(var(--c-emerald-100) / <alpha-value>)", 200: "rgb(var(--c-emerald-200) / <alpha-value>)", 300: "rgb(var(--c-emerald-300) / <alpha-value>)", 400: "rgb(var(--c-emerald-400) / <alpha-value>)", 500: "rgb(var(--c-emerald-500) / <alpha-value>)", 600: "rgb(var(--c-emerald-600) / <alpha-value>)", 700: "rgb(var(--c-emerald-700) / <alpha-value>)", 800: "rgb(var(--c-emerald-800) / <alpha-value>)", 900: "rgb(var(--c-emerald-900) / <alpha-value>)" },
        amber: { 50: "rgb(var(--c-amber-50) / <alpha-value>)", 100: "rgb(var(--c-amber-100) / <alpha-value>)", 200: "rgb(var(--c-amber-200) / <alpha-value>)", 300: "rgb(var(--c-amber-300) / <alpha-value>)", 400: "rgb(var(--c-amber-400) / <alpha-value>)", 500: "rgb(var(--c-amber-500) / <alpha-value>)", 600: "rgb(var(--c-amber-600) / <alpha-value>)", 700: "rgb(var(--c-amber-700) / <alpha-value>)", 800: "rgb(var(--c-amber-800) / <alpha-value>)", 900: "rgb(var(--c-amber-900) / <alpha-value>)" },
        gray: { 50: "rgb(var(--c-gray-50) / <alpha-value>)", 100: "rgb(var(--c-gray-100) / <alpha-value>)", 200: "rgb(var(--c-gray-200) / <alpha-value>)", 300: "rgb(var(--c-gray-300) / <alpha-value>)", 400: "rgb(var(--c-gray-400) / <alpha-value>)", 500: "rgb(var(--c-gray-500) / <alpha-value>)", 600: "rgb(var(--c-gray-600) / <alpha-value>)", 700: "rgb(var(--c-gray-700) / <alpha-value>)", 800: "rgb(var(--c-gray-800) / <alpha-value>)", 900: "rgb(var(--c-gray-900) / <alpha-value>)" },
      },
      boxShadow: {
        soft: "0 12px 34px rgba(31, 92, 69, 0.10)",
        lift: "0 18px 42px rgba(23, 35, 30, 0.14)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};
