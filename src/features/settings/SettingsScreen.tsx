import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Switch, Text, View } from 'react-native';
import { Card, Dialog, ListRow, ScreenHeader, Stepper } from '../../components';
import { useTheme, DEFAULT_ACCENT_HEX, ACCENT_PRESETS } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { appStorage, GAME_CONFIG_DEFAUT } from '../../storage';
import type { GameConfig } from '../../engine';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Parametres'>;

// nbJoueurs * nbCartesInitial doit rester < 53 (spec du moteur, section 1.1 / addendum D).
const MAX_TOTAL_CARTES = 52;

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const caption = resolveTextStyle(theme, 'caption');
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');

  const [vibrations, setVibrations] = useState(appStorage.getVibrationsEnabled());
  const [langue, setLangue] = useState(appStorage.getLanguage());
  const [gameConfig, setGameConfig] = useState<GameConfig>(() => appStorage.getGameConfig());
  const [confirmationReset, setConfirmationReset] = useState(false);

  // nbJoueurs n'est plus modifiable ici : ce n'est pas une préférence, c'est
  // dérivé du nombre de joueurs réellement connectés une fois dans un lobby
  // (voir LobbyScreen). Ici, sa valeur par défaut sert uniquement de base au
  // calcul du plafond de cartes avant qu'un lobby n'existe.
  const maxCartesPourJoueurs = Math.floor(MAX_TOTAL_CARTES / gameConfig.nbJoueurs);

  function basculerLangue() {
    const nouvelle = langue === 'fr' ? 'en' : 'fr';
    setLangue(nouvelle);
    appStorage.setLanguage(nouvelle);
  }

  function updateGameConfig(patch: Partial<GameConfig>) {
    setGameConfig((actuel) => {
      const next: GameConfig = { ...actuel, ...patch };
      // Si le nouveau nombre de joueurs rend le nombre de cartes actuel
      // invalide, on le ramène automatiquement au maximum permis plutôt que
      // de laisser l'utilisateur dans un état invalide.
      const max = Math.floor(MAX_TOTAL_CARTES / next.nbJoueurs);
      if (next.nbCartesInitial > max) next.nbCartesInitial = max;
      if (next.nbCartesInitial < 2) next.nbCartesInitial = 2;
      appStorage.setGameConfig(next);
      return next;
    });
  }

  function basculerRotation() {
    updateGameConfig({
      sensRotationParDefaut: gameConfig.sensRotationParDefaut === 'horaire' ? 'antihoraire' : 'horaire',
    });
  }

  function reinitialiserParametresJeu() {
    setGameConfig(GAME_CONFIG_DEFAUT);
    appStorage.setGameConfig(GAME_CONFIG_DEFAUT);
  }

  function reinitialiser() {
    theme.setAccentColor(DEFAULT_ACCENT_HEX);
    appStorage.setVibrationsEnabled(true);
    appStorage.setLanguage('fr');
    setVibrations(true);
    setLangue('fr');
    setConfirmationReset(false);
  }

  return (
    <ShellLayout ongletActif="parametres">
      <ScreenHeader title="Paramètres" onBack={navigation.goBack} />

      <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
        GÉNÉRAL
      </Text>
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <ListRow label="Langue" value={langue === 'fr' ? 'Français' : 'English'} onPress={basculerLangue} avecSeparateur />
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

      {/* Paramètres de jeu : ce sont les valeurs par défaut proposées (et
          modifiables) dans le lobby quand cet appareil est l'hôte d'une
          partie — voir spec moteur section 1.1 et addendum C. */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xs,
        }}
      >
        <Text style={[caption, { color: theme.colors.textSecondary }]}>PARAMÈTRES DE JEU</Text>
        <Pressable onPress={reinitialiserParametresJeu}>
          <Text style={[caption, { color: theme.accent[600] }]}>↺ Réinitialiser</Text>
        </Pressable>
      </View>
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <ListRow
          label="Cartes par joueur"
          avecSeparateur
          rightElement={
            <Stepper
              value={gameConfig.nbCartesInitial}
              min={2}
              max={maxCartesPourJoueurs}
              onChange={(v) => updateGameConfig({ nbCartesInitial: v })}
            />
          }
        />
        <Text
          style={[
            caption,
            { color: theme.colors.textSecondary, marginTop: -theme.spacing.sm, marginBottom: theme.spacing.sm },
          ]}
        >
          Le nombre de joueurs dépend de qui se connecte à ta partie — la limite de cartes sera
          recalculée automatiquement dans le lobby en fonction des joueurs réellement présents.
        </Text>

        <ListRow
          label="Le Valet passe partout"
          avecSeparateur
          rightElement={
            <Switch
              value={gameConfig.jPassePartout}
              onValueChange={(v) => updateGameConfig({ jPassePartout: v })}
              trackColor={{ true: theme.accent[400], false: theme.colors.border }}
            />
          }
        />
        <ListRow
          label="Rotation par défaut"
          value={gameConfig.sensRotationParDefaut === 'horaire' ? 'Horaire' : 'Antihoraire'}
          onPress={basculerRotation}
          avecSeparateur
        />
        <ListRow
          label="Pénalité 7 (cartes)"
          avecSeparateur
          rightElement={
            <Stepper
              value={gameConfig.penaliteSept}
              min={1}
              max={10}
              onChange={(v) => updateGameConfig({ penaliteSept: v })}
            />
          }
        />
        <ListRow
          label="Pénalité Joker (cartes)"
          rightElement={
            <Stepper
              value={gameConfig.penaliteJoker}
              min={1}
              max={10}
              onChange={(v) => updateGameConfig({ penaliteJoker: v })}
            />
          }
        />
      </Card>

      <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
        APPARENCE
      </Text>
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text style={[bodyMedium, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
          Couleur dominante
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md }}>
          {ACCENT_PRESETS.map((hex) => {
            const selectionne = hex.toLowerCase() === theme.accentHex.toLowerCase();
            return (
              <Pressable
                key={hex}
                onPress={() => theme.setAccentColor(hex)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: hex,
                  borderWidth: selectionne ? 3 : 0,
                  borderColor: theme.colors.textPrimary,
                }}
              />
            );
          })}
        </View>
        <ListRow label="Personnaliser" onPress={() => navigation.navigate('PersonnaliserCouleur')} />
      </Card>

      <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
        AUTRES
      </Text>
      <Card>
        <ListRow label="Réinitialiser les paramètres" onPress={() => setConfirmationReset(true)} />
      </Card>

      <Dialog
        visible={confirmationReset}
        title="Réinitialiser les paramètres ?"
        onClose={() => setConfirmationReset(false)}
        actions={[
          { label: 'Réinitialiser', variant: 'danger', onPress: reinitialiser },
          { label: 'Annuler', variant: 'ghost', onPress: () => setConfirmationReset(false) },
        ]}
      />
    </ShellLayout>
  );
}