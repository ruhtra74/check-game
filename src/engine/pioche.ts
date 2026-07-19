import { melanger } from './deck';
import type { Card, GameState } from './types';

export interface ResultatPiocheOk {
  bloque: false;
  cartes: Card[];
  banque: Card[];
  pileCentrale: Card[];
}

export interface ResultatPiocheBloquee {
  cartes?: Card[];
  banque?: Card[];
  pileCentrale?: Card[];
  bloque: true;
  raison: string;
}

export type ResultatPioche = ResultatPiocheOk | ResultatPiocheBloquee;

/**
 * Pioche `nombre` cartes, avec recyclage automatique de la défausse si la
 * banque se vide en cours de route (spec section 3). Ne mute pas `state`.
 *
 * Si la pioche est totalement impossible (plus aucune carte disponible, même
 * après recyclage — cas extrême où le compteur d'attaque dépasse le nombre
 * total de cartes en jeu), retourne un résultat bloqué SANS distribuer de
 * cartes partielles (addendum E : on bloque proprement plutôt que de
 * compenser).
 */
export function piocherCartes(state: GameState, nombre: number): ResultatPioche {
  let banque = [...state.banque];
  let pile = [...state.pileCentrale];
  const cartes: Card[] = [];

  for (let i = 0; i < nombre; i += 1) {
    if (banque.length === 0) {
      if (pile.length <= 1) {
        const manquantes = nombre - cartes.length;
        return {
          bloque: true,
          raison: `Plus aucune carte disponible pour la pioche (${manquantes} carte(s) manquante(s) sur ${nombre} demandée(s)).`,
        };
      }
      const dessus = pile[pile.length - 1] as Card;
      const dessous = pile.slice(0, pile.length - 1);
      banque = melanger(dessous);
      pile = [dessus];
    }
    const carte = banque.pop();
    if (!carte) {
      return { bloque: true, raison: 'Erreur inattendue : pioche vide de manière inattendue.' };
    }
    cartes.push(carte);
  }

  return { bloque: false, cartes, banque, pileCentrale: pile };
}