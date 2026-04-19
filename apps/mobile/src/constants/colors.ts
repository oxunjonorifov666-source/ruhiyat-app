/** Osmonrang (sky) palitra — kunduz / tun */

/** Ruhiyat — sokin binafsha / lavanda palitra (Calm/Headspace uslubida) */
const skyLight = {
  primary: '#6d28d9',
  primaryLight: '#ede9fe',
  primaryDark: '#5b21b6',
  secondary: '#7c3aed',
  accent: '#a78bfa',
  background: '#f5f3ff',
  surface: '#ffffff',
  border: '#93c5fd',
  text: '#0f172a',
  textSecondary: '#0369a1',
  textMuted: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  cardBlue: '#0ea5e910',
  cardPurple: '#8b5cf610',
  cardOrange: '#f9731610',
  cardCyan: '#06b6d410',
  cardGreen: '#10b98110',
  cardPink: '#ec489910',
  tabBar: '#ffffff',
  tabBarInactive: '#94a3b8',
  coin: '#fbbf24',
  score: '#34d399',
  ranking: '#38bdf8',
  light: {
    background: '#f0f9ff',
    card: '#ffffff',
    border: '#bae6fd',
    text: '#0c4a6e',
    textSecondary: '#0369a1',
  },
};

const skyDark = {
  primary: '#a78bfa',
  primaryLight: '#2e1065',
  primaryDark: '#c4b5fd',
  secondary: '#8b5cf6',
  accent: '#ddd6fe',
  background: '#0f0720',
  surface: '#132337',
  border: '#1e4976',
  text: '#f1f5f9',
  textSecondary: '#bae6fd',
  textMuted: '#94a3b8',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  cardBlue: '#0ea5e920',
  cardPurple: '#8b5cf620',
  cardOrange: '#f9731620',
  cardCyan: '#06b6d420',
  cardGreen: '#10b98120',
  cardPink: '#ec489920',
  tabBar: '#152238',
  tabBarInactive: '#64748b',
  coin: '#fbbf24',
  score: '#34d399',
  ranking: '#60a5fa',
  light: {
    background: '#0c1222',
    card: '#152238',
    border: '#1e3a5f',
    text: '#f0f9ff',
    textSecondary: '#bae6fd',
  },
};

export const Palette = {
  light: skyLight,
  dark: skyDark,
} as const;

/** Eski importlar: sukut — kunduzgi osmonrang */
export const Colors = skyLight;

export type AppPalette = typeof skyLight;
