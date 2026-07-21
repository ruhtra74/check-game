export interface PartieDecouverte {
  id: string;
  nom: string;
  hoteNom: string;
  nbJoueurs: number;
  nbJoueursMax: number;
}

const NOMS_MOCK = ['Bob', 'Chloé', 'Sophie', 'John', 'Léa', 'Marc', 'Nina', 'Tom', 'Ines', 'Sam'];
const EMOJIS_MOCK = ['🐱', '🦊', '🐼', '🦁', '🐨', '🐧', '🐲', '🐙'];

/**
 * Simule la découverte de parties sur le réseau local. Sera remplacé en
 * Phase 4 par une vraie découverte mDNS — l'écran RejoindrePartieScreen ne
 * changera pas, seule cette fonction sera remplacée.
 */
export function listerPartiesDecouvertes(): PartieDecouverte[] {
  return [
    { id: 'p1', nom: "Partie d'Alex", hoteNom: 'Alex', nbJoueurs: 2, nbJoueursMax: 6 },
    { id: 'p2', nom: 'Soirée du vendredi', hoteNom: 'Sophie', nbJoueurs: 4, nbJoueursMax: 8 },
    { id: 'p3', nom: 'Partie rapide', hoteNom: 'Marc', nbJoueursMax: 4, nbJoueurs: 3 },
  ];
}

/** Génère un joueur fictif dont le pseudo n'est pas déjà pris dans la liste fournie. */
export function genererJoueurMock(pseudosExistants: string[]): { pseudo: string; emoji: string } {
  const disponibles = NOMS_MOCK.filter((n) => !pseudosExistants.includes(n));
  const pool = disponibles.length > 0 ? disponibles : NOMS_MOCK;
  const pseudo = pool[Math.floor(Math.random() * pool.length)] as string;
  const emoji = EMOJIS_MOCK[Math.floor(Math.random() * EMOJIS_MOCK.length)] as string;
  return { pseudo, emoji };
}