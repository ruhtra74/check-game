import type { GameConfig, GameAction, GameState, TournoiState } from '../engine';
import type { EtatLobby } from '../features/party/types';

export const PORT_PAR_DEFAUT = 19745;
export const SERVICE_TYPE = 'checkgame';
export const SERVICE_PROTOCOL = 'tcp';
export const SERVICE_DOMAIN = 'local.';

// --- Messages Client -> Hôte ---
export type ClientMessage =
  | { type: 'JOIN'; pseudo: string; emoji?: string; clientId: string }
  | { type: 'LEAVE' }
  | { type: 'READY'; pret: boolean }
  | { type: 'GAME_ACTION'; action: GameAction }
  | { type: 'DISQUALIFICATION_VOTE'; voterId: string; cibleId?: string };

// --- Messages Hôte -> Client ---
export type HostMessage =
  | { type: 'WELCOME'; clientId: string }
  | { type: 'LOBBY_STATE'; etat: EtatLobby }
  | { type: 'GAME_STATE'; manche: GameState; tournoi: TournoiState; config: GameConfig }
  | { type: 'KICK'; raison?: string }
  | { type: 'HOST_DISCONNECTED'; raison?: string };

export type NetworkMessage = ClientMessage | HostMessage;

function encodeUtf8(str: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8');
  }
  return new TextEncoder().encode(str);
}

function decodeUtf8(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('utf-8');
  }
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
}

/**
 * Encode un objet JSON en un buffer avec en-tête de 4 octets (Uint32 BE) indiquant sa longueur.
 */
export function encoderMessage(msg: NetworkMessage): Uint8Array {
  const jsonStr = JSON.stringify(msg);
  const payload = encodeUtf8(jsonStr);
  const length = payload.length;

  const result = new Uint8Array(4 + length);
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  view.setUint32(0, length, false); // Big Endian
  result.set(payload, 4);

  return result;
}

/**
 * Reconstitue les messages à partir d'un flux de données TCP fragmenté.
 */
export class FrameDecoder {
  private buffer: Uint8Array = new Uint8Array(0);

  /**
   * Ajoute de nouvelles données reçues au tampon et extrait tous les messages complets.
   */
  public push(chunk: Uint8Array | string): NetworkMessage[] {
    let chunkBytes: Uint8Array;
    if (typeof chunk === 'string') {
      chunkBytes = encodeUtf8(chunk);
    } else if (chunk instanceof Uint8Array) {
      chunkBytes = chunk;
    } else {
      chunkBytes = new Uint8Array(chunk);
    }

    // Concaténer buffer existant + chunkBytes
    const newBuf = new Uint8Array(this.buffer.length + chunkBytes.length);
    newBuf.set(this.buffer, 0);
    newBuf.set(chunkBytes, this.buffer.length);
    this.buffer = newBuf;

    const messages: NetworkMessage[] = [];

    while (this.buffer.length >= 4) {
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
      const payloadLength = view.getUint32(0, false); // Big Endian

      if (this.buffer.length < 4 + payloadLength) {
        // Le message complet n'est pas encore arrivé
        break;
      }

      const payloadBytes = this.buffer.subarray(4, 4 + payloadLength);
      const jsonStr = decodeUtf8(payloadBytes);

      try {
        const parsed = JSON.parse(jsonStr) as NetworkMessage;
        messages.push(parsed);
      } catch (err) {
        console.error('Erreur de parsing du message réseau:', err, jsonStr);
      }

      // Consommer le message lu du buffer
      this.buffer = this.buffer.subarray(4 + payloadLength);
    }

    return messages;
  }

  public reset(): void {
    this.buffer = new Uint8Array(0);
  }
}
