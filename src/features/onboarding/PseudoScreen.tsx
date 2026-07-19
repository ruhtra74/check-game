import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Button, TextField } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { OnboardingLayout } from './OnboardingLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Pseudo'>;

const LONGUEUR_MIN = 2;
const LONGUEUR_MAX = 16;

function validerPseudo(valeur: string): string | undefined {
  const nettoye = valeur.trim();
  if (nettoye.length < LONGUEUR_MIN) return `Au moins ${LONGUEUR_MIN} caractères.`;
  if (nettoye.length > LONGUEUR_MAX) return `Maximum ${LONGUEUR_MAX} caractères.`;
  return undefined;
}

export function PseudoScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const body = resolveTextStyle(theme, 'body');

  const [pseudo, setPseudo] = useState('');
  const [erreur, setErreur] = useState<string | undefined>(undefined);
  const [aEteTouche, setATeEteTouche] = useState(false);

  const erreurAffichee = aEteTouche ? erreur : undefined;

  function continuer() {
    const messageErreur = validerPseudo(pseudo);
    setATeEteTouche(true);
    setErreur(messageErreur);
    if (messageErreur) return;
    navigation.navigate('Avatar', { pseudo: pseudo.trim() });
  }

  return (
    <OnboardingLayout
      etape={1}
      pied={<Button label="Continuer" onPress={continuer} disabled={aEteTouche && !!erreur} />}
    >
      <View>
        <Text style={[h1, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
          Comment veux-tu qu'on t'appelle ?
        </Text>
        <Text style={[body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xxl }]}>
          Ce pseudo sera visible par les autres joueurs pendant les parties.
        </Text>
        <TextField
          label="Pseudo"
          value={pseudo}
          onChangeText={(v) => {
            setPseudo(v);
            if (aEteTouche) setErreur(validerPseudo(v));
          }}
          placeholder="ex. AlexPlayer"
          autoFocus
          maxLength={LONGUEUR_MAX}
          error={erreurAffichee}
          onSubmitEditing={continuer}
          returnKeyType="next"
        />
      </View>
    </OnboardingLayout>
  );
}
