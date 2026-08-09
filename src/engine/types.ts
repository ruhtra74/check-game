// ============================================================================
// TYPES FONDAMENTAUX DU MOTEUR DE JEU
// Ce fichier ne dépend d'aucune librairie externe (React Native, réseau, etc.)
// Toute la logique du moteur doit rester pure et testable indépendamment.
// ============================================================================

export type Suit = 'pique' | 'coeur' | 'trefle' | 'carreau';

export type Rank =
  | 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K';

export type JokerColor = 'noir' | 'rouge';

export interface StandardCard {
  kind: 'standard';
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface JokerCard {
  kind: 'joker';
  id: string;
  color: JokerColor;
}

export type Card = StandardCard | JokerCard;

export type RotationSens = 'horaire' | 'antihoraire';

// ----------------------------------------------------------------------------
// Configuration (paramétrable depuis l'UI - voir addendum section C)
// ----------------------------------------------------------------------------

export interface GameConfig {
  nbJoueurs: number; // 2 à 10
  nbCartesInitial: number; // >= 1, et nbJoueurs * nbCartesInitial < 53
  jPassePartout: boolean; // default false
  penaliteSept: number; // default 2
  penaliteJoker: number; // default 4
  sensRotationParDefaut: RotationSens; // default 'horaire'
}

export const DEFAULT_GAME_CONFIG_PARTIAL: Pick<
  GameConfig,
  'jPassePartout' | 'penaliteSept' | 'penaliteJoker' | 'sensRotationParDefaut'
> = {
  jPassePartout: false,
  penaliteSept: 2,
  penaliteJoker: 4,
  sensRotationParDefaut: 'horaire',
};

// ----------------------------------------------------------------------------
// Joueurs
// ----------------------------------------------------------------------------

export interface JoueurInfo {
  id: string;
  nom: string;
}

export interface PlayerState {
  id: string;
  nom: string;
  main: Card[];
  qualifie: boolean;
  tempsQualificationMs?: number;
}

// ----------------------------------------------------------------------------
// État d'une manche (GameState = une seule manche du tournoi)
// ----------------------------------------------------------------------------

export type PhaseJeu =
  | 'enCours'
  | 'choixEnseigneValet' // en attente qu'un joueur ayant posé un Valet choisisse l'enseigne
  | 'mancheTerminee'
  | 'bloque';

export interface GameState {
  config: GameConfig;
  joueurs: PlayerState[]; // joueurs de CETTE manche uniquement (déjà filtrés par le tournoi)
  ordreJoueursIds: string[]; // ordre de jeu fixé au début de la manche
  indexJoueurActif: number;
  sensRotation: RotationSens;
  pileCentrale: Card[]; // dernier élément du tableau = carte visible au sommet
  banque: Card[];
  compteurAttaque: number;
  enseigneCommandee: Suit | null; // actif si un Valet est en vigueur
  joueurEnAttenteChoixEnseigne: string | null;
  phase: PhaseJeu;
  raisonBlocage: string | null;
  perdantId: string | null; // rempli quand phase === 'mancheTerminee' (null si terminée par vote, cf addendum G)
  joueursEliminesParVote: string[] | null;
  debutMancheTimestamp: number;
  finMancheTimestamp: number | null;
  evenements: GameEvent[];
}

// ----------------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------------

export type GameAction =
  | { type: 'JOUER_CARTE'; joueurId: string; carteId: string; timestamp: number }
  | { type: 'PARTIR_EN_BANQUE'; joueurId: string; timestamp: number }
  | { type: 'CHOISIR_ENSEIGNE'; joueurId: string; enseigne: Suit; timestamp: number }
  // Déclenchée explicitement par le joueur actif quand la pioche n'est plus
  // possible (banque + défausse recyclable insuffisantes). Contrairement à
  // PARTIR_EN_BANQUE, ceci ne peut PAS survenir automatiquement : c'est un
  // choix conscient du joueur qui a la main, tant qu'il n'a pas cliqué la
  // partie continue normalement (il peut toujours déposer une carte valide).
  | { type: 'TERMINER_PARTIE_BLOCAGE'; joueurId: string; timestamp: number };

// ----------------------------------------------------------------------------
// Événements (pour déclencher animations/notifications côté UI)
// ----------------------------------------------------------------------------

export type GameEventType =
  | 'CHECK'
  | 'GAMES'
  | 'ATTAQUE_LANCEE'
  | 'ATTAQUE_ENCAISSEE'
  | 'MANCHE_TERMINEE'
  | 'BLOQUE'
  | 'VALET_JOUE'
  | 'AS_JOUE';

export interface GameEvent {
  type: GameEventType;
  joueurId?: string;
  detail?: Record<string, unknown>;
  timestamp: number;
}

// ----------------------------------------------------------------------------
// Tournoi (plusieurs manches successives - voir addendum section F et G)
// ----------------------------------------------------------------------------

export interface ClassementEntree {
  joueurId: string;
  tempsQualificationMs: number;
}

export interface ResultatManche {
  numeroManche: number;
  classement: ClassementEntree[]; // ordre croissant de temps
  perdantId: string | null; // null si la manche s'est terminée par vote (cf section G)
  joueursEliminesParVote: string[] | null;
}

export interface TournoiState {
  joueursActifs: JoueurInfo[]; // encore en lice dans le tournoi
  joueursElimines: { joueur: JoueurInfo; numeroManche: number }[];
  manches: ResultatManche[];
  mancheCouranteNumero: number;
  vainqueurId: string | null;
}

// ----------------------------------------------------------------------------
// Vote de disqualification accélérée (addendum section G - UNANIMITÉ requise)
// ----------------------------------------------------------------------------

export interface VoteDisqualificationState {
  eligibles: string[]; // ids des joueurs qualifiés dans la manche en cours, seuls habilités à voter
  votes: Set<string>; // ids ayant voté "oui" pour la disqualification accélérée
}