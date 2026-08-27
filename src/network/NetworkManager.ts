import { HostServer } from './HostServer';
import { ClientSocket } from './ClientSocket';

/**
 * Singleton global qui persiste les connexions réseau entre les écrans.
 *
 * Quand LobbyScreen fait `navigation.replace('TableJeu', ...)`, le composant
 * Lobby est démonté (et ses hooks nettoyés). Sans ce manager, le serveur TCP
 * et les sockets clients seraient détruits au passage. Le NetworkManager
 * détient les instances au-delà du cycle de vie d'un écran unique.
 */
class NetworkManagerSingleton {
  public server: HostServer | null = null;
  public client: ClientSocket | null = null;
  public mode: 'hote' | 'invite' | null = null;

  /** Initialise le serveur hôte. Appelé par useLobbyNetwork côté hôte. */
  public initServer(): HostServer {
    if (this.server) return this.server;
    this.server = new HostServer();
    this.mode = 'hote';
    return this.server;
  }

  /** Initialise le client. Appelé par useLobbyNetwork côté invité. */
  public initClient(): ClientSocket {
    if (this.client) return this.client;
    this.client = new ClientSocket();
    this.mode = 'invite';
    return this.client;
  }

  /** Détruit tout proprement (retour à l'accueil, etc.). */
  public teardown(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.mode = null;
  }
}

/** Instance unique accessible depuis n'importe quel module. */
export const NetworkManager = new NetworkManagerSingleton();
