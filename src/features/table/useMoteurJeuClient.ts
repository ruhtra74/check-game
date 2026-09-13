import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appStorage } from '../../storage';
import { emojiPourAvatarId } from '../onboarding/avatarOptions';
import { ClientTCP } from '../../network/client';
import { PORT_PAR_DEFAUT } from '../../network/protocol';
import type { GameConfig, GameState, Suit, TournoiState } from '../../engine';
import type { JoueurAffichage } from './useMoteurJeu';

interface OptionsMoteurClient {
  joueurs: JoueurAffichage[];
  config: GameConfig;
  hostIp: string;
  port?: number;
}

export function useMoteurJeuClient({ joueurs, config: configInitiale, hostIp, port = PORT_PAR_DEFAUT }: OptionsMoteurClient) {
  const monId = useMemo(() => appStorage.getPlayerUuid(), []);
  const monPseudo = useMemo(() => appStorage.getPseudo() ?? 'Invité', []);
  const monEmoji = useMemo(() => emojiPourAvatarId(appStorage.getAvatarId()), []);

  const infosAffichage = useMemo(() => new Map(joueurs.map((j) => [j.id, j])), [joueurs]);

  const [manche, setManche] = useState<GameState | null>(null);
  const [tournoi, setTournoi] = useState<TournoiState | null>(null);
  const [activeConfig, setActiveConfig] = useState<GameConfig>(configInitiale);
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
        if (msg.type === 'GAME_STATE') {
          setManche(msg.manche);
          setTournoi(msg.tournoi);
          setActiveConfig(msg.config);
        }
      },
      onDeconnecte: (raison) => {
        setHoteDeconnecte(raison ?? "L'hôte a interrompu la partie.");
      },
      onError: (err) => {
        console.error('Erreur Client TCP Jeu:', err);
        setHoteDeconnecte("Perte de connexion réseau avec l'hôte.");
      },
    });

    clientRef.current = client;
    client.connecter().catch((err) => {
      console.error('Erreur connexion client TCP Jeu:', err);
      setHoteDeconnecte("Impossible de se connecter à l'hôte.");
    });

    return () => {
      client.deconnecter();
      clientRef.current = null;
    };
  }, [hostIp, port, monId, monPseudo, monEmoji]);

  const jouerCarte = useCallback(
    (carteId: string) => {
      if (!manche || !clientRef.current) return;
      const joueurActifId = manche.ordreJoueursIds[manche.indexJoueurActif];
      if (joueurActifId !== monId) return;

      clientRef.current.envoyer({
        type: 'GAME_ACTION',
        action: {
          type: 'JOUER_CARTE',
          joueurId: monId,
          carteId,
          timestamp: Date.now(),
        },
      });
    },
    [manche, monId]
  );

  const partirEnBanque = useCallback(() => {
    if (!manche || !clientRef.current) return;
    const joueurActifId = manche.ordreJoueursIds[manche.indexJoueurActif];
    if (joueurActifId !== monId) return;

    clientRef.current.envoyer({
      type: 'GAME_ACTION',
      action: {
        type: 'PARTIR_EN_BANQUE',
        joueurId: monId,
        timestamp: Date.now(),
      },
    });
  }, [manche, monId]);

  const choisirEnseigne = useCallback(
    (enseigne: Suit) => {
      if (!manche || !clientRef.current) return;
      if (manche.joueurEnAttenteChoixEnseigne !== monId) return;

      clientRef.current.envoyer({
        type: 'GAME_ACTION',
        action: {
          type: 'CHOISIR_ENSEIGNE',
          joueurId: monId,
          enseigne,
          timestamp: Date.now(),
        },
      });
    },
    [manche, monId]
  );

  const terminerPartieBlocage = useCallback(() => {
    if (!manche || !clientRef.current) return;
    const joueurActifId = manche.ordreJoueursIds[manche.indexJoueurActif];
    if (joueurActifId !== monId) return;

    clientRef.current.envoyer({
      type: 'GAME_ACTION',
      action: {
        type: 'TERMINER_PARTIE_BLOCAGE',
        joueurId: monId,
        timestamp: Date.now(),
      },
    });
  }, [manche, monId]);

  const terminerMancheParVote = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.envoyer({
      type: 'DISQUALIFICATION_VOTE',
      voterId: monId,
    });
  }, [monId]);

  const continuerVersProchaineManche = useCallback(() => {
    // L'hôte gère la transition de manche et broadcaste le nouveau GAME_STATE
  }, []);

  const joueurActifId = manche ? manche.ordreJoueursIds[manche.indexJoueurActif] ?? null : null;

  return {
    tournoi,
    manche,
    config: activeConfig,
    joueurActifId,
    infosAffichage,
    jouerCarte,
    partirEnBanque,
    choisirEnseigne,
    terminerPartieBlocage,
    terminerMancheParVote,
    continuerVersProchaineManche,
    hoteDeconnecte,
  };
}
