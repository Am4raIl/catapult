export const palettes = {
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#EEF1F6',
    textPrimary: '#111827',
    textSecondary: '#657084',
    border: '#E5E9EF',
    accent: '#3858E9',
    accentSoft: '#E7ECFF',
    accentOnSolid: '#FFFFFF',
    success: '#1E8054',
    successSoft: '#E3F6EC',
    warning: '#A7650D',
    warningSoft: '#FFF1D6',
    danger: '#C13F47',
    dangerSoft: '#FFE6E8',
    overlay: 'rgba(17, 24, 39, 0.45)',
    skeleton: '#E9EDF3',
  },
  dark: {
    background: '#0C1016',
    surface: '#161C25',
    surfaceElevated: '#202836',
    surfaceMuted: '#232B37',
    textPrimary: '#F3F6FA',
    textSecondary: '#A7B1C1',
    border: '#303A48',
    accent: '#91A5FF',
    accentSoft: '#283457',
    accentOnSolid: '#101626',
    success: '#62D4A0',
    successSoft: '#173B30',
    warning: '#F5C46B',
    warningSoft: '#49391E',
    danger: '#FF8990',
    dangerSoft: '#4B252B',
    overlay: 'rgba(0, 0, 0, 0.64)',
    skeleton: '#242D39',
  },
} as const;

export type AppPalette = (typeof palettes)[keyof typeof palettes];
export type ThemePreference = 'system' | 'light' | 'dark';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32 };
export const radius = { sm: 10, md: 14, lg: 18, pill: 999 };
export const maxContentWidth = 920;
