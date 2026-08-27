import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Card, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';
import { DiscoveryService, type DiscoveredGame } from '../../network/discovery';

type Props = NativeStackScreenProps<RootStackParamList, 'RejoindrePartie'>;

export function RejoindrePartieScreen({ navigation }: Props) {
  const theme = useTheme();
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const [parties, setParties] = React.useState<DiscoveredGame[]>([]);

  React.useEffect(() => {
    // Démarre l'écoute des services mDNS (Local Wi-Fi)
    DiscoveryService.startScanning(
      (nouveauHost) => {
        setParties((actuel) => {
          const existeDeja = actuel.findIndex((p) => p.id === nouveauHost.id);
          if (existeDeja >= 0) {
            const up = [...actuel];
            up[existeDeja] = nouveauHost;
            return up;
          }
          return [...actuel, nouveauHost];
        });
      },
      (serviceNameLost) => {
        setParties((actuel) => actuel.filter((p) => p.id !== serviceNameLost));
      }
    );

    return () => {
      DiscoveryService.stopScanning();
    };
  }, []);

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <ScreenHeader title="Rejoindre une partie" onBack={navigation.goBack} />

      <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg }]}>
        Recherche de parties sur le réseau local Wi-Fi...
      </Text>

      <View style={{ gap: theme.spacing.md }}>
        {parties.map((partie) => (
          <Card
            key={partie.id}
            onPress={() =>
              navigation.navigate('Lobby', {
                mode: 'invite',
                nomPartie: partie.nomPartie,
                hoteNom: partie.hoteNom,
                estReseau: true,
                hostIp: partie.hostIp,
                hostPort: partie.port,
              })
            }
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>{partie.nomPartie}</Text>
                <Text style={[caption, { color: theme.colors.textSecondary }]}>Hôte : {partie.hoteNom}</Text>
              </View>
              <Text style={[caption, { color: theme.accent[600] }]}>
                (Réseau LAN)
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ShellLayout>
  );
}