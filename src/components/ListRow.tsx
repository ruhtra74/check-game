import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTextStyle } from '../theme/textStyle';

interface ListRowProps {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  /** Remplace la valeur texte + chevron par un élément custom (ex. un Switch). */
  rightElement?: React.ReactNode;
  /** Affiche une ligne de séparation en dessous (pour empiler plusieurs ListRow dans une seule Card). */
  avecSeparateur?: boolean;
}

/**
 * Ligne "label ... valeur >" utilisée dans les sections de Paramètres et le
 * bloc Préférences du Profil. Plusieurs ListRow s'empilent typiquement à
 * l'intérieur d'une seule Card (voir la maquette : sections "Général",
 * "Apparence", "Autres").
 */
export function ListRow({ label, value, icon, onPress, rightElement, avecSeparateur }: ListRowProps) {
  const theme = useTheme();
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const contenu = (
    <View
      style={[
        styles.row,
        { paddingVertical: theme.spacing.md },
        avecSeparateur && {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.left}>
        {icon && <Text style={{ fontSize: 18, marginRight: theme.spacing.sm }}>{icon}</Text>}
        <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>{label}</Text>
      </View>

      {rightElement ? (
        rightElement
      ) : (
        <View style={styles.right}>
          {value && (
            <Text style={[caption, { color: theme.colors.textSecondary, marginRight: 4 }]}>{value}</Text>
          )}
          {onPress && <Text style={{ color: theme.colors.textSecondary }}>›</Text>}
        </View>
      )}
    </View>
  );

  if (!onPress) return contenu;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
