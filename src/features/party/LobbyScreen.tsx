import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Switch, Text, View } from 'react-native';
import { Avatar, Button, Card, Dialog, ListRow, ScreenHeader, Stepper } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';
import type { JoueurAffichage } from '../table/useMoteurJeu';
import { useLobbySimulation } from './useLobbySimulation';
import { useLobbyNetwork } from './useLobbyNetwork';
import type { JoueurLobby } from './types';

import { NetworkManager } from '../../network/NetworkManager';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

export function LobbyScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const { mode, nomPartie } = route.params;
  const estReseau = route.params.estReseau ?? false;
  const hoteNomSiInvite = route.params.mode === 'invite' ? route.params.hoteNom : undefined;
  const joueursExistants = route.params.mode === 'hote' ? route.params.joueursExistants : undefined;
  const hostIp = route.params.mode === 'invite' ? route.params.hostIp : undefined;
  const hostPort = route.params.mode === 'invite' ? route.params.hostPort : undefined;

  // Bascule transparente : même interface de retour pour les deux hooks.
  const lobbyLocal = useLobbySimulation({ mode, nomPartie, hoteNomSiInvite, joueursExistants });
  const lobbyReseau = useLobbyNetwork({ mode, nomPartie, hoteNomSiInvite, hostIp, hostPort });
  const { etat, monId, basculerSelection, modifierConfig, demarrerPartie, confirmerPret, joueursSelectionnes, tousPrets } =
    estReseau ? lobbyReseau : lobbyLocal;

  const jeSuisHote = mode === 'hote';
  const monJoueur = etat.joueurs.find((j) => j.id === monId);
  const hote = etat.joueurs.find((j) => j.estHote);
  const maxCartesPourJoueurs = Math.floor(52 / etat.config.nbJoueurs);

  const [dialogFermee, setDialogFermee] = useState(false);
  useEffect(() => {
    if (etat.phase === 'confirmationDemarrage') setDialogFermee(false);
  }, [etat.phase]);

  useEffect(() => {
    if (etat.phase !== 'partieLancee') return;
    const joueursPourMoteur: JoueurAffichage[] = etat.joueurs
      .filter((j) => j.selectionne)
      .map((j) => ({ id: j.id, nom: j.pseudo, emoji: j.emoji }));
    navigation.replace('TableJeu', { joueurs: joueursPourMoteur, config: etat.config, estReseau, modeReseau: mode });
    // Volontairement limité à etat.phase : on ne veut déclencher la
    // navigation qu'une seule fois, au moment de la transition de phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.phase]);

  const enAttenteMaConfirmation =
    etat.phase === 'confirmationDemarrage' && monJoueur?.selectionne && monJoueur.pret === false;
  const afficherDialog = enAttenteMaConfirmation && !dialogFermee;

  const nbPrets = etat.joueurs.filter((j) => j.selectionne && j.pret).length;

  function quitterLobby() {
    NetworkManager.teardown();
    navigation.goBack();
  }

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <ScreenHeader title={etat.nomPartie} onBack={quitterLobby} />

      <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg }]}>
        Hôte : {hote?.pseudo ?? '...'}
      </Text>

      {/* Joueurs connectés */}
      <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
        JOUEURS CONNECTÉS ({etat.joueurs.length})
      </Text>
      <Card style={{ marginBottom: theme.spacing.lg }}>
        {etat.joueurs.map((joueur, index) => (
          <LigneJoueur
            key={joueur.id}
            joueur={joueur}
            avecSeparateur={index < etat.joueurs.length - 1}
            modifiable={jeSuisHote && !joueur.estHote}
            onBasculer={() => basculerSelection(joueur.id)}
          />
        ))}
      </Card>

      {/* Paramètres de partie */}
      <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
        PARAMÈTRES DE PARTIE
      </Text>
      <Card style={{ marginBottom: theme.spacing.xl }}>
        {jeSuisHote ? (
          <>
            <ListRow
              label="Cartes par joueur"
              avecSeparateur
              rightElement={
                <Stepper
                  value={etat.config.nbCartesInitial}
                  min={1}
                  max={maxCartesPourJoueurs}
                  onChange={(v) => modifierConfig({ nbCartesInitial: v })}
                />
              }
            />
            <ListRow
              label="Le Valet passe partout"
              avecSeparateur
              rightElement={
                <Switch
                  value={etat.config.jPassePartout}
                  onValueChange={(v) => modifierConfig({ jPassePartout: v })}
                  trackColor={{ true: theme.accent[400], false: theme.colors.border }}
                />
              }
            />
            <ListRow
              label="Rotation"
              value={etat.config.sensRotationParDefaut === 'horaire' ? 'Horaire' : 'Antihoraire'}
              onPress={() =>
                modifierConfig({
                  sensRotationParDefaut: etat.config.sensRotationParDefaut === 'horaire' ? 'antihoraire' : 'horaire',
                })
              }
            />
          </>
        ) : (
          <>
            <ListRow label="Cartes par joueur" value={String(etat.config.nbCartesInitial)} avecSeparateur />
            <ListRow label="Le Valet passe partout" value={etat.config.jPassePartout ? 'Oui' : 'Non'} avecSeparateur />
            <ListRow
              label="Rotation"
              value={etat.config.sensRotationParDefaut === 'horaire' ? 'Horaire' : 'Antihoraire'}
            />
          </>
        )}
      </Card>

      {/* Action de bas de page */}
      {jeSuisHote && etat.phase === 'attenteJoueurs' && (
        <Button
          label="DÉMARRER LA PARTIE"
          onPress={demarrerPartie}
          disabled={joueursSelectionnes.length < 2}
        />
      )}

      {!jeSuisHote && etat.phase === 'attenteJoueurs' && (
        <Text style={[bodyMedium, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
          En attente que l'hôte démarre la partie...
        </Text>
      )}

      {etat.phase === 'confirmationDemarrage' && (
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>
            {nbPrets}/{joueursSelectionnes.length} joueurs prêts
          </Text>
          {enAttenteMaConfirmation && dialogFermee && (
            <Button label="Répondre" variant="secondary" fullWidth={false} onPress={() => setDialogFermee(false)} />
          )}
        </View>
      )}

      <Dialog
        visible={!!afficherDialog}
        title="Prêt à commencer ?"
        onClose={() => setDialogFermee(true)}
        actions={[
          { label: 'Oui !', variant: 'success', onPress: () => confirmerPret(true) },
          { label: 'Non !!', variant: 'danger', onPress: () => setDialogFermee(true) },
        ]}
      >
        <Text
          style={[
            resolveTextStyle(theme, 'body'),
            { color: theme.colors.textSecondary, textAlign: 'center' },
          ]}
        >
          {nbPrets}/{joueursSelectionnes.length} prêts. L'hôte lancera la partie lorsque tous les joueurs
          auront répondu.
        </Text>
      </Dialog>
    </ShellLayout>
  );
}

