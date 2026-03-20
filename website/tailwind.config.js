export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#060e20",
        surface: "#060e20",
        "surface-low": "#091328",
        "surface-mid": "#0f1930",
        "surface-high": "#141f38",
        "surface-variant": "#192540",
        "surface-highest": "#192540",
        "surface-dim": "#060e20",
        primary: "#ba9eff",
        "primary-dim": "#8455ef",
        "on-primary": "#39008c",
        "on-surface": "#dee5ff",
        "on-surface-variant": "#a3aac4",
        "outline-variant": "#40485d",
        tertiary: "#ff97b5",
        secondary: "#c08cf7",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(25, 37, 64, 0.4), rgba(25, 37, 64, 0.6))',
        'primary-gradient': 'linear-gradient(135deg, #ba9eff, #8455ef)',
      }
    },
  },
  plugins: [],
}
