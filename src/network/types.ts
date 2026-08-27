import type { GameAction, GameState, TournoiState, GameConfig } from '../engine';
import type { JoueurLobby, PhaseLobby } from '../features/party/types';

export interface PlayerJoinInfo {
  pseudo: string;
  emoji?: string;
  clientId?: string; // Permet de récupérer sa session si reconnexion
}

/** Messages envoyés par un Client Invité vers le Serveur Hôte */
export type ClientMessage =
  | { type: 'JOIN_LOBBY'; payload: PlayerJoinInfo }
  | { type: 'SET_READY'; payload: { ready: boolean } }
  | { type: 'GAME_ACTION'; payload: GameAction } // Coup du moteur de jeu
  | { type: 'PING' };

/** Messages envoyés par le Serveur Hôte vers les Clients Invités */
export type HostMessage =
  | { type: 'WELCOME'; payload: { clientId: string; hostId: string } } // Reçu juste après JOIN_LOBBY
  | { type: 'LOBBY_STATE'; payload: { config: GameConfig; joueurs: JoueurLobby[]; nomPartie: string; phase: PhaseLobby } }
  | { type: 'GAME_STATE'; payload: { manche: GameState; tournoi: TournoiState } }
  | { type: 'ERROR'; payload: { code: string; message: string } }
  | { type: 'PONG' };
