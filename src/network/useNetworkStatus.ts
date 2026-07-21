import { useCallback, useEffect, useState } from 'react';
import * as Network from 'expo-network';

export interface EtatReseau {
  /** true si l'appareil est sur un réseau Wi-Fi (ou Ethernet) — nécessaire pour la découverte LAN. */
  surReseauLocal: boolean;
  type: Network.NetworkStateType | null;
  verificationEnCours: boolean;
}

/**
 * Vérifie si l'appareil est connecté à un réseau Wi-Fi (indispensable pour
 * jouer en local — la 4G/5G ne permet pas de découvrir d'autres appareils
 * sur le même réseau). Nécessite `expo-network` (`npx expo install
 * expo-network`) — fonctionne dans Expo Go, pas besoin de Dev Client pour
 * cette simple vérification d'état.
 */
export function useNetworkStatus(): EtatReseau & { rafraichir: () => void } {
  const [etat, setEtat] = useState<EtatReseau>({
    surReseauLocal: true, // optimiste par défaut, le temps de la première vérification
    type: null,
    verificationEnCours: true,
  });

  const verifier = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const type = state.type ?? null;
      const surReseauLocal =
        type === Network.NetworkStateType.WIFI || type === Network.NetworkStateType.ETHERNET;
      setEtat({ surReseauLocal, type, verificationEnCours: false });
    } catch {
      // Si la vérification échoue (permission, plateforme non supportée...),
      // on ne bloque pas l'utilisateur pour autant.
      setEtat({ surReseauLocal: true, type: null, verificationEnCours: false });
    }
  }, []);

  useEffect(() => {
    verifier();
  }, [verifier]);

  return { ...etat, rafraichir: verifier };
}