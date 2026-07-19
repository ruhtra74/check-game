import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTextStyle } from '../theme/textStyle';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

/**
 * En-tête "‹ Titre" vu sur tous les écrans secondaires de la maquette
 * (Paramètres, Profil, Personnaliser la couleur...). L'Accueil n'en a pas
 * besoin (c'est la racine, pas de retour possible).
 */
export function ScreenHeader({ title, onBack, rightElement }: ScreenHeaderProps) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');

  return (
    <View style={[styles.row, { marginBottom: theme.spacing.xxl }]}>
      <View style={styles.side}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={[h1, { color: theme.colors.textPrimary }]}>‹</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.titreWrapper}>
        <Text style={[h1, { color: theme.colors.textPrimary, textAlign: 'center' }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={[styles.side, styles.sideRight]}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 32,
  },
  titreWrapper: {
    flex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
});