function LigneJoueur({
  joueur,
  avecSeparateur,
  modifiable,
  onBasculer,
}: {
  joueur: JoueurLobby;
  avecSeparateur: boolean;
  modifiable: boolean;
  onBasculer: () => void;
}) {
  const theme = useTheme();
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const statutTexte = joueur.estHote
    ? 'Hôte'
    : joueur.pret
      ? 'Prêt'
      : !joueur.selectionne
        ? 'Exclu'
        : 'Connecté';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: avecSeparateur ? 1 : 0,
        borderBottomColor: theme.colors.border,
        opacity: joueur.selectionne ? 1 : 0.5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar
          nom={joueur.pseudo}
          emoji={joueur.emoji}
          size={40}
          statut={joueur.pret ? 'pret' : 'enAttente'}
          badge={joueur.estHote ? { icone: '♛', couleur: theme.colors.warning } : undefined}
        />
        <View style={{ marginLeft: theme.spacing.sm }}>
          <Text style={[bodyMedium, { color: theme.colors.textPrimary }]}>{joueur.pseudo}</Text>
          <Text style={[caption, { color: theme.colors.textSecondary }]}>{statutTexte}</Text>
        </View>
      </View>

      {modifiable && (
        <Switch
          value={joueur.selectionne}
          onValueChange={onBasculer}
          trackColor={{ true: theme.accent[400], false: theme.colors.border }}
        />
      )}
    </View>
  );
}