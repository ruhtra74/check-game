import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '../../engine';
import { NetworkManager } from '../../network/NetworkManager';
import type { JoueurAffichage } from './useMoteurJeu';

interface OptionsMoteur {
  joueurs: JoueurAffichage[];
  config: GameConfig;
  modeReseau: 'hote' | 'invite';
}

interface EtatPartie {
  tournoi: TournoiState;
  manche: GameState;
}

function choisirDemarreurAleatoire(joueurs: JoueurInfo[]): string {
  const index = Math.floor(Math.random() * joueurs.length);
  return (joueurs[index] as JoueurInfo).id;
}

/**
 * Hook réseau du moteur de jeu. Même interface de retour que useMoteurJeu.
 *
 * - **Hôte** : Exécute le moteur localement (source de vérité). Écoute les
 *   GAME_ACTION reçues par les clients, les applique, et diffuse le nouvel
 *   état via GAME_STATE à tous les clients.
 * - **Client** : Ne possède pas le moteur. Envoie ses intentions d'action
 *   à l'hôte et se contente de rendre le GameState reçu en retour.
 */
export function useMoteurJeuReseau({ joueurs, config, modeReseau }: OptionsMoteur) {
  const infosAffichage = useMemo(() => new Map(joueurs.map((j) => [j.id, j])), [joueurs]);

  // L'hôte crée l'état initial du moteur et le diffuse.
  // Le client attend le premier GAME_STATE de l'hôte.
  const [etatPartie, setEtatPartie] = useState<EtatPartie | null>(() => {
    if (modeReseau === 'hote') {
      const joueursInfo: JoueurInfo[] = joueurs.map(({ id, nom }) => ({ id, nom }));
      const tournoi = creerTournoi(joueursInfo);
      const manche = demarrerManche(
        tournoi,
        config,
        choisirDemarreurAleatoire(joueursInfo),
        config.sensRotationParDefaut
      );
      return { tournoi, manche };
    }
    return null; // Le client attend
  });

  // -----------------------------------------------------------------------
  // Diffusion de l'état de jeu aux clients (côté hôte uniquement)
  // -----------------------------------------------------------------------
  const broadcastGameState = useCallback((etat: EtatPartie) => {
    NetworkManager.server?.broadcast({
      type: 'GAME_STATE',
      payload: { manche: etat.manche, tournoi: etat.tournoi },
    });
  }, []);

  // Diffuser l'état initial dès le montage (hôte)
  useEffect(() => {
    if (modeReseau === 'hote' && etatPartie) {
      broadcastGameState(etatPartie);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Côté HÔTE : écouter les GAME_ACTION des clients
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (modeReseau !== 'hote') return;
    const server = NetworkManager.server;
    if (!server) return;

    server.setCallbacks(
      (clientId, msg) => {
        if (msg.type === 'GAME_ACTION') {
          const action: GameAction = msg.payload;
          setEtatPartie((actuel) => {
            if (!actuel) return actuel;
            try {
              const nouvelleManche = appliquerAction(actuel.manche, action);
              const nouveauEtat = { ...actuel, manche: nouvelleManche };
              broadcastGameState(nouveauEtat);
              return nouveauEtat;
            } catch (erreur) {
              console.warn(`Action réseau invalide de ${clientId} :`, erreur);
              // Renvoyer l'état actuel pour resynchroniser le client fautif
              server.sendTo(clientId, {
                type: 'GAME_STATE',
                payload: { manche: actuel.manche, tournoi: actuel.tournoi },
              });
              return actuel;
            }
          });
        }
      },
      (clientId) => {
        console.warn(`Joueur ${clientId} déconnecté en cours de partie.`);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Côté CLIENT : recevoir les GAME_STATE de l'hôte
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (modeReseau !== 'invite') return;
    const client = NetworkManager.client;
    if (!client) return;

    client.setCallbacks(
      (msg) => {
        if (msg.type === 'GAME_STATE') {
          setEtatPartie({
            manche: msg.payload.manche,
            tournoi: msg.payload.tournoi,
          });
        }
      },
      () => { console.warn('Hôte déconnecté en cours de partie.'); },
      (err) => { console.warn('Erreur réseau en cours de partie :', err); }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Actions : l'hôte les exécute localement, le client les envoie au réseau
  // -----------------------------------------------------------------------

  const envoyerOuAppliquer = useCallback(
    (action: GameAction) => {
      if (modeReseau === 'hote') {
        setEtatPartie((actuel) => {
          if (!actuel) return actuel;
          try {
            const nouvelleManche = appliquerAction(actuel.manche, action);
            const nouveauEtat = { ...actuel, manche: nouvelleManche };
            broadcastGameState(nouveauEtat);
            return nouveauEtat;
          } catch (erreur) {
            console.warn('Action locale invalide :', erreur);
            return actuel;
          }
        });
      } else {
        NetworkManager.client?.send({ type: 'GAME_ACTION', payload: action });
      }
    },
    [modeReseau, broadcastGameState]
  );

  const jouerCarte = useCallback(
    (carteId: string) => {
      const joueurId = etatPartie?.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif];
      if (!joueurId) return;
      envoyerOuAppliquer({
        type: 'JOUER_CARTE',
        joueurId,
        carteId,
        timestamp: Date.now(),
      });
    },
    [etatPartie, envoyerOuAppliquer]
  );

  const partirEnBanque = useCallback(() => {
    const joueurId = etatPartie?.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif];
    if (!joueurId) return;
    envoyerOuAppliquer({
      type: 'PARTIR_EN_BANQUE',
      joueurId,
      timestamp: Date.now(),
    });
  }, [etatPartie, envoyerOuAppliquer]);

  const choisirEnseigne = useCallback(
    (enseigne: Suit) => {
      const joueurId = etatPartie?.manche.joueurEnAttenteChoixEnseigne;
      if (!joueurId) return;
      envoyerOuAppliquer({
        type: 'CHOISIR_ENSEIGNE',
        joueurId,
        enseigne,
        timestamp: Date.now(),
      });
    },
    [etatPartie, envoyerOuAppliquer]
  );

  const terminerPartieBlocage = useCallback(() => {
    const joueurId = etatPartie?.manche.ordreJoueursIds[etatPartie.manche.indexJoueurActif];
    if (!joueurId) return;
    envoyerOuAppliquer({
      type: 'TERMINER_PARTIE_BLOCAGE',
      joueurId,
      timestamp: Date.now(),
    });
  }, [etatPartie, envoyerOuAppliquer]);

  const terminerMancheParVote = useCallback(() => {
    if (modeReseau !== 'hote') return; // Seul l'hôte peut le faire pour l'instant
    setEtatPartie((actuel) => {
      if (!actuel || !peutDeclencherVote(actuel.manche)) return actuel;
      try {
        const voteInitial = creerVote(actuel.manche);
        const voteUnanime = voteInitial.eligibles.reduce((v, id) => enregistrerVote(v, id), voteInitial);
        const nouvelleManche = appliquerDisqualificationVote(actuel.manche, voteUnanime, Date.now());
        const nouveauEtat = { ...actuel, manche: nouvelleManche };
        broadcastGameState(nouveauEtat);
        return nouveauEtat;
      } catch (erreur) {
        console.warn('Vote impossible :', erreur);
        return actuel;
      }
    });
  }, [modeReseau, broadcastGameState]);

  const continuerVersProchaineManche = useCallback(() => {
    if (modeReseau !== 'hote') return; // Seul l'hôte gère la transition
    setEtatPartie((actuel) => {
      if (!actuel || actuel.manche.phase !== 'mancheTerminee') return actuel;
      const nouveauTournoi = terminerManche(actuel.tournoi, actuel.manche);
      if (nouveauTournoi.vainqueurId || nouveauTournoi.joueursActifs.length < 2) {
        const nouveauEtat = { tournoi: nouveauTournoi, manche: actuel.manche };
        broadcastGameState(nouveauEtat);
        return nouveauEtat;
      }
      const nouvelleManche = demarrerManche(
        nouveauTournoi,
        config,
        choisirDemarreurAleatoire(nouveauTournoi.joueursActifs),
        config.sensRotationParDefaut
      );
      const nouveauEtat = { tournoi: nouveauTournoi, manche: nouvelleManche };
      broadcastGameState(nouveauEtat);
      return nouveauEtat;
    });
  }, [config, modeReseau, broadcastGameState]);

  // -----------------------------------------------------------------------
  // Valeurs de sortie (même interface que useMoteurJeu)
  // -----------------------------------------------------------------------

  // Fallback : si le client n'a pas encore reçu l'état initial, on crée
  // un état vide minimal pour éviter les crashes. L'UI affichera un loader.
  const mancheParDefaut: GameState = {
    config,
    joueurs: [],
    ordreJoueursIds: [],
    indexJoueurActif: 0,
    sensRotation: config.sensRotationParDefaut,
    pileCentrale: [],
    banque: [],
    compteurAttaque: 0,
    enseigneCommandee: null,
    joueurEnAttenteChoixEnseigne: null,
    phase: 'enCours',
    raisonBlocage: null,
    perdantId: null,
    joueursEliminesParVote: null,
    debutMancheTimestamp: Date.now(),
    finMancheTimestamp: null,
    evenements: [],
  };

  const tournoiParDefaut: TournoiState = {
    joueursActifs: joueurs.map(({ id, nom }) => ({ id, nom })),
    joueursElimines: [],
    mancheCouranteNumero: 0,
    vainqueurId: null,
  };

  const manche = etatPartie?.manche ?? mancheParDefaut;
  const tournoi = etatPartie?.tournoi ?? tournoiParDefaut;
  const joueurActifId = manche.ordreJoueursIds[manche.indexJoueurActif] ?? null;

  return {
    tournoi,
    manche,
    config,
    joueurActifId,
    infosAffichage,
    jouerCarte,
    partirEnBanque,
    choisirEnseigne,
    terminerPartieBlocage,
    terminerMancheParVote,
    continuerVersProchaineManche,
  };
}
