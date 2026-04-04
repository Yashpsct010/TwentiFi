import { useSettingsStore } from '@/store/settingsStore';

/**
 * useTheme — Returns Tailwind className strings based on the user's
 * selected theme (light = Vellum Ledger editorial, dark = original dark).
 * Import this in any screen to get theme-aware classNames.
 */
export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';

  return {
    isDark,
    theme,

    // Backgrounds
    bg: isDark ? 'bg-dark-bg' : 'bg-editorial-bg',
    cardBg: isDark ? 'bg-dark-card' : 'bg-editorial-card',
    cardHighBg: isDark ? 'bg-dark-cardHigh' : 'bg-editorial-cardHigh',
    inputBg: isDark ? 'bg-dark-card' : 'bg-editorial-bg',

    // Text
    textPrimary: isDark ? 'text-dark-text' : 'text-editorial-text',
    textDim: isDark ? 'text-dark-textDim' : 'text-editorial-textDim',
    textSubtle: isDark ? 'text-dark-subtext' : 'text-editorial-subtext',

    // Borders
    border: isDark ? 'border-dark-border' : 'border-editorial-border',

    // Buttons
    btnPrimary: isDark ? 'bg-dark-accent' : 'bg-editorial-text',
    btnPrimaryText: 'text-white',
    btnSecondary: isDark ? 'bg-transparent border-dark-border' : 'bg-transparent border-editorial-border',
    btnSecondaryText: isDark ? 'text-dark-text' : 'text-editorial-text',

    // Icon buttons (48×48)
    iconBtn: isDark ? 'bg-dark-card' : 'bg-editorial-card',

    // Accent
    accentText: isDark ? 'text-dark-accent' : 'text-editorial-text',
    accentBg: isDark ? 'bg-dark-accent' : 'bg-editorial-green',

    // Success
    successText: isDark ? 'text-dark-green' : 'text-editorial-green',
    successBg: isDark ? 'bg-dark-green/20' : 'bg-editorial-greenLight',

    // Error
    errorText: isDark ? 'text-dark-error' : 'text-editorial-error',

    // Raw hex values (for components that need inline style or Ionicons color)
    colors: {
      bg: isDark ? '#0D0B1F' : '#FAFAF8',
      card: isDark ? '#1C1B33' : '#F5F1EB',
      text: isDark ? '#FFFFFF' : '#1A1A1A',
      textDim: isDark ? '#E2E2E2' : '#39382F',
      subtext: isDark ? '#9CA3AF' : '#66655A',
      border: isDark ? 'rgba(255,255,255,0.08)' : '#D9D5CE',
      accent: isDark ? '#8B5CF6' : '#1A1A1A',
      green: '#6B8E6F',
      greenLight: isDark ? 'rgba(107,142,111,0.20)' : '#C6ECC8',
      brown: '#9B7D6A',
      error: isDark ? '#FF6B6B' : '#A64542',
    },
  };
}
