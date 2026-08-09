import React, { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Button, Card, Dialog, PlayingCard, SYMBOLES_ENSEIGNE } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import {
  carteJouable,
  carteVisible,
  peutDeclencherVote,
  type Card as CarteMoteur,
  type GameState,
  type Suit,
  type TournoiState,
} from '../../engine';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';
import { useMoteurJeu, type JoueurAffichage } from './useMoteurJeu';

type Props = NativeStackScreenProps<RootStackParamList, 'TableJeu'>;

const ENSEIGNES: Suit[] = ['pique', 'coeur', 'trefle', 'carreau'];

function retourAccueil(navigation: Props['navigation']) {
  navigation.reset({ index: 0, routes: [{ name: 'Accueil' }] });
}

export function TableJeuScreen({ navigation, route }: Props) {
  const { joueurs, config } = route.params;
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const h2 = resolveTextStyle(theme, 'h2');
  const body = resolveTextStyle(theme, 'body');
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const {
    tournoi,
    manche,
    config: configActive,
    joueurActifId,
    infosAffichage,
    jouerCarte,
    partirEnBanque,
    choisirEnseigne,
    terminerMancheParVote,
    continuerVersProchaineManche,
  } = useMoteurJeu({ joueurs, config });

  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [revele, setRevele] = useState(false);
  const dernierActifRef = useRef(joueurActifId);
  useEffect(() => {
    if (dernierActifRef.current !== joueurActifId) {
      dernierActifRef.current = joueurActifId;
      setRevele(false);
      setSelectionId(null);
    }
  }, [joueurActifId]);

  const [confirmerSortie, setConfirmerSortie] = useState(false);
  const [confirmerVote, setConfirmerVote] = useState(false);

  // Bannière transitoire pour les événements Check / Games.
  const [messageEvenement, setMessageEvenement] = useState<string | null>(null);
  const nbEvenementsVusRef = useRef(0);
  useEffect(() => {
    const evenements = manche.evenements;
    if (evenements.length <= nbEvenementsVusRef.current) return undefined;
    const dernier = evenements[evenements.length - 1];
    nbEvenementsVusRef.current = evenements.length;
    if (dernier?.type === 'CHECK' || dernier?.type === 'GAMES') {
      const nom = infosAffichage.get(dernier.joueurId ?? '')?.nom ?? 'Un joueur';
      setMessageEvenement(dernier.type === 'CHECK' ? `⚠️ Check ! ${nom} n'a plus qu'une carte.` : `🎉 ${nom} a fini sa main !`);
      const t = setTimeout(() => setMessageEvenement(null), 2500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [manche.evenements, infosAffichage]);

  function quitter() {
    retourAccueil(navigation);
  }

  // ---------------------------------------------------------------------
  // Vues plein écran selon la phase de la partie
  // ---------------------------------------------------------------------

  if (tournoi.vainqueurId) {
    return <VueFinTournoi tournoi={tournoi} infosAffichage={infosAffichage} onQuitter={quitter} />;
  }

  if (manche.phase === 'bloque') {
    return (
      <VueBloquee
        raison={manche.raisonBlocage}
        onRetourAccueil={quitter}
        onVoirParametres={() => navigation.navigate('Parametres')}
      />
    );
  }

  if (manche.phase === 'mancheTerminee') {
    return (
      <VueFinManche
        manche={manche}
        infosAffichage={infosAffichage}
        numeroManche={tournoi.mancheCouranteNumero + 1}
        onContinuer={continuerVersProchaineManche}
      />
    );
  }

  if (!revele) {
    const joueur = joueurActifId ? infosAffichage.get(joueurActifId) : undefined;
    return <VuePassageAppareil joueur={joueur} onRevele={() => setRevele(true)} />;
  }

  // ---------------------------------------------------------------------
  // Table de jeu normale
  // ---------------------------------------------------------------------

  const monJoueurEtat = manche.joueurs.find((j) => j.id === joueurActifId);
  const adversaires = manche.joueurs.filter((j) => j.id !== joueurActifId);
  const top = carteVisible(manche);

  function estJouable(carte: CarteMoteur): boolean {
    return carteJouable(manche, carte, configActive);
  }

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <Pressable onPress={() => setConfirmerSortie(true)} hitSlop={12}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 20 }}>✕</Text>
        </Pressable>
        <Text style={[caption, { color: theme.colors.textSecondary }]}>
          Manche {tournoi.mancheCouranteNumero + 1}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {messageEvenement && (
        <Card style={{ backgroundColor: theme.accent[50], marginBottom: theme.spacing.md }}>
          <Text style={[bodyMedium, { color: theme.accent[700], textAlign: 'center' }]}>{messageEvenement}</Text>
        </Card>
      )}

      {/* Adversaires */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.md }}
      >
        {adversaires.map((joueur) => {
          const infos = infosAffichage.get(joueur.id);
          return (
            <View key={joueur.id} style={{ alignItems: 'center', opacity: joueur.qualifie ? 0.5 : 1 }}>
              <Avatar nom={infos?.nom ?? '?'} emoji={infos?.emoji} size={44} />
              <Text style={[caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                {infos?.nom} · {joueur.qualifie ? '🏆' : joueur.main.length}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {manche.compteurAttaque > 0 && (
        <Card style={{ backgroundColor: theme.colors.dangerBg, marginVertical: theme.spacing.sm }}>
          <Text style={[bodyMedium, { color: theme.colors.danger, textAlign: 'center' }]}>
            ⚔️ Attaque en cours : +{manche.compteurAttaque} cartes à encaisser
          </Text>
        </Card>
      )}
      {manche.enseigneCommandee && (
        <Card style={{ backgroundColor: theme.accent[50], marginVertical: theme.spacing.sm }}>
          <Text style={[bodyMedium, { color: theme.accent[700], textAlign: 'center' }]}>
            Enseigne imposée : {SYMBOLES_ENSEIGNE[manche.enseigneCommandee]}
          </Text>
        </Card>
      )}

      {/* Pile centrale + banque */}
      <View style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xl }}>
          <View style={{ alignItems: 'center' }}>
            {top && <PlayingCard carte={top} faceCachee taille="md" />}
            <Text style={[caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>
              Banque · {manche.banque.length}
            </Text>
          </View>
          {top && <PlayingCard carte={top} taille="lg" />}
        </View>
      </View>

      {peutDeclencherVote(manche) && (
        <Pressable onPress={() => setConfirmerVote(true)} style={{ alignSelf: 'center', marginBottom: theme.spacing.md }}>
          <Text style={[caption, { color: theme.accent[600] }]}>Terminer la manche maintenant ↗</Text>
        </Pressable>
      )}

      {/* Main du joueur actif */}
      <Text style={[h2, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
        Main de {infosAffichage.get(joueurActifId ?? '')?.nom ?? '...'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
      >
        {(monJoueurEtat?.main ?? []).map((carte) => {
          const jouable = estJouable(carte);
          return (
            <View key={carte.id} style={{ opacity: jouable ? 1 : 0.35 }}>
              <PlayingCard
                carte={carte}
                taille="md"
                selectionnee={carte.id === selectionId}
                onPress={jouable ? () => setSelectionId((actuel) => (actuel === carte.id ? null : carte.id)) : undefined}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <Button
          label="JOUER UNE CARTE"
          onPress={() => {
            if (selectionId) jouerCarte(selectionId);
            setSelectionId(null);
          }}
          disabled={!selectionId}
        />
        <Button label="BANQUE" variant="danger" onPress={partirEnBanque} />
      </View>

      <Dialog visible={manche.phase === 'choixEnseigneValet'} title="Choisis une enseigne">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, justifyContent: 'center' }}>
          {ENSEIGNES.map((enseigne) => (
            <Pressable
              key={enseigne}
              onPress={() => choisirEnseigne(enseigne)}
              style={{
                width: 70,
                height: 70,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  color: enseigne === 'coeur' || enseigne === 'carreau' ? theme.colors.danger : theme.colors.textPrimary,
                }}
              >
                {SYMBOLES_ENSEIGNE[enseigne]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Dialog>

      <Dialog
        visible={confirmerSortie}
        title="Quitter la partie ?"
        onClose={() => setConfirmerSortie(false)}
        actions={[
          { label: 'Quitter', variant: 'danger', onPress: quitter },
          { label: 'Annuler', variant: 'ghost', onPress: () => setConfirmerSortie(false) },
        ]}
      />

      <Dialog
        visible={confirmerVote}
        title="Terminer la manche ?"
        onClose={() => setConfirmerVote(false)}
        actions={[
          {
            label: 'Oui, terminer',
            variant: 'danger',
            onPress: () => {
              terminerMancheParVote();
              setConfirmerVote(false);
            },
          },
          { label: 'Annuler', variant: 'ghost', onPress: () => setConfirmerVote(false) },
        ]}
      >
        <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
          Les joueurs encore en jeu seront disqualifiés de ce tournoi.
        </Text>
      </Dialog>
    </ShellLayout>
  );
}

// ---------------------------------------------------------------------
// Vues plein écran
// ---------------------------------------------------------------------

function VuePassageAppareil({ joueur, onRevele }: { joueur?: JoueurAffichage; onRevele: () => void }) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const body = resolveTextStyle(theme, 'body');

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg }}>
        <Avatar nom={joueur?.nom ?? '?'} emoji={joueur?.emoji} size={96} />
        <Text style={[h1, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
          Au tour de {joueur?.nom ?? '...'}
        </Text>
        <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 260 }]}>
          Passe le téléphone, puis appuie pour voir ta main.
        </Text>
        <Button label="Voir mon jeu" onPress={onRevele} fullWidth={false} />
      </View>
    </ShellLayout>
  );
}

function VueFinManche({
  manche,
  infosAffichage,
  numeroManche,
  onContinuer,
}: {
  manche: GameState;
  infosAffichage: Map<string, JoueurAffichage>;
  numeroManche: number;
  onContinuer: () => void;
}) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const body = resolveTextStyle(theme, 'body');
  const caption = resolveTextStyle(theme, 'caption');

  const classement = manche.joueurs
    .filter((j) => j.qualifie && j.tempsQualificationMs !== undefined)
    .sort((a, b) => (a.tempsQualificationMs as number) - (b.tempsQualificationMs as number));

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <View style={{ alignItems: 'center', marginTop: theme.spacing.xxl }}>
        <Text style={{ fontSize: 56 }}>🏁</Text>
        <Text style={[h1, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: theme.spacing.sm }]}>
          Manche {numeroManche} terminée !
        </Text>
        {manche.perdantId && (
          <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm }]}>
            {infosAffichage.get(manche.perdantId)?.nom ?? 'Un joueur'} termine dernier et est éliminé du tournoi.
          </Text>
        )}
        {manche.joueursEliminesParVote && manche.joueursEliminesParVote.length > 0 && (
          <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm }]}>
            {manche.joueursEliminesParVote.map((id) => infosAffichage.get(id)?.nom).join(', ')}{' '}
            {manche.joueursEliminesParVote.length > 1 ? 'sont éliminés' : 'est éliminé'} du tournoi (vote unanime).
          </Text>
        )}
      </View>

      <Card style={{ marginTop: theme.spacing.xl }}>
        <Text style={[caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>
          CLASSEMENT DE LA MANCHE
        </Text>
        {classement.map((j, index) => (
          <View
            key={j.id}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.xs }}
          >
            <Text style={[body, { color: theme.colors.textPrimary }]}>
              {index + 1}. {infosAffichage.get(j.id)?.nom}
            </Text>
            <Text style={[body, { color: theme.colors.textSecondary }]}>
              {Math.round((j.tempsQualificationMs as number) / 1000)}s
            </Text>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="CONTINUER" onPress={onContinuer} />
      </View>
    </ShellLayout>
  );
}

function VueBloquee({
  raison,
  onRetourAccueil,
  onVoirParametres,
}: {
  raison: string | null;
  onRetourAccueil: () => void;
  onVoirParametres: () => void;
}) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const body = resolveTextStyle(theme, 'body');

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg }}>
        <Text style={{ fontSize: 56 }}>🚧</Text>
        <Text style={[h1, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
          La partie ne peut pas continuer
        </Text>
        <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 }]}>
          {raison ?? 'Une situation imprévue empêche de poursuivre cette manche.'}
        </Text>
        <Button label="Modifier les paramètres" variant="secondary" onPress={onVoirParametres} />
        <Button label="Retour à l'accueil" onPress={onRetourAccueil} />
      </View>
    </ShellLayout>
  );
}

