export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1a1a1a",
        surface: "#242424",
        "surface-low": "#1f1f1f",
        "surface-mid": "#2a2a2a",
        "surface-high": "#333333",
        "surface-variant": "#3a3a3a",
        "surface-highest": "#404040",
        "surface-dim": "#141414",
        primary: "#d4c3b3",
        "primary-dim": "#a39182",
        "on-primary": "#1a1a1a",
        "on-surface": "#f4f1eb",
        "on-surface-variant": "#8c8c8c",
        "outline-variant": "#4d4d4d",
        tertiary: "#e8dccc",
        secondary: "#c2b4a3",
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(58, 58, 58, 0.4), rgba(58, 58, 58, 0.6))',
        'primary-gradient': 'linear-gradient(135deg, #d4c3b3, #a39182)',
      }
    },
  },
  plugins: [],
}
