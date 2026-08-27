import TcpSocket from 'react-native-tcp-socket';
import { LineBuffer } from './utils';
import type { HostMessage, ClientMessage } from './types';

interface ClientConnection {
  socket: TcpSocket.Socket;
  buffer: LineBuffer;
  clientId: string | null;
}

export class HostServer {
  private server: TcpSocket.Server | null = null;
  private clients: Set<ClientConnection> = new Set();
  private onMessageCallback?: (clientId: string, msg: ClientMessage) => void;
  private onDisconnectCallback?: (clientId: string) => void;

  /**
   * Démarre le serveur TCP sur le port spécifié
   */
  public start(port: number = 8080): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = TcpSocket.createServer((socket) => {
        const clientConn: ClientConnection = {
          socket,
          buffer: new LineBuffer(),
          clientId: null,
        };
        this.clients.add(clientConn);

        socket.on('data', (data) => {
          const lines = clientConn.buffer.push(data.toString());
          for (const line of lines) {
            try {
              const msg: ClientMessage = JSON.parse(line);
              
              // Identification du client dès qu'il envoie son JOIN_LOBBY
              if (msg.type === 'JOIN_LOBBY' && msg.payload.clientId) {
                clientConn.clientId = msg.payload.clientId;
              }

              if (clientConn.clientId && this.onMessageCallback) {
                this.onMessageCallback(clientConn.clientId, msg);
              }
            } catch (err) {
              console.warn('Erreur JSON de la part d\'un client', err);
            }
          }
        });

        socket.on('error', (err) => {
          console.warn('Erreur socket client', err);
        });

        socket.on('close', () => {
          this.clients.delete(clientConn);
          if (clientConn.clientId && this.onDisconnectCallback) {
            this.onDisconnectCallback(clientConn.clientId);
          }
        });
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.listen({ port, host: '0.0.0.0' }, () => {
        resolve();
      });
    });
  }

  /**
   * Arrête le serveur et déconnecte les clients
   */
  public stop(): void {
    if (this.server) {
      this.clients.forEach(c => c.socket.destroy());
      this.clients.clear();
      this.server.close();
      this.server = null;
    }
  }

  /**
   * Envoie un message à tous les clients connectés et identifiés
   */
  public broadcast(message: HostMessage, excludeClientId?: string): void {
    const payload = JSON.stringify(message) + '\n';
    this.clients.forEach((client) => {
      if (client.clientId && client.clientId !== excludeClientId) {
        client.socket.write(payload);
      }
    });
  }

  /**
   * Envoie un message à un client spécifique
   */
  public sendTo(clientId: string, message: HostMessage): void {
    const payload = JSON.stringify(message) + '\n';
    for (const client of this.clients) {
      if (client.clientId === clientId) {
        client.socket.write(payload);
        return;
      }
    }
  }

  /**
   * Définit les fonctions appelées lors de la réception d'événements réseaux
   */
  public setCallbacks(
    onMessage: (clientId: string, msg: ClientMessage) => void,
    onDisconnect: (clientId: string) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onDisconnectCallback = onDisconnect;
  }
}
