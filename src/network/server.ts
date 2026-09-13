import TcpSocket from 'react-native-tcp-socket';
import {
  FrameDecoder,
  PORT_PAR_DEFAUT,
  encoderMessage,
  type ClientMessage,
  type HostMessage,
  type NetworkMessage,
} from './protocol';

export interface OptionsServeurTCP {
  port?: number;
  onClientConnecte?: (clientId: string, pseudo: string, emoji?: string) => void;
  onClientDeconnecte?: (clientId: string) => void;
  onMessage?: (clientId: string, message: ClientMessage) => void;
  onError?: (erreur: Error) => void;
}

export class ServeurTCP {
  private server: ReturnType<typeof TcpSocket.createServer> | null = null;
  private clients = new Map<string, { socket: any; decoder: FrameDecoder; pseudo?: string }>();
  private port: number;

  private onClientConnecte?: OptionsServeurTCP['onClientConnecte'];
  private onClientDeconnecte?: OptionsServeurTCP['onClientDeconnecte'];
  private onMessage?: OptionsServeurTCP['onMessage'];
  private onError?: OptionsServeurTCP['onError'];

  constructor(options: OptionsServeurTCP = {}) {
    this.port = options.port ?? PORT_PAR_DEFAUT;
    this.onClientConnecte = options.onClientConnecte;
    this.onClientDeconnecte = options.onClientDeconnecte;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
  }

  public demarrer(retries = 5): Promise<void> {
    return new Promise((resolve, reject) => {
      const attempt = (remaining: number) => {
        try {
          this.server = TcpSocket.createServer((socket) => {
            const tempId = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const decoder = new FrameDecoder();
            this.clients.set(tempId, { socket, decoder });

            socket.on('data', (data: Uint8Array | string) => {
              const clientInfo = Array.from(this.clients.entries()).find(([_, info]) => info.socket === socket);
              if (!clientInfo) return;

              const [currentId, info] = clientInfo;
              const messages = info.decoder.push(data);

              for (const msg of messages) {
                if (msg.type === 'JOIN') {
                  const realId = msg.clientId;
                  if (currentId !== realId) {
                    this.clients.delete(currentId);
                    info.pseudo = msg.pseudo;
                    this.clients.set(realId, info);
                  }
                  this.envoyerA(realId, { type: 'WELCOME', clientId: realId });
                  this.onClientConnecte?.(realId, msg.pseudo, msg.emoji);
                } else {
                  this.onMessage?.(currentId, msg as ClientMessage);
                }
              }
            });

            socket.on('close', () => {
              const entry = Array.from(this.clients.entries()).find(([_, info]) => info.socket === socket);
              if (entry) {
                const [clientId] = entry;
                this.clients.delete(clientId);
                this.onClientDeconnecte?.(clientId);
              }
            });

            socket.on('error', (err: Error) => {
              this.onError?.(err);
            });
          });

          this.server.on('error', (err: any) => {
            if ((err?.code === 'EADDRINUSE' || err?.message?.includes('address already in use')) && remaining > 0) {
              try {
                this.server?.close();
              } catch {}
              this.server = null;
              setTimeout(() => attempt(remaining - 1), 200);
            } else {
              this.onError?.(err);
              reject(err);
            }
          });

          this.server.listen({ port: this.port, host: '0.0.0.0' }, () => {
            resolve();
          });
        } catch (err) {
          if (remaining > 0) {
            setTimeout(() => attempt(remaining - 1), 200);
          } else {
            reject(err);
          }
        }
      };

      attempt(retries);
    });
  }

  public deconnecterTous(): void {
    this.arreter();
  }

  public arreter(): void {
    // Prévenir tous les clients que l'hôte s'arrête
    this.broadcast({ type: 'HOST_DISCONNECTED', raison: "L'hôte a fermé la partie" });

    // Fermer les sockets clients
    for (const [_, info] of this.clients) {
      try {
        info.socket.destroy();
      } catch {}
    }
    this.clients.clear();

    if (this.server) {
      try {
        this.server.close();
      } catch {}
      this.server = null;
    }
  }

  public broadcast(msg: HostMessage): void {
    const encoded = encoderMessage(msg);
    for (const [_, info] of this.clients) {
      try {
        info.socket.write(encoded);
      } catch (err) {
        console.warn('Erreur lors de l’envoi TCP broadcast:', err);
      }
    }
  }

  public envoyerA(clientId: string, msg: HostMessage): void {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo) return;
    try {
      const encoded = encoderMessage(msg);
      clientInfo.socket.write(encoded);
    } catch (err) {
      console.warn(`Erreur lors de l'envoi TCP à ${clientId}:`, err);
    }
  }

  public deconnecterClient(clientId: string, raison?: string): void {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo) return;

    try {
      const encoded = encoderMessage({ type: 'KICK', raison });
      clientInfo.socket.write(encoded);
      clientInfo.socket.destroy();
    } catch {}

    this.clients.delete(clientId);
    this.onClientDeconnecte?.(clientId);
  }
}
