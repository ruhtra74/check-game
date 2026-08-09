import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Switch, Text, View } from 'react-native';
import { appStorage } from '../../storage';
import { Button, Card, ScreenHeader, TextField } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'CreerPartie'>;

function nomParDefaut(): string {
  const pseudo = appStorage.getPseudo() ?? 'Joueur';
  return `Partie de ${pseudo}`;
}

export function CreerPartieScreen({ navigation }: Props) {
  const theme = useTheme();
  const body = resolveTextStyle(theme, 'body');
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const [nom, setNom] = useState(nomParDefaut());
  const [estReseau, setEstReseau] = useState(false);

  function creer() {
    const nomFinal = nom.trim() || nomParDefaut();
    navigation.navigate('Lobby', { mode: 'hote', nomPartie: nomFinal, estReseau });
  }

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <ScreenHeader title="Créer une partie" onBack={navigation.goBack} />

      <Text style={[body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xl }]}>
        Configure ta partie. Tu peux jouer localement sur le même téléphone (Pass-and-Play) ou activer le mode réseau LAN.
      </Text>

      <TextField label="Nom de la partie" value={nom} onChangeText={setNom} maxLength={30} autoFocus />

      <Card style={{ marginTop: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
            <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>Partie réseau (LAN / Wi-Fi)</Text>
            <Text style={[caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              {estReseau
                ? 'Les autres joueurs se connecteront depuis leurs Smartphones.'
                : 'Mode local (un seul appareil transmis de main en main).'}
            </Text>
          </View>
          <Switch
            value={estReseau}
            onValueChange={setEstReseau}
            trackColor={{ false: theme.colors.border, true: theme.accent[500] }}
            thumbColor={theme.colors.surface}
          />
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.xxl }}>
        <Button label="DEVENIR L'HÔTE" onPress={creer} />
      </View>
    </ShellLayout>
  );
}