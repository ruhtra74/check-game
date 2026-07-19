# Spécification Technique Complète et Rigoureuse : Moteur de Jeu de Cartes

Ce document définit de manière exhaustive les règles et la logique comportementale requises pour le développement algorithmique du moteur de jeu. Il intègre toutes les contraintes de flux, d'états de jeu et de cas particuliers pour permettre un codage direct par une Intelligence Artificielle.

---

## 1. Initialisation et Configuration de la Partie

### 1.1 Paramètres d'Entrée et Variables de Configuration
Le moteur de jeu doit récupérer deux paramètres modifiables depuis la configuration choisie par les utilisateurs avant le lancement :
*   `NB_JOUEURS` : Entier représentant le nombre de participants. Configuration acceptée : minimum 2, maximum 10 joueurs.
*   `NB_CARTES_INITIAL` : Entier représentant le nombre initial de cartes distribuées à chaque joueur (noté $x$).

**Contrainte d'Intégrité :** Avant de lancer la distribution, le système doit impérativement valider l'équation de faisabilité suivante :
`NB_JOUEURS` X `NB_CARTES_INITIAL` < 54
Si cette condition n'est pas remplie, le moteur doit lever une erreur de configuration empêchant le début de la partie.

### 1.2 Constitution et Mélange du Paquet
*   Le jeu utilise un paquet standard de 54 cartes.
*   Il est composé de 4 enseignes de 13 cartes chacune (As, 2, 3, 4, 5, 6, 7, 8, 9, 10, Valet [J], Dame [Q], Roi [K] pour Pique, Coeur, Trèfle, Carreau).
*   Il intègre exactement 2 Jokers distincts : un Joker Noir et un Joker Rouge.
*   Au début de la partie, l'algorithme doit appliquer un mélange aléatoire complet sur le tableau représentant ce paquet de 54 cartes.

### 1.3 Distribution des Mains
*   Chaque joueur reçoit séquentiellement un nombre de cartes égal à `NB_CARTES_INITIAL`.
*   Ces cartes sont stockées dans la structure de données locale de chaque joueur : `Main_Joueur[i]`.

### 1.4 Initialisation de la Pile Centrale (Défausse)
Une fois les mains distribuées, une carte est extraite du lot restant (la banque/pioche) et déposée face visible au centre pour constituer la base de la `Pile_Centrale`.
*   **Restriction Stricte de Départ :** Cette première carte ne peut en aucun cas être l'une des cartes suivantes :
    *   Un As
    *   Un Valet (J)
    *   Un 7
    *   Un 2
    *   Un Joker (Noir ou Rouge)
*   **Algorithme de validation :** Si la carte tirée fait partie de cette liste d'exclusion, le moteur de jeu doit obligatoirement la réinsérer dans le paquet de pioche restant, exécuter un nouveau mélange complet du paquet, et extraire une nouvelle carte. Cette boucle se répète jusqu'à l'obtention d'une carte de départ valide (une carte normale de 3 à 10, ou une figure Dame/Roi).

### 1.5 Ordre de Passage Initial
*   Le choix du premier joueur (`Joueur_Actif`) est déterminé dynamiquement par les joueurs via un vote (par exemple, le premier à répondre). Le système reçoit l'identifiant du gagnant comme paramètre d'entrée.
*   Le sens de rotation du jeu est défini par un second vote unique juste après. Deux options exclusives sont configurables :
    *   **Sens Horaire :** Le joueur suivant est celui situé directement à la gauche du joueur actuel.
    *   **Sens Anti-horaire :** Le joueur suivant est celui situé directement à la droite du joueur actuel.
*   Une fois ces deux choix validés par le système, la liste ordonnée des joueurs est fixée pour le reste de la manche.

---

## 2. Déroulement d'un Tour Standard et Actions Possibles

À son tour de jeu, le `Joueur_Actif` fait face à la carte visible située tout au sommet de la `Pile_Centrale`. Il dispose de deux options exclusives :

