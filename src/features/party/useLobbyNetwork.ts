import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appStorage } from '../../storage';
import type { GameConfig } from '../../engine';
import { emojiPourAvatarId } from '../onboarding/avatarOptions';
import { NetworkManager } from '../../network/NetworkManager';
import { DiscoveryService } from '../../network/discovery';
import type { HostMessage } from '../../network/types';
import type { EtatLobby, JoueurLobby } from './types';

const PORT = 8080;

interface OptionsLobbyNetwork {
  mode: 'hote' | 'invite';
  nomPartie: string;
  hoteNomSiInvite?: string;
  hostIp?: string;
  hostPort?: number;
}

/**
 * Hook réseau réel pour le lobby. Remplace useLobbySimulation quand
 * estReseau est activé. L'hôte démarre un serveur TCP + annonce mDNS,
 * les clients se connectent et reçoivent l'état du lobby en temps réel.
 *
 * L'interface de retour est IDENTIQUE à useLobbySimulation pour que
 * LobbyScreen puisse les utiliser de manière interchangeable.
 */
export function useLobbyNetwork({ mode, nomPartie, hoteNomSiInvite, hostIp, hostPort }: OptionsLobbyNetwork) {
  const monId = useMemo(() => appStorage.getPlayerUuid(), []);
  const monPseudo = useMemo(() => appStorage.getPseudo() ?? 'Joueur', []);
  const monEmoji = useMemo(() => emojiPourAvatarId(appStorage.getAvatarId()), []);

  const [etat, setEtat] = useState<EtatLobby>(() => {
    const config = appStorage.getGameConfig();
    const joueurs: JoueurLobby[] =
      mode === 'hote'
        ? [{ id: monId, pseudo: monPseudo, emoji: monEmoji, estHote: true, selectionne: true, pret: false }]
        : [];
    return { nomPartie, config, joueurs, phase: 'attenteJoueurs' };
  });

  // -----------------------------------------------------------------------
  // Côté HÔTE : démarrage du serveur TCP + annonce mDNS
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'hote') return;

    const server = NetworkManager.initServer();

    server.setCallbacks(
      // onMessage : un client envoie un message
      (clientId, msg) => {
        switch (msg.type) {
          case 'JOIN_LOBBY': {
            setEtat((actuel) => {
              if (actuel.joueurs.some((j) => j.id === clientId)) return actuel;
              const nouveau: JoueurLobby = {
                id: clientId,
                pseudo: msg.payload.pseudo,
                emoji: msg.payload.emoji,
                estHote: false,
                selectionne: true,
                pret: false,
              };
              const mis = { ...actuel, joueurs: [...actuel.joueurs, nouveau] };
              server.sendTo(clientId, { type: 'WELCOME', payload: { clientId, hostId: monId } });
              broadcastLobbyState(mis);
              return mis;
            });
            break;
          }
          case 'SET_READY': {
            setEtat((actuel) => {
              const mis = {
                ...actuel,
                joueurs: actuel.joueurs.map((j) =>
                  j.id === clientId ? { ...j, pret: msg.payload.ready } : j
                ),
              };
              broadcastLobbyState(mis);
              return mis;
            });
            break;
          }
          case 'PING': {
            server.sendTo(clientId, { type: 'PONG' });
            break;
          }
          default:
            break;
        }
      },
      // onDisconnect : un client quitte
      (clientId) => {
        setEtat((actuel) => {
          const mis = { ...actuel, joueurs: actuel.joueurs.filter((j) => j.id !== clientId) };
          broadcastLobbyState(mis);
          return mis;
        });
      }
    );

    server
      .start(PORT)
      .then(() => {
        DiscoveryService.startPublishing(PORT, monId, nomPartie, monPseudo, 1);
      })
      .catch((err) => {
        console.warn('Impossible de démarrer le serveur réseau :', err);
      });

    // NOTE : on ne détruit PAS le serveur au démontage du lobby car
    // NetworkManager le conserve pour la phase de jeu (TableJeuScreen).
    // Le teardown global se fait au retour à l'accueil.
    return () => {
      DiscoveryService.stopPublishing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour l'annonce mDNS quand le nombre de joueurs change
  useEffect(() => {
    if (mode !== 'hote') return;
    DiscoveryService.startPublishing(PORT, monId, nomPartie, monPseudo, etat.joueurs.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.joueurs.length]);

  // -----------------------------------------------------------------------
  // Côté CLIENT : connexion TCP vers l'hôte
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'invite' || !hostIp) return;

    const client = NetworkManager.initClient();

    client.setCallbacks(
      (msg) => {
        switch (msg.type) {
          case 'LOBBY_STATE': {
            setEtat({
              nomPartie: msg.payload.nomPartie,
              config: msg.payload.config,
              joueurs: msg.payload.joueurs,
              phase: msg.payload.phase,
            });
            break;
          }
          case 'WELCOME':
          case 'PONG':
            break;
          default:
            break;
        }
      },
      () => { console.warn('Déconnecté de l\'hôte'); },
      (err) => { console.warn('Erreur réseau client :', err); }
    );

    client
      .connect(hostIp, hostPort ?? PORT)
      .then(() => {
        client.send({
          type: 'JOIN_LOBBY',
          payload: { pseudo: monPseudo, emoji: monEmoji, clientId: monId },
        });
      })
      .catch((err) => {
        console.warn('Impossible de se connecter à l\'hôte :', err);
      });

    // NOTE : on ne déconnecte PAS le client au démontage ; NetworkManager
    // le conserve pour la phase de jeu.
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Actions exposées (même signature que useLobbySimulation)
  // -----------------------------------------------------------------------

  const basculerSelection = useCallback(
    (joueurId: string) => {
      if (mode !== 'hote') return;
      setEtat((actuel) => {
        const mis = {
          ...actuel,
          joueurs: actuel.joueurs.map((j) =>
            j.id === joueurId && !j.estHote ? { ...j, selectionne: !j.selectionne } : j
          ),
        };
        broadcastLobbyState(mis);
        return mis;
      });
    },
    [mode]
  );

  const modifierConfig = useCallback(
    (patch: Partial<GameConfig>) => {
      if (mode !== 'hote') return;
      setEtat((actuel) => {
        const next: GameConfig = { ...actuel.config, ...patch };
        const maxCartes = Math.floor(52 / next.nbJoueurs);
        if (next.nbCartesInitial > maxCartes) next.nbCartesInitial = maxCartes;
        const mis = { ...actuel, config: next };
        broadcastLobbyState(mis);
        return mis;
      });
    },
    [mode]
  );

  const demarrerPartie = useCallback(() => {
    if (mode !== 'hote') return;
    setEtat((actuel) => {
      if (actuel.phase !== 'attenteJoueurs') return actuel;
      const mis = {
        ...actuel,
        phase: 'confirmationDemarrage' as const,
        joueurs: actuel.joueurs.map((j) => (j.estHote ? { ...j, pret: true } : j)),
      };
      broadcastLobbyState(mis);
      return mis;
    });
  }, [mode]);

  const confirmerPret = useCallback(
    (valeur: boolean) => {
      if (mode === 'hote') {
        setEtat((actuel) => {
          const mis = {
            ...actuel,
            joueurs: actuel.joueurs.map((j) => (j.id === monId ? { ...j, pret: valeur } : j)),
          };
          broadcastLobbyState(mis);
          return mis;
        });
      } else {
        NetworkManager.client?.send({ type: 'SET_READY', payload: { ready: valeur } });
      }
    },
    [mode, monId]
  );

  // -----------------------------------------------------------------------
  // Synchronisation nbJoueurs (comme useLobbySimulation)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'hote') return;
    setEtat((actuel) => {
      const nbReel = Math.max(actuel.joueurs.filter((j) => j.selectionne).length, 1);
      if (actuel.config.nbJoueurs === nbReel) return actuel;
      const maxCartes = Math.floor(52 / nbReel);
      return {
        ...actuel,
        config: {
          ...actuel.config,
          nbJoueurs: nbReel,
          nbCartesInitial: Math.min(actuel.config.nbCartesInitial, maxCartes),
        },
      };
    });
  }, [mode, etat.joueurs]);

  // Transition vers partieLancee quand tous prêts
  const joueursSelectionnes = etat.joueurs.filter((j) => j.selectionne);
  const tousPrets =
    etat.phase === 'confirmationDemarrage' &&
    joueursSelectionnes.length > 0 &&
    joueursSelectionnes.every((j) => j.pret);

  useEffect(() => {
    if (!tousPrets) return;
    setEtat((actuel) => {
      if (actuel.phase === 'partieLancee') return actuel;
      const mis = { ...actuel, phase: 'partieLancee' as const };
      if (mode === 'hote') broadcastLobbyState(mis);
      return mis;
    });
  }, [tousPrets, mode]);

  return {
    etat,
    monId,
    basculerSelection,
    modifierConfig,
    demarrerPartie,
    confirmerPret,
    joueursSelectionnes,
    tousPrets,
  };
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function broadcastLobbyState(etat: EtatLobby): void {
  const server = NetworkManager.server;
  if (!server) return;
  const message: HostMessage = {
    type: 'LOBBY_STATE',
    payload: {
      config: etat.config,
      joueurs: etat.joueurs,
      nomPartie: etat.nomPartie,
      phase: etat.phase,
    },
  };
  server.broadcast(message);
}
