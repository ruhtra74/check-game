import { creerPaquetComplet, estAs, estDeux, estJoker, estSept, estValet, melanger } from './deck';
import { validerConfig } from './config';
import type { Card, GameConfig, GameState, JoueurInfo, PlayerState, RotationSens } from './types';

const CARTES_INTERDITES_DEPART = (carte: Card): boolean =>
  estAs(carte) || estValet(carte) || estSept(carte) || estDeux(carte) || estJoker(carte);

/**
 * Construit l'ordre de jeu à partir du premier joueur et du sens choisi.
 * `joueurs` représente l'ordre "physique" de la table (ex. ordre d'arrivée
 * dans le lobby). Le sens horaire garde cet ordre, le sens antihoraire
 * l'inverse, tous deux en repartant du premier joueur désigné.
 */
export function construireOrdreJeu(
  joueurs: JoueurInfo[],
  premierJoueurId: string,
  sens: RotationSens
): string[] {
  const ids = joueurs.map((j) => j.id);
  const indexDepart = ids.indexOf(premierJoueurId);
  if (indexDepart === -1) {
    throw new Error(`premierJoueurId (${premierJoueurId}) introuvable parmi les joueurs fournis.`);
  }

  const premierIdPhysique = ids[0] as string;
  const ordreBase: string[] =
    sens === 'horaire' ? ids : [premierIdPhysique, ...ids.slice(1).reverse()];
  // On repart toujours physiquement de premierJoueurId en conservant la
  // direction choisie autour du cercle des joueurs.
  const indexDansOrdreBase = ordreBase.indexOf(premierJoueurId);
  return [...ordreBase.slice(indexDansOrdreBase), ...ordreBase.slice(0, indexDansOrdreBase)];
}

export interface InitMancheParams {
  joueurs: JoueurInfo[];
  config: GameConfig;
  premierJoueurId: string;
  sensRotation: RotationSens;
  maintenant?: number; // injectable pour les tests (timestamp de début de manche)
}

/**
 * Initialise une nouvelle manche : mélange, distribution, pile centrale.
 * Spec sections 1.2 (paquet), 1.3 (distribution), 1.4 (pile centrale), 1.5 (ordre).
 */
export function initManche(params: InitMancheParams): GameState {
  const { joueurs, config, premierJoueurId, sensRotation } = params;

  const validation = validerConfig({ ...config, nbJoueurs: joueurs.length });
  if (!validation.valide) {
    throw new Error(`Configuration invalide : ${validation.erreurs.join(' ')}`);
  }

  let paquet = melanger(creerPaquetComplet());

  // 1.3 Distribution des mains
  const mains = new Map<string, Card[]>();
  for (const joueur of joueurs) {
    mains.set(joueur.id, []);
  }
  for (let tour = 0; tour < config.nbCartesInitial; tour += 1) {
    for (const joueur of joueurs) {
      const carte = paquet.pop();
      if (!carte) {
        throw new Error('Paquet insuffisant pour la distribution — vérifier la configuration.');
      }
      mains.get(joueur.id)!.push(carte);
    }
  }

  // 1.4 Initialisation de la pile centrale, avec exclusion et remélange si besoin.
  let carteDepart: Card | undefined;
  // Sécurité anti-boucle infinie : si tout le paquet restant est constitué
  // uniquement de cartes interdites, on ne peut pas satisfaire la règle 1.4.
  // C'est un cas extrêmement improbable en pratique (il faudrait que toutes
  // les cartes normales de 3 à 10 / Q / K aient déjà été distribuées), mais
  // on le détecte pour éviter une boucle infinie plutôt que de planter.
  const tentativesMax = paquet.length + 1;
  let tentative = 0;
  while (!carteDepart && tentative <= tentativesMax) {
    tentative += 1;
    const candidate = paquet.pop();
    if (!candidate) break;
    if (CARTES_INTERDITES_DEPART(candidate)) {
      paquet.push(candidate);
      paquet = melanger(paquet);
    } else {
      carteDepart = candidate;
    }
  }

  if (!carteDepart) {
    throw new Error(
      "Impossible d'initialiser la pile centrale : aucune carte valide disponible (configuration extrême)."
    );
  }

  const joueursState: PlayerState[] = joueurs.map((j) => ({
    id: j.id,
    nom: j.nom,
    main: mains.get(j.id)!,
    qualifie: false,
  }));

  const ordreJoueursIds = construireOrdreJeu(joueurs, premierJoueurId, sensRotation);

  return {
    config,
    joueurs: joueursState,
    ordreJoueursIds,
    indexJoueurActif: 0,
    sensRotation,
    pileCentrale: [carteDepart],
    banque: paquet,
    compteurAttaque: 0,
    enseigneCommandee: null,
    joueurEnAttenteChoixEnseigne: null,
    phase: 'enCours',
    raisonBlocage: null,
    perdantId: null,
    joueursEliminesParVote: null,
    debutMancheTimestamp: params.maintenant ?? Date.now(),
    finMancheTimestamp: null,
    evenements: [],
  };
}