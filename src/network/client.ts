import TcpSocket from 'react-native-tcp-socket';
import {
  FrameDecoder,
  PORT_PAR_DEFAUT,
  encoderMessage,
  type ClientMessage,
  type HostMessage,
} from './protocol';

export interface OptionsClientTCP {
  hostIp: string;
  port?: number;
  clientId: string;
  pseudo: string;
  emoji?: string;
  onMessage?: (msg: HostMessage) => void;
  onConnecte?: () => void;
  onDeconnecte?: (raison?: string) => void;
  onError?: (err: Error) => void;
}

export class ClientTCP {
  private socket: ReturnType<typeof TcpSocket.createConnection> | null = null;
  private decoder = new FrameDecoder();
  private hostIp: string;
  private port: number;
  private clientId: string;
  private pseudo: string;
  private emoji?: string;

  private onMessage?: OptionsClientTCP['onMessage'];
  private onConnecte?: OptionsClientTCP['onConnecte'];
  private onDeconnecte?: OptionsClientTCP['onDeconnecte'];
  private onError?: OptionsClientTCP['onError'];

  constructor(options: OptionsClientTCP) {
    this.hostIp = options.hostIp;
    this.port = options.port ?? PORT_PAR_DEFAUT;
    this.clientId = options.clientId;
    this.pseudo = options.pseudo;
    this.emoji = options.emoji;
    this.onMessage = options.onMessage;
    this.onConnecte = options.onConnecte;
    this.onDeconnecte = options.onDeconnecte;
    this.onError = options.onError;
  }

  public connecter(retries = 5): Promise<void> {
    return new Promise((resolve, reject) => {
      let estConnecte = false;

      const attempt = (remaining: number) => {
        try {
          this.decoder.reset();
          this.socket = TcpSocket.createConnection(
            {
              port: this.port,
              host: this.hostIp,
            },
            () => {
              estConnecte = true;
              // Envoyer immédiatement le message JOIN
              this.envoyer({
                type: 'JOIN',
                clientId: this.clientId,
                pseudo: this.pseudo,
                emoji: this.emoji,
              });
              this.onConnecte?.();
              resolve();
            }
          );

          this.socket.on('data', (data: Uint8Array | string) => {
            const messages = this.decoder.push(data);
            for (const msg of messages) {
              const hostMsg = msg as HostMessage;
              if (hostMsg.type === 'HOST_DISCONNECTED' || hostMsg.type === 'KICK') {
                this.onDeconnecte?.(hostMsg.type === 'KICK' ? hostMsg.raison ?? 'Exclu' : "L'hôte a quitté la partie");
                this.deconnecter();
              } else {
                this.onMessage?.(hostMsg);
              }
            }
          });

          this.socket.on('close', () => {
            if (estConnecte) {
              this.onDeconnecte?.("Connexion avec l'hôte perdue");
            }
          });

          this.socket.on('error', (err: Error) => {
            if (!estConnecte && remaining > 0) {
              try {
                this.socket?.destroy();
              } catch {}
              this.socket = null;
              setTimeout(() => attempt(remaining - 1), 300);
            } else {
              this.onError?.(err);
              reject(err);
            }
          });
        } catch (err) {
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), 300);
          } else {
            reject(err);
          }
        }
      };

      attempt(retries);
    });
  }

  public envoyer(msg: ClientMessage): void {
    if (!this.socket) return;
    try {
      const encoded = encoderMessage(msg);
      this.socket.write(encoded);
    } catch (err) {
      console.warn('Erreur lors de l’envoi TCP par le client:', err);
    }
  }

  public deconnecter(): void {
    if (this.socket) {
      try {
        this.envoyer({ type: 'LEAVE' });
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
  }
}
