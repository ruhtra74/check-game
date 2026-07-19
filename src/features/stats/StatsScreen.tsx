import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Card, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { appStorage } from '../../storage';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';
import { StatsSummary } from './StatsSummary';

type Props = NativeStackScreenProps<RootStackParamList, 'Statistiques'>;

export function StatsScreen({ navigation }: Props) {
  const theme = useTheme();
  const body = resolveTextStyle(theme, 'body');
  const stats = appStorage.getStats();

  const tauxVictoire =
    stats.partiesJouees > 0 ? Math.round((stats.victoires / stats.partiesJouees) * 100) : 0;

  return (
    <ShellLayout ongletActif="statistiques">
      <ScreenHeader title="Statistiques" onBack={navigation.goBack} />

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <StatsSummary stats={stats} />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[body, { color: theme.colors.textSecondary }]}>Taux de victoire</Text>
          <Text style={[body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
            {tauxVictoire}%
          </Text>
        </View>
      </Card>

      {stats.partiesJouees === 0 && (
        <Text
          style={[
            body,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.xxl },
          ]}
        >
          Joue ta première partie pour commencer à construire tes statistiques !
        </Text>
      )}
    </ShellLayout>
  );
}