### 2.1 Action A : Déposer une carte (Jouer)
Le joueur sélectionne une carte de sa main. Pour être acceptée par le moteur, cette carte doit remplir l'un des critères de correspondance standards suivants (sauf cas des cartes spéciales détaillées en section 4) :
*   **Correspondance d'Enseigne (Couleur graphique) :** La carte jouée a exactement la même enseigne que la carte au sommet de la pile (ex. poser un Pique sur un Pique, un Coeur sur un Coeur, etc.).
*   **Correspondance de Valeur (Numéro/Figure) :** La carte jouée a la même valeur numérique ou nominale que la carte au sommet de la pile, indépendamment de son enseigne (ex. poser un 5 de Trèfle sur un 5 de Carreau).

Si la carte est validée, elle est retirée de `Main_Joueur` et empilée au sommet de `Pile_Centrale`. Le tour du joueur se termine immédiatement, et la main passe au joueur suivant selon le sens établi.

### 2.2 Action B : Partir en Banque (Piocher volontairement)
*   Un joueur peut choisir à tout moment de "partir en banque", c'est-à-dire de tirer la carte supérieure du paquet de pioche restant et de l'ajouter à sa main.
*   **Règle d'autorisation stratégique :** Le joueur possède le droit absolu de partir en banque de manière volontaire, même s'il possède en main une ou plusieurs cartes parfaitement valides et jouables sur la pile centrale.
*   **Conséquence immédiate :** L'action de partir en banque met un terme définitif et immédiat au tour du joueur actuel. Il ne peut pas jouer la carte qu'il vient de piocher. Le tour passe directement au joueur suivant.

---

## 3. Gestion Automatique de la Banque Vide (Recyclage de la Défausse)

Le moteur de jeu doit surveiller en permanence l'état quantitatif du paquet de pioche (la banque).
*   Si un joueur déclenche une action de pioche (volontaire ou punitive) alors que la banque est vide (0 carte), ou si la banque se vide au cours d'une distribution de pénalité multi-cartes, le système applique la routine d'urgence automatique suivante :
    1.  Le système identifie et isole la carte visible située tout au sommet de la `Pile_Centrale`. Cette carte doit rester en place au centre pour servir de repère au jeu en cours.
    2.  Le système extrait l'intégralité des cartes situées en dessous de cette carte supérieure dans la `Pile_Centrale`.
    3.  Ces cartes récupérées sont transférées pour former le nouveau paquet de banque.
    4.  L'algorithme applique un mélange aléatoire complet sur ce nouveau paquet.
    5.  Si le joueur était au milieu d'une pioche punitive (ex. devoir piocher 6 cartes et la banque s'est vidée après la 2ème carte), le moteur reprend et termine la distribution des cartes manquantes à partir de la banque fraîchement reconstituée.

---

## 4. Logique Algorithmique des Cartes Spéciales

Les cartes spéciales modifient les règles standards d'association ou altèrent le flux normal du jeu.

### 4.1 Le 2 (Le "2 Passe-partout")
*   **Condition de pose :** Le 2 peut être joué par un joueur à tout moment de son tour, peu importe l'enseigne (couleur) ou la valeur de la carte située au sommet de la pile centrale. Il n'y a aucune restriction de correspondance.
*   **Effet de placement unique :** Lorsqu'un 2 est validé, l'algorithme ne le place pas au sommet de la défausse. Au contraire, il l'insère tout en dessous, à la base de la `Pile_Centrale`.
*   **Conséquence sur le jeu :** La carte visible au sommet de la pile centrale reste rigoureusement inchangée. De ce fait, le joueur suivant doit jouer son tour en respectant la couleur et la valeur de cette même carte supérieure qui était présente avant la pose du 2.

