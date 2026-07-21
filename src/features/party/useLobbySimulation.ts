import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appStorage } from '../../storage';
import type { GameConfig } from '../../engine';
import { emojiPourAvatarId } from '../onboarding/avatarOptions';
import { genererJoueurMock } from './mockPartyService';
import type { EtatLobby, JoueurLobby } from './types';

interface OptionsLobby {
  mode: 'hote' | 'invite';
  nomPartie: string;
  /** Pseudo de l'hôte fictif, uniquement utilisé en mode invite. */
  hoteNomSiInvite?: string;
}

/**
 * Pilote tout le cycle de vie du lobby : arrivée progressive de joueurs
 * fictifs, sélection des participants par l'hôte, et phase de confirmation
 * de démarrage. Aucun réseau réel ici — tout est simulé avec des timers, en
 * attendant la vraie synchronisation LAN (Phase 4). Les écrans qui
 * consomment ce hook n'auront pas à changer à ce moment-là.
 */
export function useLobbySimulation({ mode, nomPartie, hoteNomSiInvite }: OptionsLobby) {
  const monId = useMemo(() => appStorage.getPlayerUuid(), []);
  const monPseudo = useMemo(() => appStorage.getPseudo() ?? 'Joueur', []);
  const monEmoji = useMemo(() => emojiPourAvatarId(appStorage.getAvatarId()), []);

  const [etat, setEtat] = useState<EtatLobby>(() => {
    const config = appStorage.getGameConfig();
    const joueurs: JoueurLobby[] =
      mode === 'hote'
        ? [{ id: monId, pseudo: monPseudo, emoji: monEmoji, estHote: true, selectionne: true, pret: false }]
        : [
            {
              id: 'hote-mock',
              pseudo: hoteNomSiInvite ?? 'Hôte',
              emoji: '😀',
              estHote: true,
              selectionne: true,
              pret: false,
            },
            { id: monId, pseudo: monPseudo, emoji: monEmoji, estHote: false, selectionne: true, pret: false },
          ];
    return { nomPartie, config, joueurs, phase: 'attenteJoueurs' };
  });

  // Combien de joueurs fictifs la simulation va faire arriver au total.
  // Purement pour rythmer la démo — n'a rien à voir avec config.nbJoueurs,
  // qui lui reflète le nombre RÉEL de joueurs (voir effet plus bas).
  const capaciteSimuleeRef = useRef(3 + Math.floor(Math.random() * 4)); // entre 3 et 6

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
        // L'hôte a initié le démarrage : ça vaut confirmation de sa part.
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

  // Simule l'arrivée progressive d'autres joueurs tant qu'on attend et que
  // la capacité simulée n'est pas atteinte. Indépendant de config.nbJoueurs
  // (voir capaciteSimuleeRef ci-dessus).
  useEffect(() => {
    if (etat.phase !== 'attenteJoueurs') return undefined;
    if (etat.joueurs.length >= capaciteSimuleeRef.current) return undefined;

    const t = setTimeout(() => {
      setEtat((actuel) => {
        if (actuel.phase !== 'attenteJoueurs' || actuel.joueurs.length >= capaciteSimuleeRef.current) {
          return actuel;
        }
        const { pseudo, emoji } = genererJoueurMock(actuel.joueurs.map((j) => j.pseudo));
        const nouveau: JoueurLobby = {
          id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pseudo,
          emoji,
          estHote: false,
          selectionne: true,
          pret: false,
        };
        return { ...actuel, joueurs: [...actuel.joueurs, nouveau] };
      });
    }, 1500 + Math.random() * 2500);

    timers.current.push(t);
    return () => clearTimeout(t);
  }, [etat.phase, etat.joueurs.length]);

  // En mode invité, on ne peut pas vraiment cliquer sur "Démarrer" en tant
  // qu'hôte (on ne l'est pas) : on simule que l'hôte fictif lance la partie
  // après un court délai, pour pouvoir tester l'écran de confirmation.
  useEffect(() => {
    if (mode !== 'invite' || etat.phase !== 'attenteJoueurs') return undefined;
    const t = setTimeout(() => demarrerPartie(), 3000 + Math.random() * 3000);
    timers.current.push(t);
    return () => clearTimeout(t);
  }, [mode, etat.phase, demarrerPartie]);

  // Simule les autres joueurs sélectionnés qui confirment automatiquement,
  // à des délais aléatoires, une fois la phase de confirmation lancée.
  useEffect(() => {
    if (etat.phase !== 'confirmationDemarrage') return undefined;
    const enAttente = etat.joueurs.filter((j) => j.selectionne && !j.pret && j.id !== monId);
    const nouveauxTimers = enAttente.map((joueur) =>
      setTimeout(() => {
        setEtat((actuel) => ({
          ...actuel,
          joueurs: actuel.joueurs.map((j) => (j.id === joueur.id ? { ...j, pret: true } : j)),
        }));
      }, 1000 + Math.random() * 2500)
    );
    timers.current.push(...nouveauxTimers);
    return () => nouveauxTimers.forEach(clearTimeout);
    // Volontairement limité à etat.phase : on ne veut programmer ces
    // confirmations qu'une seule fois, au moment où la phase démarre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.phase]);

  // nbJoueurs n'est pas une préférence : c'est le nombre réel de joueurs
  // connectés et sélectionnés par l'hôte. On le maintient à jour en
  // arrière-plan, sans jamais l'exposer comme un champ modifiable dans l'UI.
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

  const joueursSelectionnes = etat.joueurs.filter((j) => j.selectionne);
  const tousPrets =
    etat.phase === 'confirmationDemarrage' &&
    joueursSelectionnes.length > 0 &&
    joueursSelectionnes.every((j) => j.pret);

  // Transition finale une fois que tout le monde a confirmé.
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
  };
}