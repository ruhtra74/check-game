import Zeroconf from 'react-native-zeroconf';

const zeroconf = new Zeroconf();

export interface DiscoveredGame {
  id: string; 
  nomPartie: string;
  hoteNom: string;
  nbJoueurs: number;
  hostIp: string;
  port: number;
}

// État local du module pour éviter la duplication d'écoute
let isScanning = false;
let publishedName = '';

export const DiscoveryService = {
  /**
   * Publie la partie sur le réseau local (Wi-Fi).
   */
  startPublishing: (port: number, identifier: string, nomPartie: string, pseudoHost: string, nbJoueurs: number = 1) => {
    DiscoveryService.stopPublishing();

    publishedName = `chk_${identifier}`;
    
    // Les champs TXT permettent de diffuser des métadonnées (nom de partie, pseudo). 
    // Ils doivent être de type String.
    const txtRecords = {
       n: nomPartie,
       h: pseudoHost,
       j: nbJoueurs.toString(),
    };

    // Publie le service mDNS.
    zeroconf.publish(publishedName, 'tcp', 'local.', 'CheckGameHost', port, txtRecords);
  },

  /**
   * Stoppe la diffusion mDNS de la partie.
   */
  stopPublishing: () => {
    if (publishedName) {
      zeroconf.unpublishService(publishedName);
      publishedName = '';
    }
  },

  /**
   * Scanne le réseau (LAN/Wi-Fi) à la recherche de parties CheckGame.
   */
  startScanning: (
    onGameFound: (game: DiscoveredGame) => void,
    onGameLost: (serviceName: string) => void
  ) => {
    if (isScanning) return;
    
    zeroconf.removeDeviceListeners();
    
    zeroconf.on('resolved', (service) => {
      if (service.name && service.name.startsWith('chk_')) {
         const hostIp = service.addresses && service.addresses[0];
         if (hostIp) {
            onGameFound({
              id: service.name, // On utilise le nom de service unique comme identifiant
              nomPartie: service.txt?.n ?? 'Partie LAN',
              hoteNom: service.txt?.h ?? 'Un Joueur',
              nbJoueurs: service.txt?.j ? parseInt(service.txt.j, 10) : 1,
              hostIp,
              port: service.port,
            });
         }
      }
    });

    zeroconf.on('remove', (serviceName) => {
       if (serviceName.startsWith('chk_')) {
          onGameLost(serviceName); 
       }
    });
    
    zeroconf.scan('tcp', 'local.');
    isScanning = true;
  },

  /**
   * Stoppe le scan.
   */
  stopScanning: () => {
    if (isScanning) {
      zeroconf.stop();
      zeroconf.removeDeviceListeners();
      isScanning = false;
    }
  }
};
