import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { appStorage } from '../../storage';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { AVATAR_OPTIONS } from './avatarOptions';
import { OnboardingLayout } from './OnboardingLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Avatar'>;

export function AvatarScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const body = resolveTextStyle(theme, 'body');

  const { pseudo } = route.params;
  const [avatarId, setAvatarId] = useState<string | null>(null);

  function terminer() {
    if (!avatarId) return;
    appStorage.setPseudo(pseudo);
    appStorage.setAvatarId(avatarId);
    // reset() plutôt que navigate() : on ne doit pas pouvoir revenir à
    // l'onboarding avec le bouton retour une fois le profil créé.
    navigation.reset({ index: 0, routes: [{ name: 'Accueil' }] });
  }

  return (
    <OnboardingLayout
      etape={2}
      pied={<Button label="Terminer" onPress={terminer} disabled={!avatarId} />}
    >
      <View>
        <Text style={[h1, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
          Choisis ton avatar
        </Text>
        <Text style={[body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xxl }]}>
          Tu pourras en changer plus tard depuis ton profil.
        </Text>

        <View style={styles.grille}>
          {AVATAR_OPTIONS.map((option) => {
            const selectionne = option.id === avatarId;
            return (
              <Pressable
                key={option.id}
                onPress={() => setAvatarId(option.id)}
                style={[
                  styles.tuile,
                  {
                    borderColor: selectionne ? theme.accent[500] : 'transparent',
                    backgroundColor: selectionne ? theme.accent[50] : 'transparent',
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <Avatar nom={pseudo} emoji={option.emoji} size={56} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  tuile: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
