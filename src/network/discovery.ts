import Zeroconf from 'react-native-zeroconf';
import { PORT_PAR_DEFAUT, SERVICE_DOMAIN, SERVICE_PROTOCOL, SERVICE_TYPE } from './protocol';

export interface PartieDecouverte {
  id: string;
  nom: string;
  hoteNom: string;
  hostIp: string;
  port: number;
  nbJoueurs: number;
  nbJoueursMax: number;
}

class ServiceDecouverte {
  private zeroconf: Zeroconf | null = null;
  private servicePublie: string | null = null;
  private partiesTrouvees = new Map<string, PartieDecouverte>();
  private onMiseAJourParties?: (parties: PartieDecouverte[]) => void;

  private getZeroconf(): Zeroconf {
    if (!this.zeroconf) {
      this.zeroconf = new Zeroconf();
    }
    return this.zeroconf;
  }

  /**
   * Publie la partie sur le réseau LAN via mDNS Zeroconf.
   */
  public publierPartie(options: {
    nomPartie: string;
    hoteNom: string;
    port?: number;
    nbJoueurs?: number;
    nbJoueursMax?: number;
  }): void {
    const z = this.getZeroconf();
    const port = options.port ?? PORT_PAR_DEFAUT;
    const serviceName = `checkgame-${Date.now()}`;

    const txtRecord = {
      nomPartie: options.nomPartie,
      hoteNom: options.hoteNom,
      nbJoueurs: String(options.nbJoueurs ?? 1),
      nbJoueursMax: String(options.nbJoueursMax ?? 6),
    };

    try {
      z.publishService(SERVICE_TYPE, SERVICE_PROTOCOL, SERVICE_DOMAIN, serviceName, port, txtRecord);
      this.servicePublie = serviceName;
    } catch (err) {
      console.warn('Erreur lors de la publication mDNS:', err);
    }
  }

  /**
   * Arrête la publication mDNS.
   */
  public arreterPublication(): void {
    if (this.servicePublie && this.zeroconf) {
      try {
        this.zeroconf.unpublishService(this.servicePublie);
      } catch (err) {
        console.warn('Erreur lors de l’arrêt mDNS:', err);
      }
      this.servicePublie = null;
    }
  }

  /**
   * Démarre la recherche active des parties sur le réseau LAN.
   */
  public demarrerScan(onUpdate: (parties: PartieDecouverte[]) => void): void {
    this.onMiseAJourParties = onUpdate;
    this.partiesTrouvees.clear();

    const z = this.getZeroconf();
    z.stop();
    z.removeAllListeners();

    z.on('resolved', (service: any) => {
      if (!service || !service.addresses || service.addresses.length === 0) return;
      const hostIp = service.addresses[0];
      const txt = service.txt || {};

      const partie: PartieDecouverte = {
        id: service.name,
        nom: txt.nomPartie ?? service.name ?? 'Partie sans nom',
        hoteNom: txt.hoteNom ?? 'Hôte inconnu',
        hostIp,
        port: service.port || PORT_PAR_DEFAUT,
        nbJoueurs: parseInt(txt.nbJoueurs ?? '1', 10),
        nbJoueursMax: parseInt(txt.nbJoueursMax ?? '6', 10),
      };

      this.partiesTrouvees.set(service.name, partie);
      this.onMiseAJourParties?.(Array.from(this.partiesTrouvees.values()));
    });

    z.on('removed', (service: any) => {
      if (service && service.name) {
        this.partiesTrouvees.delete(service.name);
        this.onMiseAJourParties?.(Array.from(this.partiesTrouvees.values()));
      }
    });

    z.on('error', (err: any) => {
      console.warn('Erreur Zeroconf scan:', err);
    });

    try {
      z.scan(SERVICE_TYPE, SERVICE_PROTOCOL, SERVICE_DOMAIN);
    } catch (err) {
      console.warn('Erreur au lancement du scan Zeroconf:', err);
    }
  }

  /**
   * Arrête le scan mDNS.
   */
  public arreterScan(): void {
    if (this.zeroconf) {
      try {
        this.zeroconf.stop();
        this.zeroconf.removeAllListeners();
      } catch (err) {
        console.warn('Erreur lors de l’arrêt du scan Zeroconf:', err);
      }
    }
    this.partiesTrouvees.clear();
  }
}

export const discoveryService = new ServiceDecouverte();
