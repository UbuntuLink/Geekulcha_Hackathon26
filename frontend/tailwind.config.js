/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1F5C45",
          dark: "#164634",
          light: "#2C7A5A",
          soft: "#E6F0EA",
          mist: "#F2F7F4",
        },
        cream: "#F5F1E4",
        sand: "#E8E1CF",
        ink: "#17231E",
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
