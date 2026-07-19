/**
 * Tokens de design statiques.
 *
 * Tout ce qui NE dépend PAS de la "couleur dominante" choisie par
 * l'utilisateur vit ici. La partie dynamique (palette générée à partir de
 * l'accent choisi) vit dans ThemeProvider.tsx / colorUtils.ts.
 *
 * Règle du projet : aucune couleur codée en dur ailleurs que dans ce fichier
 * et dans colorUtils.ts. Tous les composants doivent consommer `useTheme()`.
 */

export const neutrals = {
  // Fond général très légèrement teinté (cf. maquette : blanc cassé lavande)
  background: '#F8F6FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EEFA',
  border: '#EDE9F7',
  textPrimary: '#241E33',
  textSecondary: '#8A83A0',
  textDisabled: '#C7C1D6',
  overlay: 'rgba(36, 30, 51, 0.45)', // fond des Dialog
};

export const semantic = {
  success: '#22C55E',
  successBg: '#E8FBEF',
  danger: '#F43F5E',
  dangerBg: '#FDEAEE',
  warning: '#F59E0B',
  warningBg: '#FEF3E2',
  info: '#3B82F6',
  infoBg: '#EAF2FE',
};

/**
 * Police "arrondie et amicale" correspondant à la maquette. À bundler dans le
 * projet (ex. via @expo-google-fonts/poppins ou react-native-asset). En
 * attendant que les fontes soient chargées, chaque composant retombe sur
 * `System` — voir `typography.fallback`.
 */
export const typography = {
  fontFamily: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
  },
  fallback: 'System',
  scale: {
    display: { fontSize: 28, lineHeight: 34, weight: 'bold' as const },
    h1: { fontSize: 22, lineHeight: 28, weight: 'bold' as const },
    h2: { fontSize: 18, lineHeight: 24, weight: 'semiBold' as const },
    body: { fontSize: 15, lineHeight: 21, weight: 'regular' as const },
    bodyMedium: { fontSize: 15, lineHeight: 21, weight: 'medium' as const },
    caption: { fontSize: 13, lineHeight: 18, weight: 'regular' as const },
    button: { fontSize: 16, lineHeight: 20, weight: 'semiBold' as const },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999, // boutons pilule, avatars circulaires via width/2
};

/**
 * Ombres douces (StyleSheet iOS + elevation Android).
 */
export const shadows = {
  sm: {
    shadowColor: '#5B21B6',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#5B21B6',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

export const DEFAULT_ACCENT_HEX = '#8B5CF6'; // valeur vue dans la maquette (Personnaliser la couleur)

export const ACCENT_PRESETS = ['#8B5CF6', '#2563EB', '#10B981', '#F97316', '#EC4899'];
