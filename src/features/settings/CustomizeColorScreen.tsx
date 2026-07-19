import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { Button, ScreenHeader, TextField } from '../../components';
import { useTheme, ACCENT_PRESETS, estHexValide } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonnaliserCouleur'>;

export function CustomizeColorScreen({ navigation }: Props) {
  const theme = useTheme();
  const body = resolveTextStyle(theme, 'body');

  const [hexSaisi, setHexSaisi] = useState(theme.accentHex);
  const valide = estHexValide(hexSaisi);
  const couleurApercu = valide ? hexSaisi : theme.accentHex;

  function appliquer() {
    if (!valide) return;
    theme.setAccentColor(hexSaisi);
    navigation.goBack();
  }

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <ScreenHeader title="Personnaliser la couleur" onBack={navigation.goBack} />

      {/* Aperçu live */}
      <View
        style={{
          height: 160,
          borderRadius: theme.radius.xl,
          backgroundColor: couleurApercu,
          marginBottom: theme.spacing.xl,
        }}
      />

      <Text style={[body, { color: theme.colors.textSecondary, marginBottom: theme.spacing.md }]}>
        Couleurs suggérées
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: theme.spacing.xl }}>
        {ACCENT_PRESETS.map((hex) => {
          const selectionne = hex.toLowerCase() === hexSaisi.toLowerCase();
          return (
            <Pressable
              key={hex}
              onPress={() => setHexSaisi(hex)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: hex,
                borderWidth: selectionne ? 3 : 0,
                borderColor: theme.colors.textPrimary,
              }}
            />
          );
        })}
      </View>

      <TextField
        label="Couleur personnalisée (hex)"
        value={hexSaisi}
        onChangeText={setHexSaisi}
        placeholder="#8B5CF6"
        autoCapitalize="characters"
        maxLength={7}
        error={!valide ? 'Format attendu : #RRGGBB' : undefined}
      />

      <View style={{ marginTop: theme.spacing.xxl }}>
        <Button label="APPLIQUER" onPress={appliquer} disabled={!valide} />
      </View>
    </ShellLayout>
  );
}