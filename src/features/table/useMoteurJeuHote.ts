import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appliquerAction,
  appliquerDisqualificationVote,
  creerTournoi,
  creerVote,
  demarrerManche,
  enregistrerVote,
  peutDeclencherVote,
  terminerManche,
  type GameAction,
  type GameConfig,
  type GameState,
  type JoueurInfo,
  type Suit,
  type TournoiState,
  type VoteDisqualificationState,
} from '../../engine';
import { ServeurTCP } from '../../network/server';
import { PORT_PAR_DEFAUT } from '../../network/protocol';
import type { JoueurAffichage } from './useMoteurJeu';

interface OptionsMoteurHote {
  joueurs: JoueurAffichage[];
  config: GameConfig;
  port?: number;
}

interface EtatPartie {
  tournoi: TournoiState;
  manche: GameState;
}

function choisirDemarreurAleatoire(joueurs: JoueurInfo[]): string {
  const index = Math.floor(Math.random() * joueurs.length);
  return (joueurs[index] as JoueurInfo).id;
}

function creerEtatInitial(joueurs: JoueurAffichage[], config: GameConfig): EtatPartie {
  const joueursInfo: JoueurInfo[] = joueurs.map(({ id, nom }) => ({ id, nom }));
  const tournoi = creerTournoi(joueursInfo);
  const manche = demarrerManche(tournoi, config, choisirDemarreurAleatoire(joueursInfo), config.sensRotationParDefaut);
  return { tournoi, manche };
}