### 4.2 Le Valet (Le "J Commande")
*   **Condition de pose :** Il suit les règles standards (doit correspondre à l'enseigne de la carte du centre ou être posé sur un autre Valet) A moins que dans les parametre, l'option `J_passe_partout` est été activé, à ce moment, il peut être déposé sur n'importe qu'elle couleur ou numéro de carte de la `Pile_Centrale`.
*   **Effet d'interruption :** Dès qu'un Valet est déposé, le moteur suspend le flux et force le joueur à sélectionner une enseigne cible parmi les quatre disponibles (Pique, Coeur, Trèfle, Carreau).
*   **Conséquence sur le jeu :** Le joueur suivant est soumis à l'ordre du Valet. Il est dans l'obligation de jouer une carte correspondant à l'enseigne décidée par le joueur précédent, ou de poser à son tour un autre Valet pour changer à nouveau la commande.

### 4.3 L'As (Le "As Stop")
*   **Condition de pose :** Il suit les règles standards (doit correspondre à l'enseigne de la carte du centre ou être posé sur un autre As).
*   **Effet sur le flux :** Le dépôt d'un As annule purement et simplement le tour du joueur qui devait normalement parler après. Le système applique un saut d'index dans la liste des joueurs actifs.
*   **Cas particulier à 2 joueurs :** Si la partie ne comporte que deux joueurs, l'effet de saut de l'As fait sauter le tour de l'unique adversaire. En conséquence, la boucle système redonne immédiatement la main au joueur qui vient de poser l'As, lui permettant d'aligner une deuxième carte. Il peut donc superposer plusieurs As à la suite s'il en possède plusieurs dans sa main, appliquant autant de sauts de tours consécutifs.

### 4.4 Le 7 et les Jokers (Mécanique d'Accumulation de l'Attaque)
Ces cartes déclenchent une mécanique d'attaque cumulative basée sur une variable interne du moteur appelée `Compteur_Attaque` (initialisée à 0).

#### A. Règles de compatibilité et de pose initiale
*   **Le 7 :** En temps normal, un 7 respecte les règles classiques (se pose sur la même enseigne ou sur un autre 7).
*   **Le Joker Noir :** Ne peut être joué de manière standard que si la carte au sommet de la pile est de couleur noire (Pique ou Trèfle).
*   **Le Joker Rouge :** Ne peut être joué de manière standard que si la carte au sommet de la pile est de couleur rouge (Coeur ou Carreau).
*   **Compatibilité Totale d'Attaque (Surenchère) :** Dès que le `Compteur_Attaque > 0` (une attaque est active), les restrictions standards d'enseignes et de couleurs de Jokers sont totalement désactivées pour les cartes de riposte. **Toutes les cartes qui font aller en banque sont compatibles entre elles.** Un joueur peut poser un Joker Noir sur un 7 de Coeur, ou un 7 de Pique sur un Joker Rouge, sans aucune contrainte de couleur.

#### B. Valeurs de Pénalité et Cumul
*   Jouer un 7 ajoute $+2$ au `Compteur_Attaque`.
*   Jouer un Joker ajoute $+4$ au `Compteur_Attaque`.
*   Lorsqu'un joueur dépose une de ces cartes, son tour s'arrête et la menace est transmise au joueur suivant avec la nouvelle valeur cumulée (la somme de toutes les cartes d'attaque jouées d'affilée).

#### C. Résolution de l'Attaque et Déroulement Spécial du Tour
Lorsqu'un joueur commence son tour alors que le `Compteur_Attaque > 0`, il fait face à une alternative exclusive :
1.  **Surenchérir :** Poser immédiatement un autre 7 ou un Joker (en profitant de la règle de compatibilité totale). Cela augmente le compteur et passe le tour au joueur suivant.
2.  **Encaisser et Partir en Banque Péniblement :** Si le joueur ne peut pas ou ne souhaite pas contrer l'attaque, il doit subir la pénalité. Le moteur lui distribue un nombre de cartes égal à la valeur exacte du `Compteur_Attaque`. Le `Compteur_Attaque` est alors réinitialisé à 0.
    *   **Règle d'enchaînement CRITIQUE :** Contrairement à une pioche volontaire, **le tour du joueur n'est pas fini après avoir encaissé la pioche punitive**. Le joueur bascule immédiatement dans une phase de jeu normale à l'intérieur de son propre tour. Il doit alors analyser sa nouvelle main et accomplir une action standard : soit déposer une carte valide sur la pile centrale, soit repartir volontairement en banque (ce qui, cette fois-ci, mettrait fin à son tour).

#### D. Sortie de Crise après un Joker
Si un joueur a été contraint de partir en banque à cause d'un Joker, le `Compteur_Attaque` repasse à 0 mais le Joker reste positionné tout au sommet de la pile centrale. Pour le joueur suivant (qui bénéficie d'un retour à la normale), le moteur lui offre la liberté de jouer sur deux enseignes différentes dictées par la nature du Joker :
*   Si le Joker au sommet est **Noir**, le joueur suivant peut jouer n'importe quelle carte de son choix de l'enseigne **Pique** OU de l'enseigne **Trèfle**.
*   Si le Joker au sommet est **Rouge**, le joueur suivant peut jouer n'importe quelle carte de son choix de l'enseigne **Coeur** OU de l'enseigne **Carreau**.

---

## 5. Conditions de Qualification, Élimination et Fin de Partie

Le moteur surveille la taille du tableau `Main_Joueur[i]` après chaque action de dépôt de carte pour gérer les transitions d'état de victoire.

### 5.1 Événement "Check" (Annonce d'Avant-Victoire)
Dès qu'un joueur valide le dépôt d'une carte et que le nombre restant de cartes dans sa main devient exactement égal à 1 (`Main_Joueur[i].length == 1`), le système intercepte cet état et déclenche automatiquement l'événement et l'animation textuelle/visuelle `"Check"`. Cela notifie l'ensemble de la table qu'un joueur n'a plus qu'une carte.

### 5.2 Événement "Games" (Qualification et Victoire)
*   Dès qu'un joueur dépose sa toute dernière carte et que sa main tombe à zéro (`Main_Joueur[i].length == 0`), le système valide l'événement `"Games"`.
*   **Retrait du flux :** Ce joueur est officiellement déclaré "Qualifié". Le moteur le retire immédiatement de la liste circulaire des joueurs actifs pour le reste de la manche. 
*   Le jeu ne s'arrête pas : le joueur suivant prend la main et continue à jouer directement sur la `Pile_Centrale` existante, sans aucune réinitialisation des cartes sur la table.

### 5.3 Fin de la Manche et Détermination du Perdant
*   La partie se poursuit en qualifiant les joueurs au fur et à mesure qu'ils vident leur main.
*   **Condition d'Arrêt Absolue :** La manche prend fin instantanément dès qu'il ne reste plus qu'un seul et unique joueur possédant encore des cartes en main, alors que tous ses adversaires ont réussi à déposer toutes les leurs et se sont qualifiés.
*   Ce dernier joueur est déclaré perdant de la manche. Le système affiche alors le classement final basé sur l'ordre chronologique de sortie (qualification) des joueurs.





## A. Le 2 pendant une attaque active

**Décision :** Lorsque `Compteur_Attaque > 0`, le 2 **ne peut pas être joué**, quelle que soit la règle générale "le 2 se joue à tout moment". Seules les cartes compatibles avec l'attaque (7, Joker) sont jouables. Le joueur doit soit surenchérir avec un 7/Joker, soit encaisser (section 4.C du spec original).

En dehors d'une attaque active (`Compteur_Attaque == 0`), le 2 conserve son comportement normal (jouable à tout moment, inséré en bas de la pile).

## B. As Stop à 3 joueurs et plus

**Décision :** L'enchaînement de plusieurs As d'affilée dans un même tour est **exclusif au cas à 2 joueurs** (spec original, section 4.3). À partir de 3 joueurs :
- Poser un As saute le tour du joueur suivant immédiatement après le joueur actif.
- Le tour du joueur actif se termine ensuite normalement (un seul As posé = une seule action de dépôt).
- Il ne peut pas poser un second As à la suite dans le même tour, même s'il en a plusieurs en main.

## C. Paramètres configurables (schéma `GameConfig`)

Liste définitive des paramètres exposés dans l'interface de configuration de partie :

| Paramètre | Type | Contrainte | Valeur par défaut |
|---|---|---|---|
| `nbJoueurs` | entier | 2 à 10 | — (obligatoire) |
| `nbCartesInitial` | entier | ≥ 1, et `nbJoueurs × nbCartesInitial < 53` | — (obligatoire) |
| `jPassePartout` | booléen | — | `false` |
| `penaliteSept` | entier | ≥ 1 | `2` |
| `penaliteJoker` | entier | ≥ 1 | `4` |
| `sensRotationParDefaut` | `'horaire'` \| `'antihoraire'` | — | `'horaire'` |

**Note sur `sensRotationParDefaut` :** ce paramètre définit la valeur pré-sélectionnée dans l'écran de vote de début de partie (section 1.5 du spec original). Le vote reste l'étape qui fixe la valeur réelle utilisée par le moteur (`sensRotation` dans `GameState`).

## D. Contrainte d'intégrité révisée

La contrainte originale `NB_JOUEURS × NB_CARTES_INITIAL < 54` est durcie à `< 53` afin de garantir qu'il reste toujours au moins 1 carte disponible pour initialiser la `Pile_Centrale` après distribution des mains, en plus d'un minimum de cartes en banque.

## E. Gestion des situations bloquantes

**Décision (remplace toute logique de fallback complexe) :** Si le moteur rencontre une situation qu'il ne peut pas résoudre selon les règles normales — notamment le cas où une pénalité cumulée (`Compteur_Attaque`) dépasse le nombre total de cartes encore disponibles (banque + défausse recyclable sous la carte visible) — le moteur **n'essaie pas de compenser**. Il :

1. Passe l'état de la partie en phase `bloque`.
2. Enregistre la raison du blocage (`raisonBlocage: string`) dans le `GameState`.
3. Arrête tout traitement d'actions supplémentaires.

**Côté interface :** l'UI détecte la phase `bloque` et affiche un message simple ("La partie ne peut pas continuer") avec deux actions possibles : **modifier les paramètres** (retour à l'écran de configuration) ou **recommencer une nouvelle partie** avec la configuration actuelle. Aucune tentative de récupération automatique n'est faite.

