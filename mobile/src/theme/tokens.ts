export const palettes = {
  light: {
    background: '#F8F9FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#F0F1F7',
    textPrimary: '#202331',
    textSecondary: '#656B7C',
    border: '#E5E7EE',
    accent: '#5145CD',
    accentSolid: '#5145CD',
    hero: '#EFF0FA',
    heroLine: '#D5D7EF',
    highlight: '#D4F55A',
    accentSoft: '#EDEBFA',
    accentOnSolid: '#FFFFFF',
    success: '#286145',
    successSoft: '#E6F3EB',
    warning: '#795311',
    warningSoft: '#FFF1C7',
    danger: '#B3122F',
    dangerSolid: '#B3122F',
    dangerSoft: '#FBE8EC',
    overlay: 'rgba(17, 24, 39, 0.45)',
    skeleton: '#E9EDF3',
  },
  dark: {
    background: '#10121A',
    surface: '#191C27',
    surfaceElevated: '#202434',
    surfaceMuted: '#242837',
    textPrimary: '#F0F1F7',
    textSecondary: '#A8AEC2',
    border: '#2C3040',
    accent: '#B4AAFF',
    accentSolid: '#6652DE',
    hero: '#1B1E32',
    heroLine: '#393C62',
    highlight: '#D4F55A',
    accentSoft: '#302B4D',
    accentOnSolid: '#FFFFFF',
    success: '#9AD6B4',
    successSoft: '#213C31',
    warning: '#F1CF7D',
    warningSoft: '#43381E',
    danger: '#FF8CA3',
    dangerSolid: '#AC2442',
    dangerSoft: '#422632',
    overlay: 'rgba(0, 0, 0, 0.64)',
    skeleton: '#242D39',
  },
} as const;

export type AppPalette = (typeof palettes)[keyof typeof palettes];
export type ThemePreference = 'system' | 'light' | 'dark';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32 };
export const radius = { sm: 12, md: 12, lg: 24, pill: 999 };
export const maxContentWidth = 920;

export const thumbnailColors = {
  light: ['#E7E1FF', '#EFF6D5', '#F9E4DC', '#DEF1F8', '#FFF1CD', '#FAE0E6'],
  dark: ['#3A355B', '#35452B', '#563B36', '#2A4555', '#50472D', '#513341'],
};
