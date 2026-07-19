import { estAs, estDeux, estJoker, estSept, estValet } from './deck';
import { piocherCartes } from './pioche';
import { carteJouable, carteVisible, valeurAttaque } from './rules';
import type { Card, GameAction, GameEvent, GameState, PlayerState } from './types';

function joueurActifId(state: GameState): string {
  const id = state.ordreJoueursIds[state.indexJoueurActif];
  if (!id) throw new Error('État invalide : aucun joueur actif à cet index.');
  return id;
}

function estQualifie(state: GameState, joueurId: string): boolean {
  return state.joueurs.find((j) => j.id === joueurId)?.qualifie ?? false;
}

/**
 * Avance l'index actif de `sauts` positions valides (en ignorant les joueurs
 * déjà qualifiés), en bouclant sur `ordreJoueursIds`.
 *
 * C'est cette fonction générique qui implémente naturellement :
 *  - le passage de tour normal (sauts = 1)
 *  - l'effet "As Stop" qui saute le joueur suivant (sauts = 2) — et qui, à 2
 *    joueurs seulement, ramène mécaniquement la main au même joueur puisqu'il
 *    n'y a alors qu'un seul autre joueur valide à sauter (spec 4.3).
 */
function avancerIndex(state: GameState, depuisIndex: number, sauts: number): number {
  const n = state.ordreJoueursIds.length;
  let idx = depuisIndex;
  let restant = sauts;
  let garde = 0;
  while (restant > 0) {
    idx = (idx + 1) % n;
    garde += 1;
    if (garde > n * 4 + 10) {
      throw new Error('avancerIndex : boucle infinie détectée (aucun joueur non qualifié trouvé).');
    }
    const id = state.ordreJoueursIds[idx] as string;
    if (!estQualifie(state, id)) {
      restant -= 1;
    }
  }
  return idx;
}

function remplacerJoueur(joueurs: PlayerState[], id: string, patch: Partial<PlayerState>): PlayerState[] {
  return joueurs.map((j) => (j.id === id ? { ...j, ...patch } : j));
}

function ajouterEvenement(evenements: GameEvent[], evenement: GameEvent): GameEvent[] {
  return [...evenements, evenement];
}

/**
 * Vérifie la condition d'arrêt de la manche (spec 5.3) : il ne reste plus
 * qu'un seul joueur non qualifié. Si c'est le cas, retourne le nouvel état
 * "mancheTerminee" ; sinon retourne null (la manche continue).
 */
function verifierFinDeManche(state: GameState, timestamp: number): GameState | null {
  const nonQualifies = state.joueurs.filter((j) => !j.qualifie);
  if (nonQualifies.length > 1) return null;
  // nonQualifies.length === 0 ne devrait jamais survenir en jeu normal (un
  // seul joueur joue par action, donc on passe forcément par length === 1
  // avant), mais on le gère par défense plutôt que de planter.
  const perdant: PlayerState | undefined = nonQualifies[0];
  return {
    ...state,
    phase: 'mancheTerminee',
    perdantId: perdant?.id ?? null,
    joueursEliminesParVote: null,
    finMancheTimestamp: timestamp,
    evenements: ajouterEvenement(state.evenements, {
      type: 'MANCHE_TERMINEE',
      joueurId: perdant?.id,
      timestamp,
    }),
  };
}

function retirerCarteDeLaMain(joueur: PlayerState, carteId: string): { carte: Card; nouvelleMain: Card[] } {
  const index = joueur.main.findIndex((c) => c.id === carteId);
  if (index === -1) {
    throw new Error(`La carte ${carteId} n'est pas dans la main du joueur ${joueur.id}.`);
  }
  const carte = joueur.main[index] as Card;
  const nouvelleMain = [...joueur.main.slice(0, index), ...joueur.main.slice(index + 1)];
  return { carte, nouvelleMain };
}

