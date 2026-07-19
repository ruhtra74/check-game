import { describe, expect, it } from 'vitest';
import { creerConfig } from '../config.js';
import { initManche } from '../state.js';
import { appliquerAction } from '../reducer.js';
import { carteVisible } from '../rules.js';
import type { Card, GameState, JoueurInfo, StandardCard } from '../types.js';

const J1: JoueurInfo = { id: 'j1', nom: 'Alice' };
const J2: JoueurInfo = { id: 'j2', nom: 'Bob' };
const J3: JoueurInfo = { id: 'j3', nom: 'Chloé' };

// À ajouter dans ton fichier de types ou au début du test si tu veux surcharger temporairement
export type GameAction =
  | { type: 'JOUER_CARTE'; joueurId: string; carteId: string; timestamp: number }
  | { type: 'PARTIR_EN_BANQUE'; joueurId: string; timestamp: number }
  | { type: 'CHOISIR_ENSEIGNE'; joueurId: string; enseigne: StandardCard['suit']; timestamp: number }
  | { type: 'VOTER_DISQUALIFICATION'; joueurId: string; timestamp: number }; // <-- Ajoute cette ligne

function carte(suit: StandardCard['suit'], rank: StandardCard['rank'], id?: string): StandardCard {
  return { kind: 'standard', suit, rank, id: id ?? `${suit}-${rank}-${Math.random()}` };
}

function joker(color: 'noir' | 'rouge', id?: string): Card {
  return { kind: 'joker', color, id: id ?? `joker-${color}-${Math.random()}` };
}

/** Construit un GameState "à la main" pour tester une situation précise sans dépendre du mélange aléatoire. */
function etatManuel(overrides: Partial<GameState>): GameState {
  const base: GameState = {
    config: creerConfig({ nbJoueurs: 2, nbCartesInitial: 3 }),
    joueurs: [
      { id: J1.id, nom: J1.nom, main: [], qualifie: false },
      { id: J2.id, nom: J2.nom, main: [], qualifie: false },
    ],
    ordreJoueursIds: [J1.id, J2.id],
    indexJoueurActif: 0,
    sensRotation: 'horaire',
    pileCentrale: [carte('coeur', '5', 'top')],
    banque: [],
    compteurAttaque: 0,
    enseigneCommandee: null,
    joueurEnAttenteChoixEnseigne: null,
    phase: 'enCours',
    raisonBlocage: null,
    perdantId: null,
    joueursEliminesParVote: null,
    debutMancheTimestamp: 0,
    finMancheTimestamp: null,
    evenements: [],
  };
  return { ...base, ...overrides };
}

describe('initManche', () => {
  it('distribue le bon nombre de cartes et respecte la restriction de départ', () => {
    const config = creerConfig({ nbJoueurs: 3, nbCartesInitial: 5 });
    const state = initManche({
      joueurs: [J1, J2, J3],
      config,
      premierJoueurId: J1.id,
      sensRotation: 'horaire',
      maintenant: 1000,
    });

    expect(state.joueurs.every((j) => j.main.length === 5)).toBe(true);
    const top = carteVisible(state) as Card;
    const interdit =
      top.kind === 'joker' ||
      top.rank === 'A' ||
      top.rank === 'J' ||
      top.rank === '7' ||
      top.rank === '2';
    expect(interdit).toBe(false);
    // 54 cartes - (3*5 distribuées) - 1 carte de départ = 38 en banque
    expect(state.banque.length).toBe(54 - 15 - 1);
  });

  it('rejette une configuration où nbJoueurs * nbCartesInitial >= 53', () => {
    const config = creerConfig({ nbJoueurs: 10, nbCartesInitial: 6 }); // 60 >= 53
    expect(() =>
      initManche({
        joueurs: Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, nom: `P${i}` })),
        config,
        premierJoueurId: 'p0',
        sensRotation: 'horaire',
      })
    ).toThrow();
  });
});

describe('correspondance standard des cartes', () => {
  it('accepte une carte de même enseigne ou même valeur, refuse sinon', () => {
    const state = etatManuel({
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('coeur', '9', 'a'), carte('pique', '3', 'b')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: false },
      ],
    });

    // top = coeur-5 -> coeur-9 doit être jouable (même enseigne)
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'a', timestamp: 10 });
    expect((carteVisible(s2) as StandardCard).id).toBe('a');
  });

  it("refuse une carte qui ne correspond ni en enseigne ni en valeur", () => {
    const state = etatManuel({
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('pique', '3', 'b')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: false },
      ],
    });
    expect(() =>
      appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'b', timestamp: 10 })
    ).toThrow();
  });
});

