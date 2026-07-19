import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: 'sm' | 'md' | 'lg';
}

/**
 * Surface blanche arrondie avec ombre douce — la brique de base des listes
 * (lignes de lobby, entrées de menu "Créer une partie" / "Rejoindre") et des
 * blocs de contenu (bloc "Paramètres de partie" du lobby).
 *
 * Si `onPress` est fourni, la carte devient un Pressable (ligne de menu
 * cliquable) ; sinon c'est un simple conteneur.
 */
export function Card({ children, onPress, style, padding = 'md' }: CardProps) {
  const theme = useTheme();
  const paddingValue = { sm: theme.spacing.md, md: theme.spacing.lg, lg: theme.spacing.xl }[padding];

  const contenu = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: paddingValue,
        },
        theme.shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return contenu;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
});