function traiterJouerCarte(
  state: GameState,
  joueurId: string,
  carteId: string,
  timestamp: number
): GameState {
  if (state.phase !== 'enCours') {
    throw new Error(`Impossible de jouer une carte : phase actuelle = ${state.phase}.`);
  }
  if (joueurId !== joueurActifId(state)) {
    throw new Error(`Ce n'est pas le tour du joueur ${joueurId}.`);
  }

  const joueur = state.joueurs.find((j) => j.id === joueurId);
  if (!joueur) throw new Error(`Joueur ${joueurId} introuvable.`);

  const { carte, nouvelleMain } = retirerCarteDeLaMain(joueur, carteId);

  if (!carteJouable(state, carte, state.config)) {
    throw new Error(`La carte ${carteId} n'est pas jouable dans le contexte actuel.`);
  }

  // Placement de la carte : le 2 va sous la pile, tout le reste va au sommet.
  const nouvellePileCentrale = estDeux(carte)
    ? [carte, ...state.pileCentrale]
    : [...state.pileCentrale, carte];

  const finMain = nouvelleMain.length;
  let evenements = state.evenements;
  let joueurs = remplacerJoueur(state.joueurs, joueurId, { main: nouvelleMain });

  if (finMain === 0) {
    const tempsQualificationMs = timestamp - state.debutMancheTimestamp;
    joueurs = remplacerJoueur(joueurs, joueurId, { qualifie: true, tempsQualificationMs });
    evenements = ajouterEvenement(evenements, { type: 'GAMES', joueurId, timestamp });
  } else if (finMain === 1) {
    evenements = ajouterEvenement(evenements, { type: 'CHECK', joueurId, timestamp });
  }

  let compteurAttaque = state.compteurAttaque;
  if (estSept(carte) || estJoker(carte)) {
    compteurAttaque += valeurAttaque(carte, state.config);
    evenements = ajouterEvenement(evenements, {
      type: 'ATTAQUE_LANCEE',
      joueurId,
      detail: { compteurAttaque },
      timestamp,
    });
  }

  if (estAs(carte)) {
    evenements = ajouterEvenement(evenements, { type: 'AS_JOUE', joueurId, timestamp });
  }
  if (estValet(carte)) {
    evenements = ajouterEvenement(evenements, { type: 'VALET_JOUE', joueurId, timestamp });
  }

  let etatIntermediaire: GameState = {
    ...state,
    joueurs,
    pileCentrale: nouvellePileCentrale,
    compteurAttaque,
    evenements,
    // Un 2 ne change jamais la carte visible ni la commande en cours ; les
    // autres cartes remplacent la carte visible, donc toute commande de
    // Valet précédente cesse de s'appliquer à moins que ce soit un nouveau
    // Valet qui vient justement d'en émettre une nouvelle (traité plus bas).
    enseigneCommandee: estDeux(carte) ? state.enseigneCommandee : null,
  };

  // Condition d'arrêt de la manche (5.3) : prioritaire sur tout le reste,
  // y compris un Valet qui attendrait normalement un choix d'enseigne.
  const finManche = verifierFinDeManche(etatIntermediaire, timestamp);
  if (finManche) return finManche;

  if (estValet(carte)) {
    // Le flux est suspendu : le joueur actif doit choisir une enseigne
    // avant que le tour ne passe réellement au joueur suivant (spec 4.2).
    return {
      ...etatIntermediaire,
      phase: 'choixEnseigneValet',
      joueurEnAttenteChoixEnseigne: joueurId,
    };
  }

  const sauts = estAs(carte) ? 2 : 1;
  const indexJoueurActif = avancerIndex(etatIntermediaire, state.indexJoueurActif, sauts);
  return { ...etatIntermediaire, indexJoueurActif };
}

function traiterChoisirEnseigne(
  state: GameState,
  joueurId: string,
  enseigne: import('./types').Suit,
  timestamp: number
): GameState {
  if (state.phase !== 'choixEnseigneValet') {
    throw new Error(`Aucun choix d'enseigne attendu (phase actuelle = ${state.phase}).`);
  }
  if (joueurId !== state.joueurEnAttenteChoixEnseigne) {
    throw new Error(`Le joueur ${joueurId} n'est pas celui qui doit choisir l'enseigne.`);
  }

  const indexJoueurActif = avancerIndex(state, state.indexJoueurActif, 1);

  return {
    ...state,
    enseigneCommandee: enseigne,
    joueurEnAttenteChoixEnseigne: null,
    phase: 'enCours',
    indexJoueurActif,
  };
}

function traiterPartirEnBanque(state: GameState, joueurId: string, timestamp: number): GameState {
  if (state.phase !== 'enCours') {
    throw new Error(`Impossible de partir en banque : phase actuelle = ${state.phase}.`);
  }
  if (joueurId !== joueurActifId(state)) {
    throw new Error(`Ce n'est pas le tour du joueur ${joueurId}.`);
  }

  const enAttaque = state.compteurAttaque > 0;
  const nombreAPiocher = enAttaque ? state.compteurAttaque : 1;

  const resultat = piocherCartes(state, nombreAPiocher);
  if (resultat.bloque) {
    return {
      ...state,
      phase: 'bloque',
      raisonBlocage: resultat.raison,
      evenements: ajouterEvenement(state.evenements, {
        type: 'BLOQUE',
        joueurId,
        detail: { raison: resultat.raison },
        timestamp,
      }),
    };
  }

  const joueur = state.joueurs.find((j) => j.id === joueurId);
  if (!joueur) throw new Error(`Joueur ${joueurId} introuvable.`);

  const joueurs = remplacerJoueur(state.joueurs, joueurId, {
    main: [...joueur.main, ...resultat.cartes],
  });

  if (enAttaque) {
    // Section 4.C : encaissement de la pénalité. Le tour NE se termine PAS :
    // le joueur reste actif et doit maintenant jouer normalement.
    return {
      ...state,
      joueurs,
      banque: resultat.banque,
      pileCentrale: resultat.pileCentrale,
      compteurAttaque: 0,
      evenements: ajouterEvenement(state.evenements, {
        type: 'ATTAQUE_ENCAISSEE',
        joueurId,
        detail: { cartesPiochees: resultat.cartes.length },
        timestamp,
      }),
      // indexJoueurActif inchangé : le même joueur continue son tour.
    };
  }

  // Pioche volontaire normale (2.2) : le tour se termine immédiatement.
  const indexJoueurActif = avancerIndex(state, state.indexJoueurActif, 1);
  return {
    ...state,
    joueurs,
    banque: resultat.banque,
    pileCentrale: resultat.pileCentrale,
    indexJoueurActif,
  };
}

export function appliquerAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'JOUER_CARTE':
      return traiterJouerCarte(state, action.joueurId, action.carteId, action.timestamp);
    case 'PARTIR_EN_BANQUE':
      return traiterPartirEnBanque(state, action.joueurId, action.timestamp);
    case 'CHOISIR_ENSEIGNE':
      return traiterChoisirEnseigne(state, action.joueurId, action.enseigne, action.timestamp);
    default: {
      const _exhaustive: never = action;
      throw new Error(`Action inconnue : ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export { avancerIndex, joueurActifId };