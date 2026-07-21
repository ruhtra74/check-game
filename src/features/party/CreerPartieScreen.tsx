import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { appStorage } from '../../storage';
import { Button, ScreenHeader, TextField } from '../../components';
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

  const [nom, setNom] = useState(nomParDefaut());

  function creer() {
    const nomFinal = nom.trim() || nomParDefaut();
    navigation.navigate('Lobby', { mode: 'hote', nomPartie: nomFinal });
  }

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <ScreenHeader title="Créer une partie" onBack={navigation.goBack} />

      <Text style={[body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xl }]}>
        Ce nom permettra aux autres joueurs de reconnaître ta partie quand ils chercheront à la
        rejoindre sur le réseau.
      </Text>

      <TextField label="Nom de la partie" value={nom} onChangeText={setNom} maxLength={30} autoFocus />

      <View style={{ marginTop: theme.spacing.xxl }}>
        <Button label="DEVENIR L'HÔTE" onPress={creer} />
      </View>
    </ShellLayout>
  );
}