function VueFinTournoi({
  tournoi,
  infosAffichage,
  onQuitter,
}: {
  tournoi: TournoiState;
  infosAffichage: Map<string, JoueurAffichage>;
  onQuitter: () => void;
}) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const body = resolveTextStyle(theme, 'body');

  const vainqueurId = tournoi.vainqueurId;
  const classementFinal = [
    ...(vainqueurId ? [vainqueurId] : []),
    ...[...tournoi.joueursElimines].reverse().map((e) => e.joueur.id),
  ];

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <View style={{ alignItems: 'center', marginTop: theme.spacing.xxl }}>
        <Text style={{ fontSize: 64 }}>🏆</Text>
        <Text style={[h1, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: theme.spacing.sm }]}>
          {vainqueurId ? `${infosAffichage.get(vainqueurId)?.nom ?? 'Un joueur'} remporte le tournoi !` : 'Tournoi terminé'}
        </Text>
      </View>

      <Card style={{ marginTop: theme.spacing.xl }}>
        {classementFinal.map((id, index) => (
          <View
            key={id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: theme.spacing.xs,
              borderBottomWidth: index < classementFinal.length - 1 ? 1 : 0,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text style={[body, { color: theme.colors.textPrimary }]}>
              {index + 1}. {infosAffichage.get(id)?.nom ?? '...'}
            </Text>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="RETOUR À L'ACCUEIL" onPress={onQuitter} />
      </View>
    </ShellLayout>
  );
}