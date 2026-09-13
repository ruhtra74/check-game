import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button, Card, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';
import { discoveryService, type PartieDecouverte } from '../../network/discovery';
import { listerPartiesDecouvertes as listerPartiesMock } from './mockPartyService';

type Props = NativeStackScreenProps<RootStackParamList, 'RejoindrePartie'>;

export function RejoindrePartieScreen({ navigation }: Props) {
  const theme = useTheme();
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const [partiesLan, setPartiesLan] = useState<PartieDecouverte[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(true);
  const [afficherMocks, setAfficherMocks] = useState(false);

  useEffect(() => {
    setRechercheEnCours(true);
    discoveryService.demarrerScan((parties) => {
      setPartiesLan(parties);
      setRechercheEnCours(false);
    });

    // Arrêter le chargement après 3s si aucune partie trouvée
    const t = setTimeout(() => setRechercheEnCours(false), 3000);

    return () => {
      clearTimeout(t);
      discoveryService.arreterScan();
    };
  }, []);

  const partiesMock = listerPartiesMock();

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <ScreenHeader title="Rejoindre une partie" onBack={navigation.goBack} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <Text style={[caption, { color: theme.colors.textSecondary }]}>
          Parties trouvées sur le Wi-Fi local
        </Text>
        {rechercheEnCours && <ActivityIndicator size="small" color={theme.accent[500]} />}
      </View>

      {partiesLan.length > 0 ? (
        <View style={{ gap: theme.spacing.md }}>
          {partiesLan.map((partie) => (
            <Card
              key={partie.id}
              onPress={() =>
                navigation.navigate('Lobby', {
                  mode: 'invite',
                  nomPartie: partie.nom,
                  hoteNom: partie.hoteNom,
                  estReseau: true,
                  hostIp: partie.hostIp,
                  port: partie.port,
                })
              }
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>{partie.nom}</Text>
                  <Text style={[caption, { color: theme.colors.textSecondary }]}>
                    Hôte : {partie.hoteNom} ({partie.hostIp})
                  </Text>
                </View>
                <Text style={[caption, { color: theme.accent[600] }]}>
                  {partie.nbJoueurs}/{partie.nbJoueursMax}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      ) : !rechercheEnCours && !afficherMocks ? (
        <Card style={{ alignItems: 'center', paddingVertical: theme.spacing.xl, gap: theme.spacing.md }}>
          <Text style={[bodyMedium, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            Aucune partie réseau détectée sur votre Wi-Fi.
          </Text>
          <Button
            label="Simuler des parties (Mode démo)"
            variant="secondary"
            fullWidth={false}
            onPress={() => setAfficherMocks(true)}
          />
        </Card>
      ) : null}

      {afficherMocks && (
        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <Text style={[caption, { color: theme.colors.warning }]}>
            --- PARTIES DE DÉMO (SIMULATION) ---
          </Text>
          {partiesMock.map((partie) => (
            <Card
              key={partie.id}
              onPress={() =>
                navigation.navigate('Lobby', {
                  mode: 'invite',
                  nomPartie: partie.nom,
                  hoteNom: partie.hoteNom,
                  estReseau: false,
                })
              }
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>{partie.nom}</Text>
                  <Text style={[caption, { color: theme.colors.textSecondary }]}>
                    Hôte (Démo) : {partie.hoteNom}
                  </Text>
                </View>
                <Text style={[caption, { color: theme.accent[600] }]}>
                  {partie.nbJoueurs}/{partie.nbJoueursMax}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ShellLayout>
  );
}