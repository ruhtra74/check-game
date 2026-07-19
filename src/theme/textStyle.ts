import type { Theme } from './ThemeProvider';

type ScaleKey = keyof Theme['typography']['scale'];

/**
 * Résout un style de texte RN complet à partir d'une entrée de l'échelle
 * typographique. Centralisé ici pour que tous les composants restent
 * cohérents et pour ne changer la logique de fallback de police qu'à un
 * seul endroit une fois les fontes Poppins bundlées dans le projet.
 */
export function resolveTextStyle(theme: Theme, cle: ScaleKey) {
  const entree = theme.typography.scale[cle];
  const famille = theme.typography.fontFamily[entree.weight] ?? theme.typography.fallback;
  return {
    fontFamily: famille,
    fontSize: entree.fontSize,
    lineHeight: entree.lineHeight,
  };
}