describe('le 2 passe-partout', () => {
  it('se joue sur n\'importe quelle carte et va sous la pile sans changer le sommet visible', () => {
    const state = etatManuel({
      joueurs: [
        // J1 garde une carte en plus pour ne pas se qualifier en jouant le 2.
        { id: J1.id, nom: J1.nom, main: [carte('pique', '2', 'deux'), carte('carreau', '8', 'reste')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [carte('trefle', '9')], qualifie: false },
      ],
    });
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'deux', timestamp: 10 });
    expect((carteVisible(s2) as StandardCard).id).toBe('top'); // sommet inchangé
    expect(s2.pileCentrale[0]?.id).toBe('deux'); // 2 inséré tout en bas
    expect(s2.indexJoueurActif).toBe(1); // tour passé normalement au joueur suivant
  });

  it('est bloqué pendant une attaque active', () => {
    const state = etatManuel({
      compteurAttaque: 2,
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('pique', '2', 'deux')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: false },
      ],
    });
    expect(() =>
      appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'deux', timestamp: 10 })
    ).toThrow();
  });
});

describe('le Valet (commande d\'enseigne)', () => {
  it('suspend le tour jusqu\'au choix de l\'enseigne puis force le joueur suivant', () => {
    const state = etatManuel({
      pileCentrale: [carte('coeur', 'J', 'top')],
      joueurs: [
        // J1 garde une carte en plus pour ne pas se qualifier en jouant le Valet.
        { id: J1.id, nom: J1.nom, main: [carte('coeur', 'J', 'valet'), carte('carreau', '8', 'reste')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [carte('pique', '4'), carte('trefle', '9')], qualifie: false },
      ],
    });
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'valet', timestamp: 10 });
    expect(s2.phase).toBe('choixEnseigneValet');
    expect(s2.joueurEnAttenteChoixEnseigne).toBe(J1.id);
    expect(s2.indexJoueurActif).toBe(0); // le tour n'a pas encore réellement changé

    const s3 = appliquerAction(s2, {
      type: 'CHOISIR_ENSEIGNE',
      joueurId: J1.id,
      enseigne: 'trefle',
      timestamp: 11,
    });
    expect(s3.phase).toBe('enCours');
    expect(s3.enseigneCommandee).toBe('trefle');
    expect(s3.indexJoueurActif).toBe(1); // tour passé au joueur suivant

    // J2 n'a pas de trèfle ni de valet -> devrait être bloqué de jouer sa carte pique
    expect(() =>
      appliquerAction(s3, {
        type: 'JOUER_CARTE',
        joueurId: J2.id,
        carteId: (s3.joueurs[1] as { main: Card[] }).main[0]!.id,
        timestamp: 12,
      })
    ).toThrow();
  });
});

describe('l\'As Stop', () => {
  it('à 2 joueurs, redonne la main au même joueur (peut enchaîner)', () => {
    const state = etatManuel({
      pileCentrale: [carte('coeur', 'A', 'top')],
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('coeur', 'A', 'as1')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [carte('pique', '9')], qualifie: false },
      ],
    });
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'as1', timestamp: 10 });
    expect(s2.indexJoueurActif).toBe(0); // reste sur J1
  });

  it('à 3 joueurs, saute exactement un joueur (pas d\'enchaînement)', () => {
    const state = etatManuel({
      pileCentrale: [carte('coeur', 'A', 'top')],
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('coeur', 'A', 'as1')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [carte('pique', '9')], qualifie: false },
        { id: J3.id, nom: J3.nom, main: [carte('trefle', '9')], qualifie: false },
      ],
      ordreJoueursIds: [J1.id, J2.id, J3.id],
    });
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'as1', timestamp: 10 });
    expect(s2.indexJoueurActif).toBe(2); // J2 sauté, tour à J3
  });
});

describe('attaque cumulative (7 et Jokers)', () => {
  it('cumule les pénalités et permet la surenchère toutes couleurs confondues', () => {
    const state = etatManuel({
      pileCentrale: [carte('coeur', '7', 'top')],
      compteurAttaque: 2, // un 7 a déjà été posé
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [joker('noir', 'jk')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: false },
      ],
    });
    // Joker noir posé sur un 7 de coeur alors qu'aucune attaque ne serait
    // normalement compatible en couleur -> autorisé car compteurAttaque > 0.
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'jk', timestamp: 10 });
    expect(s2.compteurAttaque).toBe(2 + 4); // pénalité par défaut joker = 4
  });

  it("encaisser ne termine pas le tour : le joueur doit ensuite jouer ou repartir en banque", () => {
    const state = etatManuel({
      compteurAttaque: 4,
      banque: [
        carte('pique', '3', 'p1'),
        carte('pique', '4', 'p2'),
        carte('pique', '5', 'p3'),
        carte('pique', '6', 'p4'),
        carte('pique', '7', 'p5'), // carte supplémentaire pour la pioche volontaire qui suit l'encaissement
      ],
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: false },
      ],
    });
    const s2 = appliquerAction(state, { type: 'PARTIR_EN_BANQUE', joueurId: J1.id, timestamp: 10 });
    expect(s2.compteurAttaque).toBe(0);
    expect(s2.joueurs[0]?.main.length).toBe(4);
    expect(s2.indexJoueurActif).toBe(0); // toujours le tour de J1

    // Cette fois (compteurAttaque === 0), une pioche volontaire termine le tour.
    const s3 = appliquerAction(s2, { type: 'PARTIR_EN_BANQUE', joueurId: J1.id, timestamp: 11 });
    expect(s3.indexJoueurActif).toBe(1);
  });

  it('recycle la défausse quand la banque est vide (spec section 3)', () => {
    const state = etatManuel({
      banque: [],
      pileCentrale: [carte('coeur', '5', 'dessous1'), carte('coeur', '6', 'dessous2'), carte('coeur', '9', 'top')],
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: false },
      ],
    });
    const s2 = appliquerAction(state, { type: 'PARTIR_EN_BANQUE', joueurId: J1.id, timestamp: 10 });
    expect(s2.pileCentrale).toHaveLength(1);
    expect(s2.pileCentrale[0]?.id).toBe('top');
    expect(s2.joueurs[0]?.main).toHaveLength(1);
  });

  it('bloque la partie si la pénalité dépasse les cartes disponibles', () => {
    const state = etatManuel({
      compteurAttaque: 10,
      banque: [],
      pileCentrale: [carte('coeur', '9', 'top')], // rien à recycler en dessous
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: false },
      ],
    });
    const s2 = appliquerAction(state, { type: 'PARTIR_EN_BANQUE', joueurId: J1.id, timestamp: 10 });
    expect(s2.phase).toBe('bloque');
    expect(s2.raisonBlocage).not.toBeNull();
  });
});

