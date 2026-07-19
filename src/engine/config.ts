import type { GameConfig } from './types';
import { DEFAULT_GAME_CONFIG_PARTIAL } from './types';

export interface ConfigValidationResult {
  valide: boolean;
  erreurs: string[];
}

/**
 * Valide la configuration avant le lancement d'une partie.
 * Spec section 1.1, contrainte révisée en addendum section D :
 *   nbJoueurs * nbCartesInitial < 53 (au lieu de < 54, pour garantir une carte
 *   disponible pour initialiser la pile centrale après distribution).
 */
export function validerConfig(config: GameConfig): ConfigValidationResult {
  const erreurs: string[] = [];

  if (!Number.isInteger(config.nbJoueurs) || config.nbJoueurs < 2 || config.nbJoueurs > 10) {
    erreurs.push('nbJoueurs doit être un entier entre 2 et 10.');
  }

  if (!Number.isInteger(config.nbCartesInitial) || config.nbCartesInitial < 1) {
    erreurs.push('nbCartesInitial doit être un entier supérieur ou égal à 1.');
  }

  if (
    Number.isInteger(config.nbJoueurs) &&
    Number.isInteger(config.nbCartesInitial) &&
    config.nbJoueurs * config.nbCartesInitial >= 53
  ) {
    erreurs.push(
      `nbJoueurs (${config.nbJoueurs}) x nbCartesInitial (${config.nbCartesInitial}) doit être < 53.`
    );
  }

  if (!Number.isInteger(config.penaliteSept) || config.penaliteSept < 1) {
    erreurs.push('penaliteSept doit être un entier >= 1.');
  }

  if (!Number.isInteger(config.penaliteJoker) || config.penaliteJoker < 1) {
    erreurs.push('penaliteJoker doit être un entier >= 1.');
  }

  if (config.sensRotationParDefaut !== 'horaire' && config.sensRotationParDefaut !== 'antihoraire') {
    erreurs.push("sensRotationParDefaut doit être 'horaire' ou 'antihoraire'.");
  }

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Construit une config complète à partir des choix obligatoires de l'utilisateur
 * et des valeurs par défaut pour le reste (addendum section C).
 */
export function creerConfig(params: {
  nbJoueurs: number;
  nbCartesInitial: number;
  jPassePartout?: boolean;
  penaliteSept?: number;
  penaliteJoker?: number;
  sensRotationParDefaut?: GameConfig['sensRotationParDefaut'];
}): GameConfig {
  return {
    nbJoueurs: params.nbJoueurs,
    nbCartesInitial: params.nbCartesInitial,
    jPassePartout: params.jPassePartout ?? DEFAULT_GAME_CONFIG_PARTIAL.jPassePartout,
    penaliteSept: params.penaliteSept ?? DEFAULT_GAME_CONFIG_PARTIAL.penaliteSept,
    penaliteJoker: params.penaliteJoker ?? DEFAULT_GAME_CONFIG_PARTIAL.penaliteJoker,
    sensRotationParDefaut:
      params.sensRotationParDefaut ?? DEFAULT_GAME_CONFIG_PARTIAL.sensRotationParDefaut,
  };
}