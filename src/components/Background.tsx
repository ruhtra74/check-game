import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface BackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Désactive les formes décoratives (utile sur des écrans denses type Dialog). */
  decor?: boolean;
}

/**
 * Fond standard de l'application : couleur de fond neutre + grandes formes
 * arrondies très translucides dans la couleur dominante, comme sur chaque
 * écran de la maquette. Purement décoratif, ne capte aucun événement.
 */
export function Background({ children, style, decor = true }: BackgroundProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      {decor && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={[
              styles.blob,
              {
                backgroundColor: theme.accent[200],
                width: 260,
                height: 260,
                borderRadius: 130,
                top: -80,
                right: -70,
                opacity: 0.5,
              },
            ]}
          />
          <View
            style={[
              styles.blob,
              {
                backgroundColor: theme.accent[100],
                width: 200,
                height: 200,
                borderRadius: 100,
                bottom: -60,
                left: -60,
                opacity: 0.6,
              },
            ]}
          />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
  },
});
