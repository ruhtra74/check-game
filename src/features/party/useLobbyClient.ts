import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appStorage } from '../../storage';
import { emojiPourAvatarId } from '../onboarding/avatarOptions';
import { ClientTCP } from '../../network/client';
import { PORT_PAR_DEFAUT } from '../../network/protocol';
import type { EtatLobby } from './types';

interface OptionsLobbyClient {
  hostIp: string;
  port?: number;
  nomPartie: string;
  hoteNom: string;
}

export function useLobbyClient({ hostIp, port = PORT_PAR_DEFAUT, nomPartie, hoteNom }: OptionsLobbyClient) {
  const monId = useMemo(() => appStorage.getPlayerUuid(), []);
  const monPseudo = useMemo(() => appStorage.getPseudo() ?? 'Invité', []);
  const monEmoji = useMemo(() => emojiPourAvatarId(appStorage.getAvatarId()), []);

  const [etat, setEtat] = useState<EtatLobby>(() => ({
    nomPartie,
    config: appStorage.getGameConfig(),
    joueurs: [
      { id: 'hote', pseudo: hoteNom, estHote: true, selectionne: true, pret: false },
      { id: monId, pseudo: monPseudo, emoji: monEmoji, estHote: false, selectionne: true, pret: false },
    ],
    phase: 'attenteJoueurs',
  }));

  const [hoteDeconnecte, setHoteDeconnecte] = useState<string | null>(null);
  const clientRef = useRef<ClientTCP | null>(null);

  useEffect(() => {
    const client = new ClientTCP({
      hostIp,
      port,
      clientId: monId,
      pseudo: monPseudo,
      emoji: monEmoji,
      onMessage: (msg) => {
        if (msg.type === 'LOBBY_STATE') {
          setEtat(msg.etat);
        }
      },
      onDeconnecte: (raison) => {
        setHoteDeconnecte(raison ?? "L'hôte a interrompu la partie.");
      },
      onError: (err) => {
        console.error('Erreur Client TCP:', err);
        setHoteDeconnecte("Erreur de connexion avec l'hôte.");
      },
    });

    clientRef.current = client;
    client.connecter().catch((err) => {
      console.error('Erreur connexion client TCP:', err);
      setHoteDeconnecte("Impossible de se connecter à l'hôte.");
    });

    return () => {
      client.deconnecter();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostIp, port, monId, monPseudo, monEmoji]);

  const basculerSelection = useCallback((_joueurId: string) => {
    // Les invités ne modifient pas la sélection des joueurs (réservé à l'hôte)
  }, []);

  const modifierConfig = useCallback((_patch: any) => {
    // Les invités ne modifient pas la config (réservé à l'hôte)
  }, []);

  const demarrerPartie = useCallback(() => {
    // Seul l'hôte déclenche le démarrage
  }, []);

  const confirmerPret = useCallback(
    (valeur: boolean) => {
      if (clientRef.current) {
        clientRef.current.envoyer({ type: 'READY', pret: valeur });
      }
    },
    []
  );

  const joueursSelectionnes = etat.joueurs.filter((j) => j.selectionne);
  const tousPrets =
    etat.phase === 'confirmationDemarrage' &&
    joueursSelectionnes.length > 0 &&
    joueursSelectionnes.every((j) => j.pret);

  return {
    etat,
    monId,
    basculerSelection,
    modifierConfig,
    demarrerPartie,
    confirmerPret,
    joueursSelectionnes,
    tousPrets,
    hoteDeconnecte,
    client: clientRef.current,
  };
}
