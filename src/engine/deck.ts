import type { Card, JokerColor, Rank, Suit } from './types';

const SUITS: Suit[] = ['pique', 'coeur', 'trefle', 'carreau'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Construit un paquet standard de 54 cartes : 4 enseignes x 13 valeurs + 2 Jokers distincts.
 * Spec section 1.2.
 */
export function creerPaquetComplet(): Card[] {
  const cartes: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cartes.push({ kind: 'standard', id: nextId('c'), suit, rank });
    }
  }
  const couleursJoker: JokerColor[] = ['noir', 'rouge'];
  for (const color of couleursJoker) {
    cartes.push({ kind: 'joker', id: nextId('j'), color });
  }
  return cartes;
}

/**
 * Mélange aléatoire complet (Fisher-Yates). Ne mute pas le tableau d'entrée.
 */
export function melanger<T>(cartes: T[]): T[] {
  const resultat = [...cartes];
  for (let i = resultat.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = resultat[i] as T;
    resultat[i] = resultat[j] as T;
    resultat[j] = tmp;
  }
  return resultat;
}

export function estAs(carte: Card): boolean {
  return carte.kind === 'standard' && carte.rank === 'A';
}

export function estValet(carte: Card): boolean {
  return carte.kind === 'standard' && carte.rank === 'J';
}

export function estSept(carte: Card): boolean {
  return carte.kind === 'standard' && carte.rank === '7';
}

export function estDeux(carte: Card): boolean {
  return carte.kind === 'standard' && carte.rank === '2';
}

export function estJoker(carte: Card): carte is import('./types').JokerCard {
  return carte.kind === 'joker';
}

export function estCarteAttaque(carte: Card): boolean {
  return estSept(carte) || estJoker(carte);
}

export function couleurNoire(suit: Suit): boolean {
  return suit === 'pique' || suit === 'trefle';
}

export function couleurRouge(suit: Suit): boolean {
  return suit === 'coeur' || suit === 'carreau';
}