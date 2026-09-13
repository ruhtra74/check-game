import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccueilScreen } from '../../features/home/AccueilScreen';
import { WelcomeScreen } from '../../features/onboarding/WelcomeScreen';
import { PseudoScreen } from '../../features/onboarding/PseudoScreen';
import { AvatarScreen } from '../../features/onboarding/AvatarScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';
import { CustomizeColorScreen } from '../../features/settings/CustomizeColorScreen';
import { StatsScreen } from '../../features/stats/StatsScreen';
import { RulesScreen } from '../../features/rules/RulesScreen';
import { ChoisirModeScreen } from '../../features/party/ChoisirModeScreen';
import { CreerPartieScreen } from '../../features/party/CreerPartieScreen';
import { RejoindrePartieScreen } from '../../features/party/RejoindrePartieScreen';
import { LobbyScreen } from '../../features/party/LobbyScreen';
import { TableJeuScreen } from '../../features/table/TableJeuScreen';
import type { JoueurAffichage } from '../../features/table/useMoteurJeu';
import type { GameConfig } from '../../engine';
import { appStorage } from '../../storage';

// Ce type grandit au fil de l'implémentation des écrans (Phase 5 : vrai moteur + réseau).
export type RootStackParamList = {
  Bienvenue: undefined;
  // pseudoInitial : présent uniquement en mode édition (depuis Profil), pour
  // pré-remplir le champ. undefined en onboarding classique.
  Pseudo: { pseudoInitial?: string } | undefined;
  Avatar: { pseudo: string };
  Accueil: undefined;
  Profil: undefined;
  Parametres: undefined;
  PersonnaliserCouleur: undefined;
  Statistiques: undefined;
  Regles: undefined;
  ChoisirMode: undefined;
  CreerPartie: undefined;
  RejoindrePartie: undefined;
  Lobby:
    | {
        mode: 'hote';
        nomPartie: string;
        estReseau?: boolean;
        joueursExistants?: { id: string; pseudo: string; emoji?: string }[];
      }
    | {
        mode: 'invite';
        nomPartie: string;
        hoteNom: string;
        estReseau?: boolean;
        hostIp?: string;
        port?: number;
      };
  TableJeu: {
    joueurs: JoueurAffichage[];
    config: GameConfig;
    estReseau?: boolean;
    mode?: 'hote' | 'invite' | 'hotseat';
    hostIp?: string;
    port?: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  // MMKV (ou le fallback mémoire) est synchrone : on peut décider la route
  // de départ dès le premier rendu, sans écran de chargement.
  const profilExiste = appStorage.getPseudo() !== null;

  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{ headerShown: false }}
      initialRouteName={profilExiste ? 'Accueil' : 'Bienvenue'}
    >
      <Stack.Screen name="Bienvenue" component={WelcomeScreen} />
      <Stack.Screen name="Pseudo" component={PseudoScreen} />
      <Stack.Screen name="Avatar" component={AvatarScreen} />
      <Stack.Screen name="Accueil" component={AccueilScreen} />
      <Stack.Screen name="Profil" component={ProfileScreen} />
      <Stack.Screen name="Parametres" component={SettingsScreen} />
      <Stack.Screen name="PersonnaliserCouleur" component={CustomizeColorScreen} />
      <Stack.Screen name="Statistiques" component={StatsScreen} />
      <Stack.Screen name="Regles" component={RulesScreen} />
      <Stack.Screen name="ChoisirMode" component={ChoisirModeScreen} />
      <Stack.Screen name="CreerPartie" component={CreerPartieScreen} />
      <Stack.Screen name="RejoindrePartie" component={RejoindrePartieScreen} />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="TableJeu" component={TableJeuScreen} />
    </Stack.Navigator>
  );
}