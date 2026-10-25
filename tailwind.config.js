/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./popup.html"
  ],
  theme: {
    extend: {
      colors: {
        leetcode: {
          bg: "#1a1a1a",
          card: "#262626",
          border: "#3a3a3a",
          accent: "#ffa116",
          green: "#00b8a3",
          red: "#ef4743",
          yellow: "#ffc01e"
        }
      }
    },
  },
  plugins: [],
}

