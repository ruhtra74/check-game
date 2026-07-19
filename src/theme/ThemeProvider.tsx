import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { genererPaletteAccent, type AccentPalette } from './colorUtils';
import { neutrals, radius, semantic, shadows, spacing, typography } from './tokens';
import { appStorage } from '../storage';

export interface Theme {
  accent: AccentPalette;
  accentHex: string;
  colors: typeof neutrals & typeof semantic;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
}

interface ThemeContextValue extends Theme {
  setAccentColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // MMKV est synchrone : pas besoin d'état de chargement / flash de couleur
  // par défaut au démarrage.
  const [accentHex, setAccentHexState] = useState<string>(() => appStorage.getAccentColor());

  const setAccentColor = useCallback((hex: string) => {
    setAccentHexState(hex);
    appStorage.setAccentColor(hex);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const accent = genererPaletteAccent(accentHex);
    return {
      accent,
      accentHex,
      colors: { ...neutrals, ...semantic },
      typography,
      spacing,
      radius,
      shadows,
      setAccentColor,
    };
  }, [accentHex, setAccentColor]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() doit être utilisé à l\'intérieur de <ThemeProvider>.');
  }
  return ctx;
}
