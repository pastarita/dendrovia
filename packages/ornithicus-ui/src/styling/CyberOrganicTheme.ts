/**
 * CyberOrganicTheme — Visual theme for Ornithicus UI.
 * Translucent panels, amber accents, organic curves.
 */

export const CyberOrganicTheme = {
  colors: {
    panelBackground: "rgba(15, 12, 8, 0.85)",
    panelBorder: "rgba(199, 123, 63, 0.4)",
    accentPrimary: "#c77b3f",
    accentSecondary: "#d4a574",
    textPrimary: "#e8dcc8",
    textSecondary: "#a89580",
    success: "#22c55e",
    warning: "#d97706",
    danger: "#ef4444",
    info: "#3b82f6",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    pill: 9999,
  },
  typography: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 18,
      xl: 24,
    },
  },
} as const;

export type CyberOrganicThemeType = typeof CyberOrganicTheme;
