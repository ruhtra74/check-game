import { initManche } from './state';
import type {
  ClassementEntree,
  GameConfig,
  GameState,
  JoueurInfo,
  ResultatManche,
  RotationSens,
  TournoiState,
} from './types';

export function creerTournoi(joueurs: JoueurInfo[]): TournoiState {
  if (joueurs.length < 2) {
    throw new Error('Un tournoi nécessite au moins 2 joueurs.');
  }
  return {
    joueursActifs: [...joueurs],
    joueursElimines: [],
    manches: [],
    mancheCouranteNumero: 0,
    vainqueurId: null,
  };
}

export function tournoiEstTermine(tournoi: TournoiState): boolean {
  return tournoi.vainqueurId !== null;
}

export function estFinale(tournoi: TournoiState): boolean {
  return tournoi.joueursActifs.length === 2;
}

/**
 * Démarre une nouvelle manche entre les joueurs encore actifs dans le
 * tournoi. `config` fournit les paramètres de jeu (nbJoueurs est recalculé
 * automatiquement à partir du nombre de joueurs actifs restants).
 */
export function demarrerManche(
  tournoi: TournoiState,
  config: GameConfig,
  premierJoueurId: string,
  sensRotation: RotationSens,
  maintenant?: number
): GameState {
  if (tournoiEstTermine(tournoi)) {
    throw new Error('Le tournoi est déjà terminé.');
  }
  if (tournoi.joueursActifs.length < 2) {
    throw new Error('Il faut au moins 2 joueurs actifs pour démarrer une manche.');
  }

  return initManche({
    joueurs: tournoi.joueursActifs,
    config: { ...config, nbJoueurs: tournoi.joueursActifs.length },
    premierJoueurId,
    sensRotation,
    maintenant,
  });
}

/**
 * Clôture une manche terminée (phase 'mancheTerminee') et met à jour l'état
 * du tournoi : élimination du/des joueur(s) concerné(s), et détection du
 * vainqueur si un seul joueur actif reste.
 *
 * Gère les deux cas de fin de manche :
 *  - fin naturelle (spec 5.3) -> gameState.perdantId est défini
 *  - disqualification accélérée par vote unanime (addendum G) ->
 *    gameState.joueursEliminesParVote est défini (2 ou 3 joueurs éliminés
 *    d'un coup, cas explicitement accepté comme exception à la règle
 *    générale "un seul éliminé par manche")
 */
export function terminerManche(tournoi: TournoiState, gameState: GameState): TournoiState {
  if (gameState.phase !== 'mancheTerminee') {
    throw new Error("La manche fournie n'est pas terminée (phase !== 'mancheTerminee').");
  }

  const numeroManche = tournoi.mancheCouranteNumero + 1;

  const classement: ClassementEntree[] = gameState.joueurs
    .filter((j) => j.qualifie && j.tempsQualificationMs !== undefined)
    .sort((a, b) => (a.tempsQualificationMs as number) - (b.tempsQualificationMs as number))
    .map((j) => ({ joueurId: j.id, tempsQualificationMs: j.tempsQualificationMs as number }));

  const resultat: ResultatManche = {
    numeroManche,
    classement,
    perdantId: gameState.perdantId,
    joueursEliminesParVote: gameState.joueursEliminesParVote,
  };

  const idsElimines: string[] = gameState.perdantId
    ? [gameState.perdantId]
    : gameState.joueursEliminesParVote ?? [];

  if (idsElimines.length === 0) {
    throw new Error("Manche terminée sans perdant ni disqualification identifiable — état incohérent.");
  }

  const joueursActifs = tournoi.joueursActifs.filter((j) => !idsElimines.includes(j.id));
  const nouveauxElimines = tournoi.joueursActifs
    .filter((j) => idsElimines.includes(j.id))
    .map((joueur) => ({ joueur, numeroManche }));

  const vainqueurId = joueursActifs.length === 1 ? (joueursActifs[0] as JoueurInfo).id : null;

  return {
    joueursActifs,
    joueursElimines: [...tournoi.joueursElimines, ...nouveauxElimines],
    manches: [...tournoi.manches, resultat],
    mancheCouranteNumero: numeroManche,
    vainqueurId,
  };
}