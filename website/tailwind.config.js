export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0d",
        surface: "#161616",
        "surface-low": "#121212",
        "surface-mid": "#1a1a1a",
        "surface-high": "#242424",
        "surface-variant": "#2e2e2e",
        "surface-highest": "#383838",
        "surface-dim": "#0a0a0a",
        primary: "#d4c3b3",
        "primary-dim": "#a39182",
        "on-primary": "#0d0d0d",
        "on-surface": "#f4f1eb",
        "on-surface-variant": "#9c9890",
        "outline-variant": "#2a2927",
        tertiary: "#e8dccc",
        secondary: "#c2b4a3",
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(36, 36, 36, 0.7), rgba(18, 18, 18, 0.8))',
        'primary-gradient': 'linear-gradient(135deg, #d4c3b3, #a39182)',
      }
    },
  },
  plugins: [],
}
