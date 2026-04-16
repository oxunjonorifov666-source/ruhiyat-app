import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { useThemeStore, type ThemeMode } from '../stores/themeStore';

/** `system` bo‘lsa — qurilma temasi; aks holda saqlangan mavzu. */
export function useResolvedThemeMode(): Exclude<ThemeMode, 'system'> {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  return useMemo(() => {
    if (mode === 'system') {
      return system === 'dark' ? 'dark' : 'light';
    }
    return mode;
  }, [mode, system]);
}
