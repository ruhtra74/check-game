import React, { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Button, Card, Dialog, PlayingCard, SYMBOLES_ENSEIGNE } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { appStorage } from '../../storage';
import {
  carteJouable,
  carteVisible,
  peutDeclencherVote,
  peutPiocher,
  type Card as CarteMoteur,
  type GameConfig,
  type GameState,
  type PlayerState,
  type Suit,
  type TournoiState,
} from '../../engine';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';
import { useMoteurJeu, type JoueurAffichage } from './useMoteurJeu';
import { useMoteurJeuHote } from './useMoteurJeuHote';
import { useMoteurJeuClient } from './useMoteurJeuClient';

type Props = NativeStackScreenProps<RootStackParamList, 'TableJeu'>;

const ENSEIGNES: Suit[] = ['pique', 'coeur', 'trefle', 'carreau'];

function retourAccueil(navigation: Props['navigation']) {
  NetworkManager.teardown();
  navigation.reset({ index: 0, routes: [{ name: 'Accueil' }] });
}

function construireJoueursPourLobby(
  tournoi: TournoiState,
  infosAffichage: Map<string, JoueurAffichage>
): { id: string; pseudo: string; emoji?: string }[] {
  return tournoi.joueursActifs.map((j) => {
    const infos = infosAffichage.get(j.id);
    return { id: j.id, pseudo: infos?.nom ?? j.nom, emoji: infos?.emoji };
  });
}

export function TableJeuScreen(props: Props) {
  const estReseau = props.route.params.estReseau ?? false;
  const mode = props.route.params.mode ?? (estReseau ? 'hote' : 'hotseat');

  if (estReseau) {
    if (mode === 'hote') {
      return <TableJeuHoteReseau {...props} />;
    } else {
      return <TableJeuClientReseau {...props} />;
    }
  }

  return <TableJeuHotseat {...props} />;
}

function TableJeuHotseat(props: Props) {
  const { joueurs, config } = props.route.params;
  const controller = useMoteurJeu({ joueurs, config });

  return <TableJeuContent {...props} estReseau={false} controller={controller} />;
}

function TableJeuHoteReseau(props: Props) {
  const { joueurs, config, port } = props.route.params;
  const controller = useMoteurJeuHote({ joueurs, config, port });

  return <TableJeuContent {...props} estReseau={true} mode="hote" controller={controller} />;
}

function TableJeuClientReseau(props: Props) {
  const { joueurs, config, hostIp = '127.0.0.1', port } = props.route.params;
  const controller = useMoteurJeuClient({ joueurs, config, hostIp, port });

  return (
    <TableJeuContent
      {...props}
      estReseau={true}
      mode="invite"
      hoteDeconnecte={controller.hoteDeconnecte}
      controller={controller}
    />
  );
}

interface TableJeuContentProps extends Props {
  estReseau: boolean;
  mode?: 'hote' | 'invite' | 'hotseat';
  hoteDeconnecte?: string | null;
  controller: {
    tournoi: TournoiState | null;
    manche: GameState | null;
    config: GameConfig;
    joueurActifId: string | null;
    infosAffichage: Map<string, JoueurAffichage>;
    jouerCarte: (id: string) => void;
    partirEnBanque: () => void;
    choisirEnseigne: (e: Suit) => void;
    terminerPartieBlocage: () => void;
    terminerMancheParVote: () => void;
    continuerVersProchaineManche: () => void;
  };
}