describe('Check, Games et fin de manche', () => {
  it('déclenche CHECK à 1 carte restante et GAMES à 0', () => {
    const state = etatManuel({
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('coeur', '9', 'a'), carte('pique', '3', 'b')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [carte('trefle', '4')], qualifie: false },
      ],
    });
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'a', timestamp: 100 });
    expect(s2.evenements.some((e) => e.type === 'CHECK' && e.joueurId === J1.id)).toBe(true);
  });

  it('termine la manche quand il ne reste plus qu\'un seul joueur avec des cartes', () => {
    const state = etatManuel({
      debutMancheTimestamp: 1000,
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('coeur', '9', 'derniere')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [carte('pique', '4')], qualifie: true, tempsQualificationMs: 500 },
      ],
    });
    const s2 = appliquerAction(state, {
      type: 'JOUER_CARTE',
      joueurId: J1.id,
      carteId: 'derniere',
      timestamp: 3000,
    });
    expect(s2.phase).toBe('mancheTerminee');
    expect(s2.perdantId).toBe(J2.id);
    expect(s2.joueurs.find((j) => j.id === J1.id)?.tempsQualificationMs).toBe(2000);
  });
});

describe('Intersections de règles', () => {
  it('empêche de jouer un As pendant une attaque active (7 ou Joker)', () => {
    const state = etatManuel({
      compteurAttaque: 2,
      joueurs: [{ id: J1.id, nom: J1.nom, main: [carte('coeur', 'A', 'as1')], qualifie: false }],
    });
    // L'attaque force le 7 ou le Joker. L'As ne doit pas être accepté.
    expect(() =>
      appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'as1', timestamp: 10 })
    ).toThrow();
  });

  it('force le joueur à piocher si le Joker au sommet demande une couleur qu\'il n\'a pas', () => {
    const state = etatManuel({
      // Joker noir au sommet -> prochain joueur doit jouer Pique ou Trèfle
      pileCentrale: [joker('noir', 'joker_top')],
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('coeur', '8', 'card1')], qualifie: false },
      ],
    });
    // Jouer une carte de mauvaise couleur devrait échouer
    expect(() =>
      appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: 'card1', timestamp: 10 })
    ).toThrow();
  });
});

describe('Flux de jeu et éliminations', () => {
  it('saute correctement les joueurs qualifiés lors du passage de tour', () => {
    const state = etatManuel({
      ordreJoueursIds: [J1.id, J2.id, J3.id],
      indexJoueurActif: 0, // J1 joue
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('coeur', '5'), carte('carreau', '8')], qualifie: false },
        { id: J2.id, nom: J2.nom, main: [], qualifie: true }, // J2 est qualifié
        { id: J3.id, nom: J3.nom, main: [carte('trefle', '9')], qualifie: false },
      ],
    });
    
    // J1 joue, le tour doit passer à J3 directement (J2 est qualifié)
    const s2 = appliquerAction(state, { type: 'JOUER_CARTE', joueurId: J1.id, carteId: state.joueurs[0].main[0].id, timestamp: 10 });
    expect(s2.indexJoueurActif).toBe(2); // Index de J3
  });
});

describe('Configuration et intégrité', () => {
  it('détecte le blocage critique quand la banque est vide et compteurAttaque > 0', () => {
    // Cas où le joueur doit piocher une attaque mais il n'y a plus de cartes
    // et il ne peut pas surenchérir.
    const state = etatManuel({
      compteurAttaque: 10,
      banque: [],
      pileCentrale: [carte('coeur', '5')],
      joueurs: [
        { id: J1.id, nom: J1.nom, main: [carte('pique', '3')], qualifie: false },
      ],
    });
    // Il tente de partir en banque (pour subir la pénalité)
    const s2 = appliquerAction(state, { type: 'PARTIR_EN_BANQUE', joueurId: J1.id, timestamp: 10 });
    
    expect(s2.phase).toBe('bloque');
    expect(s2.raisonBlocage).toBeDefined();
  });
});