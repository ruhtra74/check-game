import type { GameState, VoteDisqualificationState } from './types';

/**
 * Le vote n'est proposable que lorsqu'il reste exactement 2 ou 3 joueurs
 * encore en possession de cartes (non qualifiés) dans la manche en cours
 * (addendum section G.1).
 */
export function peutDeclencherVote(state: GameState): boolean {
  if (state.phase !== 'enCours' && state.phase !== 'choixEnseigneValet') return false;
  const enJeu = state.joueurs.filter((j) => !j.qualifie).length;
  return enJeu === 2 || enJeu === 3;
}

/**
 * Crée un nouveau vote. Seuls les joueurs déjà qualifiés dans la manche en
 * cours sont éligibles à voter (addendum G.1).
 */
export function creerVote(state: GameState): VoteDisqualificationState {
  if (!peutDeclencherVote(state)) {
    throw new Error('Le vote de disqualification ne peut pas être déclenché dans ce contexte.');
  }
  const eligibles = state.joueurs.filter((j) => j.qualifie).map((j) => j.id);
  if (eligibles.length === 0) {
    throw new Error('Aucun joueur qualifié éligible pour voter.');
  }
  return { eligibles, votes: new Set() };
}

/**
 * Enregistre le vote (favorable) d'un joueur éligible. Ne mute pas l'état
 * d'entrée.
 */
export function enregistrerVote(
  vote: VoteDisqualificationState,
  joueurId: string
): VoteDisqualificationState {
  if (!vote.eligibles.includes(joueurId)) {
    throw new Error(`Le joueur ${joueurId} n'est pas éligible à ce vote.`);
  }
  const votes = new Set(vote.votes);
  votes.add(joueurId);
  return { ...vote, votes };
}

/**
 * Le vote passe uniquement à l'UNANIMITÉ des joueurs éligibles (décision
 * utilisateur : pas de majorité simple).
 */
export function voteEstUnanime(vote: VoteDisqualificationState): boolean {
  return vote.eligibles.length > 0 && vote.eligibles.every((id) => vote.votes.has(id));
}

/**
 * Applique le résultat d'un vote unanime : termine la manche immédiatement,
 * en marquant tous les joueurs encore en jeu comme éliminés simultanément du
 * tournoi (addendum G.2/G.3 — exception assumée à la règle "un seul éliminé
 * par manche").
 */
export function appliquerDisqualificationVote(
  state: GameState,
  vote: VoteDisqualificationState,
  timestamp: number
): GameState {
  if (!voteEstUnanime(vote)) {
    throw new Error("Le vote n'est pas unanime : la disqualification accélérée ne peut pas être appliquée.");
  }
  if (!peutDeclencherVote(state)) {
    throw new Error('Le contexte ne permet plus la disqualification accélérée.');
  }

  const joueursEliminesParVote = state.joueurs.filter((j) => !j.qualifie).map((j) => j.id);

  return {
    ...state,
    phase: 'mancheTerminee',
    perdantId: null,
    joueursEliminesParVote,
    finMancheTimestamp: timestamp,
    evenements: [
      ...state.evenements,
      {
        type: 'MANCHE_TERMINEE',
        detail: { parVoteUnanime: true, joueursEliminesParVote },
        timestamp,
      },
    ],
  };
}