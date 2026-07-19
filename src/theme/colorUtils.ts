/**
 * RN n'a pas de variables CSS : toute la palette dérivée de la "couleur
 * dominante" choisie par l'utilisateur doit être calculée en JS, une fois,
 * puis distribuée via le ThemeProvider.
 */

export interface AccentPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // = la couleur choisie par l'utilisateur, inchangée
  600: string;
  700: string;
  800: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalise = hex.replace('#', '');
  const complet =
    normalise.length === 3
      ? normalise
          .split('')
          .map((c) => c + c)
          .join('')
      : normalise;
  const int = parseInt(complet, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Mélange `hex` vers `cibleHex` (blanc ou noir) selon un ratio 0..1. */
function mixer(hex: string, cibleHex: string, ratio: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(cibleHex);
  return rgbToHex(
    a.r + (b.r - a.r) * ratio,
    a.g + (b.g - a.g) * ratio,
    a.b + (b.b - a.b) * ratio
  );
}

export function estHexValide(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

/**
 * Construit la palette complète à partir d'une seule couleur de référence.
 * 500 = la couleur telle quelle. En dessous : mélange vers le blanc (fonds
 * clairs, tags, états désactivés). Au-dessus : mélange vers le noir (état
 * pressé, texte sur fond clair).
 */
export function genererPaletteAccent(baseHex: string): AccentPalette {
  const base = estHexValide(baseHex) ? baseHex : '#8B5CF6';
  return {
    50: mixer(base, '#FFFFFF', 0.94),
    100: mixer(base, '#FFFFFF', 0.87),
    200: mixer(base, '#FFFFFF', 0.72),
    300: mixer(base, '#FFFFFF', 0.5),
    400: mixer(base, '#FFFFFF', 0.25),
    500: base,
    600: mixer(base, '#000000', 0.12),
    700: mixer(base, '#000000', 0.28),
    800: mixer(base, '#000000', 0.44),
  };
}