export function useMoteurJeuHote({ joueurs, config, port = PORT_PAR_DEFAUT }: OptionsMoteurHote) {
  const infosAffichage = useMemo(() => new Map(joueurs.map((j) => [j.id, j])), [joueurs]);
  const [etatPartie, setEtatPartie] = useState<EtatPartie>(() => creerEtatInitial(joueurs, config));
  const [voteActif, setVoteActif] = useState<VoteDisqualificationState | null>(null);

  const serveurRef = useRef<ServeurTCP | null>(null);

  const etatPartieRef = useRef(etatPartie);
  etatPartieRef.current = etatPartie;

  const configRef = useRef(config);
  configRef.current = config;

  // Broadcast du GAME_STATE à chaque modification de manche ou tournoi
  useEffect(() => {
    if (serveurRef.current) {
      serveurRef.current.broadcast({
        type: 'GAME_STATE',
        manche: etatPartie.manche,
        tournoi: etatPartie.tournoi,
        config,
      });
    }
  }, [etatPartie, config]);

  const executerAction = useCallback((action: GameAction) => {
    setEtatPartie((actuel) => {
      try {
        const nouvelleManche = appliquerAction(actuel.manche, action);
        return { ...actuel, manche: nouvelleManche };
      } catch (err) {
        console.warn('Action réseau invalide reçue par l’hôte:', err, action);
        return actuel;
      }
    });
  }, []);

  const traiterVoteIncite = useCallback((voterId: string) => {
    setEtatPartie((actuel) => {
      if (!peutDeclencherVote(actuel.manche)) return actuel;
      setVoteActif((prevVote) => {
        const vote = prevVote ?? creerVote(actuel.manche);
        const voteAjour = enregistrerVote(vote, voterId);
        // Si tous les éligibles ont voté, on applique la disqualification
        const tousVotes = voteAjour.eligibles.every((id) => voteAjour.votes[id]);
        if (tousVotes) {
          try {
            const nouvelleManche = appliquerDisqualificationVote(actuel.manche, voteAjour, Date.now());
            setEtatPartie((prev) => ({ ...prev, manche: nouvelleManche }));
          } catch (err) {
            console.warn('Erreur application vote disqualification:', err);
          }
          return null;
        }
        return voteAjour;
      });
      return actuel;
    });
  }, []);

  // Initialisation du serveur TCP pour le jeu
  useEffect(() => {
    const serveur = new ServeurTCP({
      port,
      onClientConnecte: (clientId) => {
        console.log(`Nouveau client connecté au serveur de jeu: ${clientId}`);
        // Envoyer immédiatement l'état initial du jeu au client qui vient de se connecter
        serveur.envoyerA(clientId, {
          type: 'GAME_STATE',
          manche: etatPartieRef.current.manche,
          tournoi: etatPartieRef.current.tournoi,
          config: configRef.current,
        });
      },
      onClientDeconnecte: (clientId) => {
        console.log(`Joueur réseau déconnecté pendant la partie : ${clientId}`);
      },
      onMessage: (_clientId, message) => {
        if (message.type === 'GAME_ACTION') {
          executerAction(message.action);
        } else if (message.type === 'DISQUALIFICATION_VOTE') {
          traiterVoteIncite(message.voterId);
        }
      },
    });

    serveurRef.current = serveur;
    serveur.demarrer().catch((err) => {
      console.error('Erreur démarrage serveur TCP jeu:', err);
    });

    return () => {
      serveur.arreter();
      serveurRef.current = null;
    };
  }, [port, executerAction, traiterVoteIncite]);

  const jouerCarte = useCallback(
    (carteId: string) => {
      const joueurActifId = etatPartie.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif];
      if (!joueurActifId) return;
      executerAction({
        type: 'JOUER_CARTE',
        joueurId: joueurActifId,
        carteId,
        timestamp: Date.now(),
      });
    },
    [etatPartie.manche, executerAction]
  );

  const partirEnBanque = useCallback(() => {
    const joueurActifId = etatPartie.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif];
    if (!joueurActifId) return;
    executerAction({
      type: 'PARTIR_EN_BANQUE',
      joueurId: joueurActifId,
      timestamp: Date.now(),
    });
  }, [etatPartie.manche, executerAction]);

  const choisirEnseigne = useCallback(
    (enseigne: Suit) => {
      const jEnAttente = etatPartie.manche.joueurEnAttenteChoixEnseigne;
      if (!jEnAttente) return;
      executerAction({
        type: 'CHOISIR_ENSEIGNE',
        joueurId: jEnAttente,
        enseigne,
        timestamp: Date.now(),
      });
    },
    [etatPartie.manche, executerAction]
  );

  const terminerPartieBlocage = useCallback(() => {
    const joueurActifId = etatPartie.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif];
    if (!joueurActifId) return;
    executerAction({
      type: 'TERMINER_PARTIE_BLOCAGE',
      joueurId: joueurActifId,
      timestamp: Date.now(),
    });
  }, [etatPartie.manche, executerAction]);

  const terminerMancheParVote = useCallback(() => {
    const joueurActifId = etatPartie.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif];
    if (!joueurActifId) return;
    traiterVoteIncite(joueurActifId);
  }, [etatPartie.manche, traiterVoteIncite]);

  const continuerVersProchaineManche = useCallback(() => {
    setEtatPartie((actuel) => {
      if (actuel.manche.phase !== 'mancheTerminee') return actuel;
      const nouveauTournoi = terminerManche(actuel.tournoi, actuel.manche);
      if (nouveauTournoi.vainqueurId || nouveauTournoi.joueursActifs.length < 2) {
        return { tournoi: nouveauTournoi, manche: actuel.manche };
      }
      const nouvelleManche = demarrerManche(
        nouveauTournoi,
        config,
        choisirDemarreurAleatoire(nouveauTournoi.joueursActifs),
        config.sensRotationParDefaut
      );
      return { tournoi: nouveauTournoi, manche: nouvelleManche };
    });
  }, [config]);

  const joueurActifId = etatPartie.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif] ?? null;

  return {
    tournoi: etatPartie.tournoi,
    manche: etatPartie.manche,
    config,
    joueurActifId,
    infosAffichage,
    jouerCarte,
    partirEnBanque,
    choisirEnseigne,
    terminerPartieBlocage,
    terminerMancheParVote,
    continuerVersProchaineManche,
    voteActif,
  };
}
