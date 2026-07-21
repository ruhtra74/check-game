# Avancement du projet — Jeu de cartes multijoueur

_Dernière mise à jour : 20 juillet 2026_

## Où en sommes-nous ?

Le projet avance sur deux grands blocs qui progressent en parallèle :
- **Les règles du jeu** — le "cerveau" qui sait comment se joue une partie, arbitre les coups, gère les manches et le tournoi.
- **L'application** — tout ce que le joueur voit et touche sur son téléphone.

---

## ✅ Ce qui est terminé et fiable

### Les règles du jeu
Toute la mécanique du jeu a été écrite et vérifiée par des tests automatiques (15 scénarios rejoués à chaque changement, pour s'assurer que rien ne se casse en cours de route) :
- Distribution des cartes, pioche, défausse, recyclage automatique de la pioche quand elle est vide.
- Toutes les cartes spéciales : le 2 (passe-partout), le Valet (impose une couleur), l'As (fait sauter un tour), le 7 et les Jokers (attaque cumulable).
- Détection automatique du "Check" (un joueur n'a plus qu'une carte) et du "Games" (un joueur a fini sa manche).
- Le format tournoi complet : un joueur éliminé par manche jusqu'à une finale à deux, classement basé sur le temps mis à se qualifier.
- Le vote à l'unanimité pour disqualifier rapidement les joueurs restants dans les parties à beaucoup de monde.
- Gestion propre des situations bloquantes (par exemple plus assez de cartes disponibles) : la partie s'arrête proprement avec un message clair plutôt que de planter.

### L'application — profil et réglages
- Écran d'accueil, création de profil (pseudo + avatar).
- Personnalisation complète : couleur dominante de l'interface (modifiable à tout moment, tout s'adapte automatiquement), langue, vibrations.
- Page Statistiques (prête à afficher les vraies stats dès qu'on pourra jouer de vraies parties).
- Page Règles du jeu, consultable directement dans l'app.
- Réglages de partie par défaut (cartes par joueur, pénalités, règle du Valet...) modifiables à l'avance par l'hôte.

### L'application — créer / rejoindre une partie
- Écran pour choisir entre créer une partie ou en rejoindre une.
- Création d'une partie avec un nom, pour que les autres joueurs la reconnaissent en la cherchant.
- Lobby : liste des joueurs connectés, réglages de la partie modifiables par l'hôte, possibilité pour l'hôte d'exclure des joueurs.
- Étape de confirmation avant de démarrer ("Prêt à commencer ?") où chaque joueur doit valider sa présence.
- Vérification que le téléphone est bien connecté à un Wi-Fi, avec une aide expliquant comment configurer le réseau entre plusieurs appareils.

> ⚠️ **Important** : cette dernière partie est entièrement fonctionnelle à l'écran, mais **simulée en coulisses**. Il n'y a pas encore de vraie connexion entre plusieurs téléphones : quand on "crée une partie" aujourd'hui, l'app invente des joueurs fictifs qui rejoignent tout seuls, pour qu'on puisse déjà voir et valider comment tout ça se comporte visuellement, avant de brancher le vrai réseau.

---

## 🟡 Ce qui existe mais n'est pas encore relié

- **La table de jeu** : l'écran existe et est visuellement complet (les cartes, la main du joueur, les adversaires, les boutons pour jouer), mais il n'est pas encore branché aux vraies règles du jeu construites plus haut. Aujourd'hui, jouer une carte ne fait qu'un effet visuel, sans vérifier si le coup est valide.

---

## 🔴 Ce qui n'est pas encore commencé

- **Le vrai jeu en réseau local** : faire communiquer plusieurs téléphones entre eux pour de vrai (aujourd'hui, tout est simulé sur un seul appareil).
- **Brancher les vraies règles à la table de jeu** : une fois le réseau en place, relier l'écran de jeu au moteur de règles déjà terminé et testé.
- **Les écrans de fin de manche et de fin de tournoi** : annoncer le perdant d'une manche, afficher le classement, montrer le vote de disqualification à l'écran, annoncer le vainqueur du tournoi. (Les règles qui gèrent tout ça sont déjà prêtes ; il manque uniquement l'affichage.)
- **Le mode solo contre l'ordinateur** : évoqué dès le départ comme une amélioration possible, pas encore commencé.
- **Le suivi réel des statistiques** : les stats existent dans l'app mais ne s'incrémentent pas encore après une vraie partie, puisqu'on ne peut pas encore en jouer une pour de vrai.

---

## En résumé

On peut voir le projet comme une pièce de théâtre : le texte (les règles du jeu) est entièrement écrit et répété. Le décor et les costumes (l'interface) sont prêts pour presque toutes les scènes. Il reste à faire jouer les acteurs ensemble sur scène pour de vrai (le réseau) et à relier le texte aux acteurs (brancher les règles à l'écran de jeu).