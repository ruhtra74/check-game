import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appStorage } from '../../storage';
import type { GameConfig } from '../../engine';
import { emojiPourAvatarId } from '../onboarding/avatarOptions';
import { ServeurTCP } from '../../network/server';
import { discoveryService } from '../../network/discovery';
import { PORT_PAR_DEFAUT } from '../../network/protocol';
import type { EtatLobby, JoueurLobby } from './types';

interface OptionsLobbyReseauHote {
  nomPartie: string;
  port?: number;
  joueursExistants?: { id: string; pseudo: string; emoji?: string }[];
}

export function useLobbyReseauHote({ nomPartie, port = PORT_PAR_DEFAUT, joueursExistants }: OptionsLobbyReseauHote) {
  const monId = useMemo(() => appStorage.getPlayerUuid(), []);
  const monPseudo = useMemo(() => appStorage.getPseudo() ?? 'Hôte', []);
  const monEmoji = useMemo(() => emojiPourAvatarId(appStorage.getAvatarId()), []);

  const [etat, setEtat] = useState<EtatLobby>(() => {
    const config = appStorage.getGameConfig();
    let joueurs: JoueurLobby[];

    if (joueursExistants && joueursExistants.length > 0) {
      joueurs = joueursExistants.map((j) => ({
        id: j.id,
        pseudo: j.pseudo,
        emoji: j.emoji,
        estHote: j.id === monId,
        selectionne: true,
        pret: false,
      }));
      if (!joueurs.some((j) => j.id === monId)) {
        joueurs = [
          { id: monId, pseudo: monPseudo, emoji: monEmoji, estHote: true, selectionne: true, pret: false },
          ...joueurs,
        ];
      }
    } else {
      joueurs = [{ id: monId, pseudo: monPseudo, emoji: monEmoji, estHote: true, selectionne: true, pret: false }];
    }

    return { nomPartie, config, joueurs, phase: 'attenteJoueurs' };
  });

  const [hoteErreur, setHoteErreur] = useState<string | null>(null);
  const serveurRef = useRef<ServeurTCP | null>(null);

  // Broadcast systématique dès que etat change
  useEffect(() => {
    if (serveurRef.current) {
      serveurRef.current.broadcast({ type: 'LOBBY_STATE', etat });
    }
  }, [etat]);

  // Initialisation du serveur TCP + publication mDNS
  useEffect(() => {
    const serveur = new ServeurTCP({
      port,
      onClientConnecte: (clientId, pseudo, emoji) => {
        setEtat((actuel) => {
          if (actuel.joueurs.some((j) => j.id === clientId)) return actuel;
          const nouveau: JoueurLobby = {
            id: clientId,
            pseudo,
            emoji,
            estHote: false,
            selectionne: true,
            pret: false,
          };
          return { ...actuel, joueurs: [...actuel.joueurs, nouveau] };
        });
      },
      onClientDeconnecte: (clientId) => {
        setEtat((actuel) => ({
          ...actuel,
          joueurs: actuel.joueurs.filter((j) => j.id !== clientId),
        }));
      },
      onMessage: (clientId, message) => {
        if (message.type === 'READY') {
          setEtat((actuel) => ({
            ...actuel,
            joueurs: actuel.joueurs.map((j) => (j.id === clientId ? { ...j, pret: message.pret } : j)),
          }));
        } else if (message.type === 'LEAVE') {
          setEtat((actuel) => ({
            ...actuel,
            joueurs: actuel.joueurs.filter((j) => j.id !== clientId),
          }));
        }
      },
      onError: (err) => {
        console.error('Erreur Serveur TCP:', err);
        setHoteErreur("Erreur réseau du serveur de la partie.");
      },
    });

    serveurRef.current = serveur;
    serveur
      .demarrer()
      .then(() => {
        discoveryService.publierPartie({
          nomPartie,
          hoteNom: monPseudo,
          port,
          nbJoueurs: etat.joueurs.length,
          nbJoueursMax: 6,
        });
      })
      .catch((err) => {
        console.error('Erreur démarrage serveur TCP:', err);
        setHoteErreur("Impossible d'ouvrir le port réseau pour héberger.");
      });

    return () => {
      discoveryService.arreterPublication();
      serveur.arreter();
      serveurRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomPartie, port]);

  // Recalcul automatique de nbJoueurs quand la liste de joueurs évolue
  useEffect(() => {
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
  }, [etat.joueurs]);

  const basculerSelection = useCallback((joueurId: string) => {
    setEtat((actuel) => ({
      ...actuel,
      joueurs: actuel.joueurs.map((j) => (j.id === joueurId && !j.estHote ? { ...j, selectionne: !j.selectionne } : j)),
    }));
  }, []);

  const modifierConfig = useCallback((patch: Partial<GameConfig>) => {
    setEtat((actuel) => {
      const next: GameConfig = { ...actuel.config, ...patch };
      const maxCartes = Math.floor(52 / next.nbJoueurs);
      if (next.nbCartesInitial > maxCartes) next.nbCartesInitial = maxCartes;
      return { ...actuel, config: next };
    });
  }, []);

  const demarrerPartie = useCallback(() => {
    setEtat((actuel) => {
      if (actuel.phase !== 'attenteJoueurs') return actuel;
      return {
        ...actuel,
        phase: 'confirmationDemarrage',
        joueurs: actuel.joueurs.map((j) => (j.estHote ? { ...j, pret: true } : j)),
      };
    });
  }, []);

  const confirmerPret = useCallback(
    (valeur: boolean) => {
      setEtat((actuel) => ({
        ...actuel,
        joueurs: actuel.joueurs.map((j) => (j.id === monId ? { ...j, pret: valeur } : j)),
      }));
    },
    [monId]
  );

  const joueursSelectionnes = etat.joueurs.filter((j) => j.selectionne);
  const tousPrets =
    etat.phase === 'confirmationDemarrage' &&
    joueursSelectionnes.length > 0 &&
    joueursSelectionnes.every((j) => j.pret);

  useEffect(() => {
    if (tousPrets) {
      setEtat((actuel) => (actuel.phase === 'partieLancee' ? actuel : { ...actuel, phase: 'partieLancee' }));
    }
  }, [tousPrets]);

  return {
    etat,
    monId,
    basculerSelection,
    modifierConfig,
    demarrerPartie,
    confirmerPret,
    joueursSelectionnes,
    tousPrets,
    hoteErreur,
    serveur: serveurRef.current,
  };
}
