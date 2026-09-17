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
        },
        cream: "#F5F1E4",
      },
    },
  },
  plugins: [],
};
