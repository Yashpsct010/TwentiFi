/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
      colors: {
        // ── Vellum Ledger (Light Mode) ─────────────────────────────
        editorial: {
          bg:          '#FAFAF8',   // Global background
          card:        '#F5F1EB',   // Cards, structural blocks
          cardHigh:    '#F1EEE2',   // Elevated card surface
          cardHighest: '#ECE8DB',   // Highest elevation
          cardLow:     '#FDF9F1',   // Subtle section tint
          text:        '#1A1A1A',   // Primary text & buttons
          textDim:     '#39382F',   // Body text
          subtext:     '#66655A',   // Labels, secondary text
          border:      '#D9D5CE',   // Hairline border
          green:       '#6B8E6F',   // Success / progress / focus
          greenLight:  '#C6ECC8',   // Success container / selected chips
          brown:       '#9B7D6A',   // Alert / warning
          error:       '#A64542',   // Destructive actions
        },
        // ── Dark Mode ─────────────────────────────────────────────
        dark: {
          bg:      '#0D0B1F',
          card:    '#1C1B33',
          cardHigh: '#252442',
          text:    '#FFFFFF',
          textDim: '#E2E2E2',
          subtext: '#9CA3AF',
          accent:  '#8B5CF6',
          green:   '#6B8E6F',
          border:  'rgba(255,255,255,0.08)',
          error:   '#FF6B6B',
        },
        // ── Legacy (kept so existing code doesn't break) ──────────
        brand: {
          bg:      '#0D0B1F',
          card:    '#1C1B33',
          purple:  '#8B5CF6',
          text:    '#FFFFFF',
          subtext: '#9CA3AF',
        },
      },
    },
  },
  // Force NativeWind to compile all dynamic classes used by hooks/use-theme.ts
  // (class names returned by hooks aren't scanned by NativeWind's static extractor)
  safelist: [
    // Backgrounds
    'bg-editorial-bg', 'bg-editorial-card', 'bg-editorial-cardHigh',
    'bg-editorial-cardHighest', 'bg-editorial-cardLow',
    'bg-editorial-text', 'bg-editorial-green', 'bg-editorial-greenLight',
    'bg-editorial-brown', 'bg-editorial-error',
    'bg-dark-bg', 'bg-dark-card', 'bg-dark-cardHigh',
    'bg-dark-accent', 'bg-dark-green', 'bg-dark-error',
    // Text colours
    'text-editorial-text', 'text-editorial-textDim', 'text-editorial-subtext',
    'text-editorial-green', 'text-editorial-brown', 'text-editorial-error',
    'text-dark-text', 'text-dark-textDim', 'text-dark-subtext',
    'text-dark-accent', 'text-dark-green', 'text-dark-error',
    // Borders
    'border-editorial-border', 'border-editorial-green', 'border-editorial-error',
    'border-dark-border',
    // Opacity mods used inline
    'bg-transparent',
  ],
  plugins: [],
}
