import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { Card, Dialog, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { useNetworkStatus } from '../../network/useNetworkStatus';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'ChoisirMode'>;

export function ChoisirModeScreen({ navigation }: Props) {
  const theme = useTheme();
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');
  const body = resolveTextStyle(theme, 'body');

  const { surReseauLocal, verificationEnCours, rafraichir } = useNetworkStatus();
  const [aideVisible, setAideVisible] = useState(false);

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <ScreenHeader
        title="Jouer"
        onBack={navigation.goBack}
        rightElement={
          <Pressable
            onPress={() => setAideVisible(true)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.accent[50],
            }}
          >
            <Text style={{ color: theme.accent[700], fontWeight: '700' }}>?</Text>
          </Pressable>
        }
      />

      {!verificationEnCours && !surReseauLocal && (
        <Pressable onPress={rafraichir}>
          <Card
            style={{
              backgroundColor: theme.colors.warningBg,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text style={[bodyMedium, { color: theme.colors.warning, marginBottom: 2 }]}>
              ⚠️ Pas de réseau Wi-Fi détecté
            </Text>
            <Text style={[caption, { color: theme.colors.textSecondary }]}>
              Connecte-toi au même Wi-Fi que les autres joueurs pour créer ou rejoindre une partie.
              Touche pour revérifier.
            </Text>
          </Card>
        </Pressable>
      )}

      <View style={{ gap: theme.spacing.md }}>
        <Card onPress={() => navigation.navigate('CreerPartie')}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: theme.spacing.md }}>🎲</Text>
            <View>
              <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>Créer une partie</Text>
              <Text style={[caption, { color: theme.colors.textSecondary }]}>Devenez l'hôte</Text>
            </View>
          </View>
        </Card>

        <Card onPress={() => navigation.navigate('RejoindrePartie')}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: theme.spacing.md }}>🔗</Text>
            <View>
              <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>Rejoindre une partie</Text>
              <Text style={[caption, { color: theme.colors.textSecondary }]}>
                Rejoindre une partie sur le réseau
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: theme.spacing.md }}>🕓</Text>
            <View>
              <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>Parties récentes</Text>
              <Text style={[caption, { color: theme.colors.textSecondary }]}>Aucune partie récente</Text>
            </View>
          </View>
        </Card>
      </View>

      <Dialog
        visible={aideVisible}
        title="Jouer en réseau local"
        onClose={() => setAideVisible(false)}
        actions={[{ label: 'Compris', onPress: () => setAideVisible(false) }]}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[body, { color: theme.colors.textSecondary }]}>
            1. Connecte tous les appareils au même réseau Wi-Fi (la box de la maison, ou un partage
            de connexion depuis un des téléphones).
          </Text>
          <Text style={[body, { color: theme.colors.textSecondary }]}>
            2. Désactive les VPN actifs — ils empêchent souvent les appareils de se voir entre eux.
          </Text>
          <Text style={[body, { color: theme.colors.textSecondary }]}>
            3. Évite les réseaux Wi-Fi "invités" ou publics : ils isolent souvent les appareils les
            uns des autres. Préfère un réseau personnel.
          </Text>
          <Text style={[body, { color: theme.colors.textSecondary }]}>
            4. Un joueur crée la partie (il devient l'hôte), les autres la rejoignent ensuite depuis
            le même réseau.
          </Text>
        </View>
      </Dialog>
    </ShellLayout>
  );
}