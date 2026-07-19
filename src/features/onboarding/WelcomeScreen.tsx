import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Button } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { OnboardingLayout } from './OnboardingLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Accueil'>;

export function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const display = resolveTextStyle(theme, 'display');
  const body = resolveTextStyle(theme, 'body');

  return (
    <OnboardingLayout
      etape={0}
      pied={<Button label="Commencer" onPress={() => navigation.navigate('Pseudo' as any)} />}
    >
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 72, marginBottom: theme.spacing.lg }}>🃏</Text>
        <Text
          style={[
            display,
            { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: theme.spacing.sm },
          ]}
        >
          Bienvenue !
        </Text>
        <Text
          style={[
            body,
            { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 },
          ]}
        >
          Configurons ton profil en 2 étapes avant de rejoindre tes premières parties.
        </Text>
      </View>
    </OnboardingLayout>
  );
}
