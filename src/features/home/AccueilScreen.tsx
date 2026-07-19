import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { Avatar, Button, Card } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { appStorage } from '../../storage';
import { emojiPourAvatarId } from '../onboarding/avatarOptions';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Accueil'>;

export function AccueilScreen({ navigation }: Props) {
  const theme = useTheme();
  const display = resolveTextStyle(theme, 'display');
  const body = resolveTextStyle(theme, 'body');
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');

  // Lecture synchrone (MMKV / fallback mémoire) — pas d'état de chargement nécessaire.
  const pseudo = appStorage.getPseudo() ?? 'Joueur';
  const emojiAvatar = emojiPourAvatarId(appStorage.getAvatarId());

  // Profil n'est plus dans la barre de navigation : on y accède en tapant le header.
  const itemsMenu: { id: string; label: string; glyphe: string; onPress: () => void }[] = [
    { id: 'stats', label: 'Statistiques', glyphe: '📊', onPress: () => navigation.navigate('Statistiques') },
    { id: 'parametres', label: 'Paramètres', glyphe: '⚙️', onPress: () => navigation.navigate('Parametres') },
    { id: 'regles', label: 'Règles du jeu', glyphe: 'ℹ️', onPress: () => navigation.navigate('Regles') },
  ];

  return (
    <ShellLayout ongletActif="accueil">
      {/* En-tête — tapable, mène au Profil (avatar ou nom) */}
      <Pressable
        onPress={() => navigation.navigate('Profil')}
        style={{ flexDirection: 'row', alignItems: 'center' }}
      >
        <Avatar nom={pseudo} emoji={emojiAvatar} size={56} />
        <View style={{ marginLeft: theme.spacing.md }}>
          <Text style={[body, { color: theme.colors.textSecondary }]}>Bonjour,</Text>
          <Text style={[display, { color: theme.colors.textPrimary, fontSize: 20, lineHeight: 26 }]}>
            {pseudo} 👑
          </Text>
        </View>
      </Pressable>

      {/* Action principale */}
      <View style={{ marginTop: theme.spacing.xxl }}>
        <Button label="JOUER" onPress={() => {}} />
      </View>

      {/* Menu secondaire */}
      <View style={{ marginTop: theme.spacing.xxl, gap: theme.spacing.md }}>
        {itemsMenu.map((item) => (
          <Card key={item.id} onPress={item.onPress} padding="md">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>{item.glyphe}</Text>
              <Text style={[bodyMedium, { color: theme.colors.textPrimary, marginLeft: theme.spacing.md }]}>
                {item.label}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ShellLayout>
  );
}