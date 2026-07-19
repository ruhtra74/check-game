import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface ProgressDotsProps {
  total: number;
  /** Index de l'étape active, base 0. */
  activeIndex: number;
}

/**
 * Indicateur de progression (ex. onboarding : Bienvenue -> Pseudo -> Avatar).
 * Le point actif s'étire en pilule dans la couleur dominante, les autres
 * restent des points neutres.
 */
export function ProgressDots({ total, activeIndex }: ProgressDotsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => {
        const actif = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: actif ? 22 : 8,
                backgroundColor: actif ? theme.accent[500] : theme.colors.border,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
