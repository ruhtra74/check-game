import type { GameConfig } from '../../engine';

export interface JoueurLobby {
  id: string;
  pseudo: string;
  emoji?: string;
  estHote: boolean;
  /** L'hôte décide qui participe réellement — vrai par défaut pour tout le monde. */
  selectionne: boolean;
  /** A confirmé vouloir commencer, une fois la phase de confirmation lancée. */
  pret: boolean;
}

export type PhaseLobby = 'attenteJoueurs' | 'confirmationDemarrage' | 'partieLancee';

export interface EtatLobby {
  nomPartie: string;
  config: GameConfig;
  joueurs: JoueurLobby[];
  phase: PhaseLobby;
}