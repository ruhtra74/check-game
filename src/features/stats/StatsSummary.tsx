import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { PlayerStats } from '../../storage';

interface StatsSummaryProps {
  stats: PlayerStats;
}

const LIGNES: { cle: keyof PlayerStats; label: string }[] = [
  { cle: 'partiesJouees', label: 'Parties jouées' },
  { cle: 'victoires', label: 'Victoires' },
  { cle: 'tournoisGagnes', label: 'Tournois gagnés' },
];

/** Rangée de 3 chiffres clés, telle que vue dans le bloc "Statistiques rapides" du Profil. */
export function StatsSummary({ stats }: StatsSummaryProps) {
  const theme = useTheme();
  const display = resolveTextStyle(theme, 'display');
  const caption = resolveTextStyle(theme, 'caption');

  return (
    <View style={styles.row}>
      {LIGNES.map((ligne) => (
        <View key={ligne.cle} style={styles.bloc}>
          <Text style={[display, { fontSize: 22, color: theme.accent[600] }]}>{stats[ligne.cle]}</Text>
          <Text style={[caption, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            {ligne.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bloc: {
    alignItems: 'center',
    gap: 4,
  },
});
