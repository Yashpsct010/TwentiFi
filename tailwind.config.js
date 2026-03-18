/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0D0B1F",
          card: "#1C1B33",
          purple: "#8B5CF6",
          text: "#FFFFFF",
          subtext: "#9CA3AF",
        },
      },
    },
  },
  plugins: [],
}
