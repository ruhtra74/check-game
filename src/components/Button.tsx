import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTextStyle } from '../theme/textStyle';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Rendu à gauche du label (ex. une icône lucide-react-native). */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bouton pilule. Les 5 variantes couvrent tous les cas vus dans la maquette :
 *  - primary  : action principale ("JOUER", "DÉMARRER LA PARTIE")
 *  - secondary: action secondaire sur fond clair ("PROFIL", "PARAMÈTRES")
 *  - success  : confirmation positive ("Oui !")
 *  - danger   : confirmation négative ("Non !!", "BANQUE")
 *  - ghost    : action discrète, sans fond
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  icon,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const palette = getVariantPalette(theme, variant);
  const texte = resolveTextStyle(theme, 'button');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          borderColor: palette.border,
          borderWidth: palette.border ? 1 : 0,
          paddingHorizontal: theme.spacing.xxl,
          borderRadius: theme.radius.pill,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        theme.shadows.sm,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <>
            {icon}
            <Text style={[texte, { color: palette.text, marginLeft: icon ? 8 : 0 }]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function getVariantPalette(theme: ReturnType<typeof useTheme>, variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return {
        bg: theme.accent[500],
        bgPressed: theme.accent[600],
        text: '#FFFFFF',
        border: undefined,
      };
    case 'secondary':
      return {
        bg: theme.accent[50],
        bgPressed: theme.accent[100],
        text: theme.accent[700],
        border: undefined,
      };
    case 'success':
      return {
        bg: theme.colors.successBg,
        bgPressed: theme.colors.successBg,
        text: theme.colors.success,
        border: undefined,
      };
    case 'danger':
      return {
        bg: theme.colors.dangerBg,
        bgPressed: theme.colors.dangerBg,
        text: theme.colors.danger,
        border: undefined,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        bgPressed: theme.colors.surfaceAlt,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
      };
    default:
      return {
        bg: theme.accent[500],
        bgPressed: theme.accent[600],
        text: '#FFFFFF',
        border: undefined,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
