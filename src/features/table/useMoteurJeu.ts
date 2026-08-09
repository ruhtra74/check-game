import { useCallback, useMemo, useState } from 'react';
import {
  appliquerAction,
  appliquerDisqualificationVote,
  creerTournoi,
  creerVote,
  demarrerManche,
  enregistrerVote,
  peutDeclencherVote,
  terminerManche,
  type GameConfig,
  type GameState,
  type JoueurInfo,
  type Suit,
  type TournoiState,
} from '../../engine';

export interface JoueurAffichage extends JoueurInfo {
  emoji?: string;
}

interface OptionsMoteur {
  joueurs: JoueurAffichage[];
  config: GameConfig;
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

/**
 * Pilote le vrai moteur de jeu (`src/engine`) en mode hotseat : un seul
 * appareil, les joueurs se le passent à chaque tour. Aucune notion de
 * réseau ici — c'est exactement ce hook qui devra être remplacé/étendu pour
 * la synchronisation multi-appareils (Phase 4), sans changer l'écran.
 */
export function useMoteurJeu({ joueurs, config }: OptionsMoteur) {
  const infosAffichage = useMemo(() => new Map(joueurs.map((j) => [j.id, j])), [joueurs]);
  const [etatPartie, setEtatPartie] = useState<EtatPartie>(() => creerEtatInitial(joueurs, config));

  const jouerCarte = useCallback((carteId: string) => {
    setEtatPartie((actuel) => {
      const joueurActifId = actuel.manche.ordreJoueursIds[actuel.manche.indexJoueurActif];
      if (!joueurActifId) return actuel;
      try {
        const nouvelleManche = appliquerAction(actuel.manche, {
          type: 'JOUER_CARTE',
          joueurId: joueurActifId,
          carteId,
          timestamp: Date.now(),
        });
        return { ...actuel, manche: nouvelleManche };
      } catch (erreur) {
        console.warn('Coup invalide :', erreur);
        return actuel;
      }
    });
  }, []);

  const partirEnBanque = useCallback(() => {
    setEtatPartie((actuel) => {
      const joueurActifId = actuel.manche.ordreJoueursIds[actuel.manche.indexJoueurActif];
      if (!joueurActifId) return actuel;
      try {
        const nouvelleManche = appliquerAction(actuel.manche, {
          type: 'PARTIR_EN_BANQUE',
          joueurId: joueurActifId,
          timestamp: Date.now(),
        });
        return { ...actuel, manche: nouvelleManche };
      } catch (erreur) {
        console.warn('Action invalide :', erreur);
        return actuel;
      }
    });
  }, []);

  const choisirEnseigne = useCallback((enseigne: Suit) => {
    setEtatPartie((actuel) => {
      if (!actuel.manche.joueurEnAttenteChoixEnseigne) return actuel;
      try {
        const nouvelleManche = appliquerAction(actuel.manche, {
          type: 'CHOISIR_ENSEIGNE',
          joueurId: actuel.manche.joueurEnAttenteChoixEnseigne,
          enseigne,
          timestamp: Date.now(),
        });
        return { ...actuel, manche: nouvelleManche };
      } catch (erreur) {
        console.warn('Choix invalide :', erreur);
        return actuel;
      }
    });
  }, []);

  /**
   * Le joueur actif décide explicitement de terminer la partie parce que la
   * banque est vide et qu'aucune pioche n'est plus possible. Tant que cette
   * fonction n'est pas appelée, la partie continue normalement (le joueur
   * peut toujours déposer une carte valide).
   */
  const terminerPartieBlocage = useCallback(() => {
    setEtatPartie((actuel) => {
      const joueurActifId = actuel.manche.ordreJoueursIds[actuel.manche.indexJoueurActif];
      if (!joueurActifId) return actuel;
      try {
        const nouvelleManche = appliquerAction(actuel.manche, {
          type: 'TERMINER_PARTIE_BLOCAGE',
          joueurId: joueurActifId,
          timestamp: Date.now(),
        });
        return { ...actuel, manche: nouvelleManche };
      } catch (erreur) {
        console.warn('Impossible de terminer la partie ici :', erreur);
        return actuel;
      }
    });
  }, []);

  /**
   * Termine la manche en cours immédiatement, sans attendre la fin
   * naturelle. Sur un seul appareil, il n'y a physiquement qu'un "vote"
   * possible — celui de la personne qui tient le téléphone à cet instant.
   * En réseau réel (Phase 4), ceci deviendra un vrai vote par joueur, voir
   * `engine/voteDisqualification.ts` (règle : unanimité des qualifiés).
   */
  const terminerMancheParVote = useCallback(() => {
    setEtatPartie((actuel) => {
      if (!peutDeclencherVote(actuel.manche)) return actuel;
      try {
        const voteInitial = creerVote(actuel.manche);
        const voteUnanime = voteInitial.eligibles.reduce((v, id) => enregistrerVote(v, id), voteInitial);
        const nouvelleManche = appliquerDisqualificationVote(actuel.manche, voteUnanime, Date.now());
        return { ...actuel, manche: nouvelleManche };
      } catch (erreur) {
        console.warn('Vote impossible :', erreur);
        return actuel;
      }
    });
  }, []);

  const continuerVersProchaineManche = useCallback(() => {
    setEtatPartie((actuel) => {
      if (actuel.manche.phase !== 'mancheTerminee') return actuel;
      const nouveauTournoi = terminerManche(actuel.tournoi, actuel.manche);
      if (nouveauTournoi.vainqueurId || nouveauTournoi.joueursActifs.length < 2) {
        // Tournoi terminé : on garde la dernière manche jouée pour référence,
        // l'écran affichera le classement final à partir de `tournoi`.
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
  };
}