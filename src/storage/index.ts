import { DEFAULT_ACCENT_HEX } from '../theme/tokens';
import type { GameConfig } from '../engine';

// Fallback en mémoire pour supporter la démo dans Expo Go (qui n'inclut pas
// les modules C++ natifs de react-native-mmkv). Passera par MMKV réel dès
// qu'on build avec un Dev Client (nécessaire de toute façon pour la Phase 4 réseau).
class MemoryStorage {
  private data = new Map<string, string>();
  id = 'app-storage';
  length = 0;
  size = 0;
  byteSize = 0;
  isReadOnly = false;
  isEncrypted = false;

  set(key: string, value: boolean | string | number | ArrayBuffer): void {
    if (value instanceof ArrayBuffer) {
      return;
    }
    this.data.set(key, String(value));
    this.length = this.data.size;
  }
  getBoolean(key: string): boolean | undefined {
    const val = this.data.get(key);
    if (val === undefined) return undefined;
    return val === 'true';
  }
  getString(key: string): string | undefined {
    return this.data.get(key);
  }
  getNumber(key: string): number | undefined {
    const val = this.data.get(key);
    if (val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }
  getBuffer(_key: string): ArrayBuffer | undefined {
    return undefined;
  }
  contains(key: string): boolean {
    return this.data.has(key);
  }
  remove(key: string): boolean {
    const res = this.data.delete(key);
    this.length = this.data.size;
    return res;
  }
  getAllKeys(): string[] {
    return Array.from(this.data.keys());
  }
  clearAll(): void {
    this.data.clear();
    this.length = 0;
  }
  trim(): void {}
  checkContentChanged(): void {}
  addOnValueChangedListener(_onValueChanged: (key: string) => void) {
    return { remove: () => {} };
  }
}

function initStorage(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createMMKV } = require('react-native-mmkv');
    return createMMKV({ id: 'app-storage' });
  } catch (error) {
    console.warn(
      "[Storage] Impossible d'initialiser react-native-mmkv (attendu sous Expo Go, car les modules C++ natifs manquent). " +
        'Utilisation du fallback en mémoire (les préférences/stats seront réinitialisées à chaque rechargement) :',
      error
    );
    return new MemoryStorage();
  }
}

export const storage = initStorage();

const KEYS = {
  pseudo: 'profile.pseudo',
  avatarId: 'profile.avatarId',
  playerUuid: 'profile.uuid',
  accentColor: 'preferences.accentColor',
  language: 'preferences.language',
  vibrations: 'preferences.vibrations',
  stats: 'profile.stats',
  favoriteConfigs: 'game.favoriteConfigs',
  gameConfig: 'game.defaultConfig',
} as const;

/**
 * Config de jeu par défaut de cet appareil. Utilisée comme point de départ
 * quand on est hôte : avant chaque partie, ces valeurs seront re-proposées
 * (et modifiables) dans le lobby, plutôt que redemandées de zéro à chaque
 * fois. Valeurs initiales alignées sur celles vues dans la maquette du lobby.
 */
export const GAME_CONFIG_DEFAUT: GameConfig = {
  nbJoueurs: 4,
  nbCartesInitial: 6,
  jPassePartout: true,
  penaliteSept: 2,
  penaliteJoker: 4,
  sensRotationParDefaut: 'horaire',
};

export interface PlayerStats {
  partiesJouees: number;
  victoires: number;
  tournoisGagnes: number;
}

const STATS_DEFAUT: PlayerStats = { partiesJouees: 0, victoires: 0, tournoisGagnes: 0 };

function genererUuid(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function lireJson<T>(cle: string, valeurParDefaut: T): T {
  const brut = storage.getString(cle);
  if (!brut) return valeurParDefaut;
  try {
    return JSON.parse(brut) as T;
  } catch {
    return valeurParDefaut;
  }
}

export const appStorage = {
  getPseudo(): string | null {
    return storage.getString(KEYS.pseudo) ?? null;
  },
  setPseudo(pseudo: string): void {
    storage.set(KEYS.pseudo, pseudo);
  },

  getAvatarId(): string | null {
    return storage.getString(KEYS.avatarId) ?? null;
  },
  setAvatarId(avatarId: string): void {
    storage.set(KEYS.avatarId, avatarId);
  },

  getPlayerUuid(): string {
    const existant = storage.getString(KEYS.playerUuid);
    if (existant) return existant;
    const nouveau = genererUuid();
    storage.set(KEYS.playerUuid, nouveau);
    return nouveau;
  },

  getAccentColor(): string {
    return storage.getString(KEYS.accentColor) ?? DEFAULT_ACCENT_HEX;
  },
  setAccentColor(hex: string): void {
    storage.set(KEYS.accentColor, hex);
  },

  getLanguage(): 'fr' | 'en' {
    return (storage.getString(KEYS.language) as 'fr' | 'en' | undefined) ?? 'fr';
  },
  setLanguage(langue: 'fr' | 'en'): void {
    storage.set(KEYS.language, langue);
  },

  getVibrationsEnabled(): boolean {
    const v = storage.getBoolean(KEYS.vibrations);
    return v ?? true;
  },
  setVibrationsEnabled(actif: boolean): void {
    storage.set(KEYS.vibrations, actif);
  },

  getStats(): PlayerStats {
    return lireJson(KEYS.stats, STATS_DEFAUT);
  },
  setStats(stats: PlayerStats): void {
    storage.set(KEYS.stats, JSON.stringify(stats));
  },

  getFavoriteConfigs<T>(): T[] {
    return lireJson<T[]>(KEYS.favoriteConfigs, []);
  },
  setFavoriteConfigs<T>(configs: T[]): void {
    storage.set(KEYS.favoriteConfigs, JSON.stringify(configs));
  },

  /** Config de jeu par défaut de l'hôte (nombre de joueurs, cartes, règles spéciales...). */
  getGameConfig(): GameConfig {
    return lireJson<GameConfig>(KEYS.gameConfig, GAME_CONFIG_DEFAUT);
  },
  setGameConfig(config: GameConfig): void {
    storage.set(KEYS.gameConfig, JSON.stringify(config));
  },
};