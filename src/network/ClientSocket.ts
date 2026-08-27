import TcpSocket from 'react-native-tcp-socket';
import { LineBuffer } from './utils';
import type { HostMessage, ClientMessage } from './types';

export class ClientSocket {
  private socket: TcpSocket.Socket | null = null;
  private buffer: LineBuffer = new LineBuffer();
  
  private onMessageCallback?: (msg: HostMessage) => void;
  private onDisconnectCallback?: () => void;
  private onErrorCallback?: (err: Error) => void;

  /**
   * Se connecte à un serveur réseau Hôte distant.
   */
  public connect(hostIp: string, port: number = 8080): Promise<void> {
    return new Promise((resolve, reject) => {
      let isResolved = false;

      this.socket = TcpSocket.createConnection({ port, host: hostIp }, () => {
        if (!isResolved) {
          isResolved = true;
          resolve();
        }
      });

      this.socket.on('data', (data) => {
        const lines = this.buffer.push(data.toString());
        for (const line of lines) {
          try {
            const msg: HostMessage = JSON.parse(line);
            if (this.onMessageCallback) {
              this.onMessageCallback(msg);
            }
          } catch (err) {
             console.warn('Erreur de parsing de message depuis l\'hôte', err);
          }
        }
      });

      this.socket.on('error', (err) => {
        if (!isResolved) {
          isResolved = true;
          reject(err);
        } else if (this.onErrorCallback) {
          this.onErrorCallback(err);
        }
      });

      this.socket.on('close', () => {
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
      });
    });
  }

  /**
   * Se déconnecte proprement de l'hôte
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  /**
   * Envoie une intention d'action au serveur Hôte
   */
  public send(message: ClientMessage): void {
    if (this.socket) {
      const payload = JSON.stringify(message) + '\n';
      this.socket.write(payload);
    }
  }

  /**
   * Permet d'écouter les retours de l'Hôte
   */
  public setCallbacks(
    onMessage: (msg: HostMessage) => void,
    onDisconnect: () => void,
    onError: (err: Error) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onDisconnectCallback = onDisconnect;
    this.onErrorCallback = onError;
  }
}
