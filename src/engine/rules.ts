import type { Card, GameConfig, GameState } from './types';
import { couleurNoire, couleurRouge, estAs, estCarteAttaque, estDeux, estJoker, estValet } from './deck';

export function carteVisible(state: GameState): Card | undefined {
  return state.pileCentrale[state.pileCentrale.length - 1];
}

/**
 * Détermine si `carte` peut être jouée dans le contexte actuel.
 *
 * Hypothèses de modélisation (documentées car le spec original ne précise pas
 * tous les cas d'interaction) :
 *  - Si une attaque est active (compteurAttaque > 0), SEULES les cartes
 *    d'attaque (7 / Joker) sont jouables, sans aucune contrainte de couleur
 *    (spec 4.4.A). Le 2 est explicitement bloqué pendant une attaque
 *    (addendum section A).
 *  - Si une enseigne est commandée par un Valet (enseigneCommandee != null),
 *    la correspondance par VALEUR avec la carte visible est suspendue : seule
 *    compte la correspondance avec l'enseigne commandée, sauf pour le Valet
 *    (toujours jouable pour changer la commande) et le 2 (toujours jouable
 *    hors attaque).
 *  - Sinon (cas normal), la correspondance standard s'applique : même
 *    enseigne OU même valeur que la carte visible, avec les règles propres
 *    aux Jokers (couleur) et au J_passe_partout.
 */
export function carteJouable(state: GameState, carte: Card, config: GameConfig): boolean {
  // Cas 1 : attaque active -> seules les cartes d'attaque comptent, sans restriction.
  if (state.compteurAttaque > 0) {
    return estCarteAttaque(carte);
  }

  // Cas 2 : le 2 est un passe-partout absolu (hors attaque).
  if (estDeux(carte)) {
    return true;
  }

  // Cas 3 : une enseigne est commandée par un Valet précédent.
  if (state.enseigneCommandee) {
    if (estValet(carte)) {
      // Un Valet peut toujours être posé pour changer la commande,
      // sauf si jPassePartout est désactivé ET que sa propre enseigne ne
      // correspond pas à la commande en cours -> on autorise quand même,
      // car "poser un Valet pour changer la commande" est une règle
      // explicite indépendante de J_passe_partout.
      return true;
    }
    if (carte.kind === 'standard') {
      return carte.suit === state.enseigneCommandee;
    }
    // Un Joker ne correspond jamais directement à une enseigne commandée
    // (les Jokers n'ont pas d'enseigne), sauf via la mécanique d'attaque
    // déjà gérée au Cas 1.
    return false;
  }

  const top = carteVisible(state);
  if (!top) {
    // Ne devrait pas arriver en cours de partie (toujours au moins la carte
    // de départ), mais on sécurise : tout est jouable si la pile est vide.
    return true;
  }

  // Cas 4 : Valet avec J_passe_partout activé.
  if (estValet(carte) && config.jPassePartout) {
    return true;
  }

  // Cas 5 : Joker joué normalement (hors attaque) -> dépend de la couleur du dessus.
  // Règle symétrique (spec 4.4.A et 4.D) : un Joker matche un dessus de sa couleur
  // (carte standard noire/rouge OU Joker de même couleur), et réciproquement.
  if (estJoker(carte)) {
    if (top.kind === 'joker') return carte.color === top.color;
    return carte.color === 'noir' ? couleurNoire(top.suit) : couleurRouge(top.suit);
  }

  // Cas 6 : le sommet est un Joker et la carte candidate est une carte standard.
  // Symétrique du cas 5 (spec 4.D) : toute carte de la couleur du Joker convient.
  if (top.kind === 'joker') {
    return top.color === 'noir' ? couleurNoire(carte.suit) : couleurRouge(carte.suit);
  }

  // Cas 7 : correspondance standard (enseigne ou valeur), inclut As, Valet (sans
  // J_passe_partout), 7, et toutes les cartes normales.
  return carte.suit === top.suit || carte.rank === top.rank;
}

export function valeurAttaque(carte: Card, config: GameConfig): number {
  if (carte.kind === 'standard' && carte.rank === '7') return config.penaliteSept;
  if (carte.kind === 'joker') return config.penaliteJoker;
  return 0;
}

export function joueursEncoreEnJeu(state: GameState) {
  return state.joueurs.filter((j) => !j.qualifie);
}

export { estAs, estCarteAttaque, estDeux, estJoker, estValet };