function TableJeuContent({ navigation, route, estReseau, hoteDeconnecte, controller }: TableJeuContentProps) {
  const { joueurs } = route.params;
  const {
    tournoi,
    manche,
    config: configActive,
    joueurActifId,
    infosAffichage,
    jouerCarte,
    partirEnBanque,
    choisirEnseigne,
    terminerPartieBlocage,
    terminerMancheParVote,
    continuerVersProchaineManche,
  } = controller;

  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const h2 = resolveTextStyle(theme, 'h2');
  const body = resolveTextStyle(theme, 'body');
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');
  const caption = resolveTextStyle(theme, 'caption');

  const monId = appStorage.getPlayerUuid();

  const [selectionId, setSelectionId] = useState<string | null>(null);
  // En mode réseau, la main du joueur local est toujours révélée immédiatement sur son propre téléphone
  const [revele, setRevele] = useState(estReseau);
  const dernierActifRef = useRef(joueurActifId);

  useEffect(() => {
    if (dernierActifRef.current !== joueurActifId) {
      dernierActifRef.current = joueurActifId;
      if (!estReseau) setRevele(false);
      setSelectionId(null);
    }
  }, [joueurActifId, estReseau]);

  const [confirmerSortie, setConfirmerSortie] = useState(false);
  const [confirmerVote, setConfirmerVote] = useState(false);
  const [confirmerBlocage, setConfirmerBlocage] = useState(false);

  const [messageEvenement, setMessageEvenement] = useState<string | null>(null);
  const nbEvenementsVusRef = useRef(0);

  useEffect(() => {
    if (!manche) return undefined;
    const evenements = manche.evenements;
    if (evenements.length <= nbEvenementsVusRef.current) return undefined;
    const dernier = evenements[evenements.length - 1];
    nbEvenementsVusRef.current = evenements.length;
    if (dernier?.type === 'CHECK' || dernier?.type === 'GAMES') {
      const nom = infosAffichage.get(dernier.joueurId ?? '')?.nom ?? 'Un joueur';
      setMessageEvenement(
        dernier.type === 'CHECK' ? `⚠️ Check ! ${nom} n'a plus qu'une carte.` : `🎉 ${nom} a fini sa main !`
      );
      const t = setTimeout(() => setMessageEvenement(null), 2500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [manche, infosAffichage]);

  if (hoteDeconnecte) {
    return (
      <ShellLayout ongletActif={null} masquerBottomNav>
        <Dialog
          visible={true}
          title="Connexion interrompue"
          onClose={() => retourAccueil(navigation)}
          actions={[{ label: 'Retour Accueil', onPress: () => retourAccueil(navigation) }]}
        >
          <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            {hoteDeconnecte}
          </Text>
        </Dialog>
      </ShellLayout>
    );
  }

  if (!manche || !tournoi) {
    return (
      <ShellLayout ongletActif={null} masquerBottomNav>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[bodyMedium, { color: theme.colors.textSecondary }]}>
            Connexion au serveur de partie en cours...
          </Text>
        </View>
      </ShellLayout>
    );
  }

  function quitter() {
    retournerAuLobbyApresBlocage();
  }

  function retournerAuLobbyApresBlocage() {
    if (tournoi) {
      navigation.replace('Lobby', {
        mode: 'hote',
        nomPartie: `Partie de ${appStorage.getPseudo() ?? 'Joueur'}`,
        joueursExistants: construireJoueursPourLobby(tournoi, infosAffichage),
      });
    } else {
      retourAccueil(navigation);
    }
  }

  if (tournoi.vainqueurId) {
    return <VueFinTournoi tournoi={tournoi} infosAffichage={infosAffichage} onQuitter={quitter} />;
  }

  if (manche.phase === 'bloque') {
    return <VueBloquee raison={manche.raisonBlocage} onRetourLobby={retournerAuLobbyApresBlocage} />;
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

  if (!revele && !estReseau) {
    const joueur = joueurActifId ? infosAffichage.get(joueurActifId) : undefined;
    return <VuePassageAppareil joueur={joueur} onRevele={() => setRevele(true)} />;
  }

  // En réseau, la main affichée est TOUJOURS celle du joueur local (monId). En Hotseat, c'est celle de joueurActifId.
  const idJoueurMain = estReseau ? monId : joueurActifId;
  const monJoueurEtat = manche.joueurs.find((j) => j.id === idJoueurMain);
  const top = carteVisible(manche);
  const cEstMonTour = estReseau ? joueurActifId === monId : true;

  const nombreAPiocher = manche.compteurAttaque > 0 ? manche.compteurAttaque : 1;
  const piocheDisponible = peutPiocher(manche, nombreAPiocher);

  function estJouable(carte: CarteMoteur): boolean {
    if (!cEstMonTour) return false;
    return carteJouable(manche!, carte, configActive);
  }

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <Pressable onPress={() => setConfirmerSortie(true)} hitSlop={12}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 20 }}>✕</Text>
        </Pressable>
        <Text style={[caption, { color: theme.colors.textSecondary }]}>
          Manche {tournoi.mancheCouranteNumero + 1} {estReseau ? '· Réseau LAN' : '· Hotseat'}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {messageEvenement && (
        <Card style={{ backgroundColor: theme.accent[50], marginBottom: theme.spacing.md }}>
          <Text style={[bodyMedium, { color: theme.accent[700], textAlign: 'center' }]}>{messageEvenement}</Text>
        </Card>
      )}

      {/* Liste des joueurs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.md }}
      >
        {joueurs.map((jInitial) => {
          const joueurEtat = manche.joueurs.find((j) => j.id === jInitial.id);
          if (!joueurEtat) return null;

          const infos = infosAffichage.get(jInitial.id);
          const estActif = joueurEtat.id === joueurActifId;
          const estMoi = jInitial.id === monId;

          return (
            <JoueurEntete
              key={jInitial.id}
              joueurEtat={joueurEtat}
              infos={infos}
              estActif={estActif}
              estMoi={estMoi}
            />
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

      {!piocheDisponible && (
        <Card style={{ backgroundColor: theme.colors.warningBg, marginVertical: theme.spacing.sm }}>
          <Text style={[bodyMedium, { color: theme.colors.warning, textAlign: 'center' }]}>
            ⚠️ Plus assez de cartes pour piocher. Joue une carte, ou termine la partie.
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

      {/* Main du joueur local */}
      <Text style={[h2, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
        {estReseau
          ? cEstMonTour
            ? 'À votre tour de jouer !'
            : `Tour de ${infosAffichage.get(joueurActifId ?? '')?.nom ?? '...'}`
          : joueurActifId === monId
            ? 'Votre main'
            : `Main de ${infosAffichage.get(joueurActifId ?? '')?.nom ?? '...'}`}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ overflow: 'visible' }}
        contentContainerStyle={{
          gap: theme.spacing.sm,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.md,
        }}
      >
        {(monJoueurEtat?.main ?? []).map((carte) => {
          const jouable = estJouable(carte);
          return (
            <View key={carte.id} style={{ opacity: jouable ? 1 : 0.35 }}>
              <PlayingCard
                carte={carte}
                taille="md"
                selectionnee={carte.id === selectionId}
                onPress={cEstMonTour && jouable ? () => setSelectionId((actuel) => (actuel === carte.id ? null : carte.id)) : undefined}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <Button
          label="JOUER UNE CARTE"
          onPress={() => {
            if (selectionId) jouerCarte(selectionId);
            setSelectionId(null);
          }}
          disabled={!cEstMonTour || !selectionId}
        />
        <Button label="BANQUE" variant="danger" onPress={partirEnBanque} disabled={!cEstMonTour || !piocheDisponible} />
        {!piocheDisponible && (
          <Button label="TERMINER LA PARTIE" variant="ghost" onPress={() => setConfirmerBlocage(true)} disabled={!cEstMonTour} />
        )}
      </View>

      <Dialog visible={manche.phase === 'choixEnseigneValet' && (manche.joueurEnAttenteChoixEnseigne === monId || !estReseau)} title="Choisis une enseigne">
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
      >
        <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
          Vous allez quitter la manche en cours et retourner au lobby de la partie.
        </Text>
      </Dialog>

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

      <Dialog
        visible={confirmerBlocage}
        title="Terminer la partie ?"
        onClose={() => setConfirmerBlocage(false)}
        actions={[
          {
            label: 'Oui, terminer',
            variant: 'danger',
            onPress: () => {
              terminerPartieBlocage();
              setConfirmerBlocage(false);
            },
          },
          { label: 'Annuler', variant: 'ghost', onPress: () => setConfirmerBlocage(false) },
        ]}
      >
        <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
          Il n'y a plus assez de cartes pour continuer. Vous retournerez au lobby avec les joueurs
          encore en jeu pour recommencer.
        </Text>
      </Dialog>
    </ShellLayout>
  );
}

// Vues annexes
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
  onRetourLobby,
}: {
  raison: string | null;
  onRetourLobby: () => void;
}) {
  const theme = useTheme();
  const h1 = resolveTextStyle(theme, 'h1');
  const body = resolveTextStyle(theme, 'body');

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg }}>
        <Text style={{ fontSize: 56 }}>🚧</Text>
        <Text style={[h1, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
          Plus assez de cartes pour continuer
        </Text>
        <Text style={[body, { color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 280 }]}>
          {raison ?? 'La banque est vide et aucune carte ne peut plus être piochée.'}
        </Text>
        <Button label="Retourner au lobby" onPress={onRetourLobby} />
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
        <Button label="RETOUR AU LOBBY" onPress={onQuitter} />
      </View>
    </ShellLayout>
  );
}

function JoueurEntete({
  joueurEtat,
  infos,
  estActif,
  estMoi,
}: {
  joueurEtat: PlayerState;
  infos?: JoueurAffichage;
  estActif: boolean;
  estMoi: boolean;
}) {
  const theme = useTheme();
  const caption = resolveTextStyle(theme, 'caption');

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (estActif && !joueurEtat.qualifie) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, friction: 5 }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      scale.setValue(1);
      opacity.setValue(joueurEtat.qualifie ? 0.5 : 1);
    }
  }, [estActif, joueurEtat.qualifie, scale, opacity]);

  const nomAffichage = estMoi ? 'Vous' : (infos?.nom ?? '?');

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale }], opacity }}>
      <Avatar nom={nomAffichage} emoji={infos?.emoji} size={44} />
      <Text style={[caption, { color: theme.colors.textSecondary, marginTop: 2, fontWeight: estActif ? 'bold' : 'normal' }]}>
        {nomAffichage} · {joueurEtat.qualifie ? '🏆' : joueurEtat.main.length}
      </Text>
    </Animated.View>
  );
}
