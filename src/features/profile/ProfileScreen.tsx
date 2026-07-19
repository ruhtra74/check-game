import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Switch, Text, View } from 'react-native';
import { Avatar, Card, ListRow, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { appStorage } from '../../storage';
import { emojiPourAvatarId } from '../onboarding/avatarOptions';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';
import { StatsSummary } from '../stats/StatsSummary';

type Props = NativeStackScreenProps<RootStackParamList, 'Profil'>;

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const caption = resolveTextStyle(theme, 'caption');

  const pseudo = appStorage.getPseudo() ?? 'Joueur';
  const emoji = emojiPourAvatarId(appStorage.getAvatarId());
  const stats = appStorage.getStats();

  const [vibrations, setVibrations] = useState(appStorage.getVibrationsEnabled());
  const [langue, setLangue] = useState(appStorage.getLanguage());

  function ouvrirEditionProfil() {
    navigation.navigate('Pseudo', { pseudoInitial: pseudo });
  }

  function basculerLangue() {
    const nouvelle = langue === 'fr' ? 'en' : 'fr';
    setLangue(nouvelle);
    appStorage.setLanguage(nouvelle);
  }

  return (
    <ShellLayout ongletActif={null}>
      <ScreenHeader title="Profil" onBack={navigation.goBack} />

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.xxl }}>
        <Pressable onPress={ouvrirEditionProfil}>
          <Avatar
            nom={pseudo}
            emoji={emoji}
            size={96}
            badge={{ icone: '✏️', couleur: theme.accent[500], position: 'basDroite' }}
          />
        </Pressable>
        <Text style={[h1, { color: theme.colors.textPrimary, marginTop: theme.spacing.md }]}>
          {pseudo} 👑
        </Text>
        <Pressable onPress={ouvrirEditionProfil} style={{ marginTop: theme.spacing.xs }}>
          <Text style={[caption, { color: theme.accent[600] }]}>Modifier</Text>
        </Pressable>
      </View>

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.md }]}>
          STATISTIQUES RAPIDES
        </Text>
        <StatsSummary stats={stats} />
      </Card>

      <Card>
        <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
          PRÉFÉRENCES
        </Text>

        <ListRow
          label="Couleur d'interface"
          onPress={() => navigation.navigate('PersonnaliserCouleur')}
          avecSeparateur
          rightElement={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: theme.accent[500],
                  marginRight: 6,
                }}
              />
              <Text style={{ color: theme.colors.textSecondary }}>›</Text>
            </View>
          }
        />
        <ListRow
          label="Langue"
          value={langue === 'fr' ? 'Français' : 'English'}
          onPress={basculerLangue}
          avecSeparateur
        />
        <ListRow
          label="Vibrations"
          rightElement={
            <Switch
              value={vibrations}
              onValueChange={(v) => {
                setVibrations(v);
                appStorage.setVibrationsEnabled(v);
              }}
              trackColor={{ true: theme.accent[400], false: theme.colors.border }}
            />
          }
        />
      </Card>
    </ShellLayout>
  );
}