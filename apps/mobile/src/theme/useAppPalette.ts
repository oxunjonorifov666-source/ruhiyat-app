import { useCallback, useMemo } from 'react';
import { Palette, type AppPalette } from '../constants/colors';
import { useResolvedThemeMode } from '../hooks/useResolvedThemeMode';
import { useAccessibilityStore } from '../stores/accessibilityStore';

export type AppPaletteWithFont = AppPalette & { font: (size: number) => number };

export function useAppPalette(): AppPaletteWithFont {
  const resolved = useResolvedThemeMode();
  const fontScale = useAccessibilityStore((s) => s.fontScale);
  const base = useMemo(() => (resolved === 'dark' ? Palette.dark : Palette.light), [resolved]);
  const font = useCallback((size: number) => Math.round(size * fontScale), [fontScale]);
  return useMemo(() => ({ ...base, font }), [base, font]);
}