---

## F. Système de tournoi multi-manches, timer et classement

Le jeu ne se limite plus à une seule manche isolée : il s'agit d'un **tournoi** structuré en plusieurs manches successives, avec élimination progressive, jusqu'à une finale à 2 joueurs.

### F.1 Structure générale

*   Un `Tournoi` contient : la liste des joueurs encore en lice (`joueursActifs`), l'historique des manches jouées (`manches: ResultatManche[]`), la manche en cours, et le vainqueur final une fois déterminé.
*   Chaque **manche** se joue selon les règles complètes définies dans le spec original (sections 1 à 5) et l'addendum ci-dessus.
*   **Règle d'élimination :** à l'issue de chaque manche, le joueur perdant (celui identifié en section 5.3 du spec original comme dernier joueur encore en possession de cartes) est éliminé du tournoi. Il ne participe pas à la manche suivante.
*   Exception à cette règle : voir section G (vote de disqualification accélérée), qui peut éliminer plusieurs joueurs en une seule fois.
*   Le tournoi se poursuit manche après manche, chaque manche redistribuant les cartes uniquement entre les joueurs encore actifs, jusqu'à ce qu'il ne reste plus que **2 joueurs actifs**.
*   **Finale :** la dernière manche se joue à 2 joueurs, selon les règles standards (y compris le cas particulier de l'As Stop à 2 joueurs, section 4.3 du spec original). Le perdant de cette manche est éliminé ; l'autre joueur est déclaré **vainqueur du tournoi**.

### F.2 Timer et classement par manche

*   Un timer démarre au tout début de chaque manche (dès la fin de la distribution des mains).
*   Chaque fois qu'un joueur déclenche l'événement `"Games"` (main vidée, section 5.2 du spec original), le moteur enregistre le temps écoulé depuis le début de la manche : `tempsQualificationMs`.
*   Le classement de fin de manche (déjà prévu en section 5.3 du spec original) est donc basé sur ce temps réel enregistré, et non plus seulement sur l'ordre chronologique brut — ces deux ordres coïncident naturellement dans le déroulement normal du jeu, mais le temps réel est conservé comme donnée affichable (ex. "Joueur qualifié en 2min 14s").
*   Le joueur perdant de la manche (dernier avec des cartes en main) n'a pas de `tempsQualificationMs` — il est marqué comme perdant de la manche et éliminé du tournoi.

### F.3 Structure de données proposée (résumé)

```
ResultatManche {
  numeroManche: number
  classement: { joueurId: string, tempsQualificationMs: number }[]  // ordre croissant
  perdantId: string | null   // null si manche terminée par vote de skip (section G)
  joueursEliminesParVote?: string[]  // si applicable, voir section G
}
```

---

## G. Vote de disqualification accélérée (parties à nombreux joueurs)

Pour éviter que les manches à beaucoup de joueurs (ex. 8-10) ne s'éternisent en attendant que les derniers joueurs terminent leurs échanges de cartes un par un, un mécanisme de vote accéléré est prévu.

### G.1 Conditions d'activation

*   Le vote n'est proposé que lorsqu'il reste **exactement 2 ou 3 joueurs encore en possession de cartes** (non qualifiés) dans la manche en cours.
*   Seuls les joueurs **déjà qualifiés** dans la manche en cours (ceux ayant vidé leur main, événement `"Games"` déclenché) ont le droit de voter. Les joueurs encore en jeu ne votent pas.
*   Si un seul joueur reste en jeu, la manche se termine naturellement (règle 5.3 du spec original) et le vote n'a pas lieu d'être.

### G.2 Déroulement du vote

*   Chaque joueur qualifié éligible peut déclencher/participer au vote depuis son interface.
*   **Règle de majorité (par défaut) :** le vote passe si une majorité simple (plus de la moitié) des joueurs qualifiés éligibles votent en faveur de la disqualification accélérée.
*   Si le vote passe, le moteur :
    1.  Met fin immédiatement à la manche en cours.
    2.  Marque **tous** les joueurs encore en possession de cartes (les 2 ou 3 concernés) comme éliminés du tournoi simultanément — sans déterminer de classement individuel entre eux pour cette manche (ils sont considérés à égalité, tous éliminés ensemble).
    3.  Enregistre `joueursEliminesParVote` dans le `ResultatManche`, avec `perdantId: null`.

### G.3 Conséquence sur la structure du tournoi

*   Contrairement à la règle générale (un seul joueur éliminé par manche, section F.1), ce mécanisme peut donc éliminer **2 ou 3 joueurs en une seule manche**. C'est un compromis assumé pour accélérer les parties à nombreux joueurs.
*   Après une disqualification accélérée, le tournoi reprend normalement avec les joueurs restants (déjà qualifiés + le ou les joueurs non concernés par le vote, s'il y en a). Si le nombre de joueurs restants tombe à 2, la manche suivante est directement la finale.

---

## H. Points ouverts / hypothèses à valider

*   **Seuil de majorité du vote (section G.2)** : fixé par défaut à majorité simple. À confirmer si tu préfères l'unanimité, ou un seuil configurable.
*   Le classement affiché en fin de tournoi pourra combiner : position finale (éliminé à quelle manche) + temps cumulés, si souhaité plus tard pour un système de score global.
