# Jeu de cartes multijoueur — App mobile

Jeu de cartes multijoueur en réseau local (LAN), jouable sur mobile (iOS et Android). Les règles (proches d'un jeu type "Uno avancé" avec 2, Valet, As, 7 et Jokers) sont entièrement paramétrables avant chaque partie. Un mode solo contre une IA est prévu pour plus tard.

Pour le détail fonctionnel de ce qui est fait / reste à faire, voir [`AVANCEMENT.md`](./AVANCEMENT.md).

---

## Stack technique

- **React Native** (Expo) — iOS + Android à partir d'une seule base de code
- **TypeScript** strict
- **Navigation** : `@react-navigation/native` + `@react-navigation/native-stack`
- **Stockage local** : `react-native-mmkv` (avec repli en mémoire automatique tant qu'on teste sous Expo Go)
- **Réseau local** (à venir) : découverte LAN (mDNS) + synchronisation entre appareils — nécessitera un **Expo Dev Client**, Expo Go ne supportant pas les modules natifs custom

---

## Démarrage

Prérequis : Node.js, et `npx expo` (CLI Expo).

```bash
npm install
npx expo install expo-network react-native-mmkv \
  @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context
npx expo start
```

### ⚠️ Limites d'Expo Go

Expo Go (l'app du store) ne supporte pas les modules natifs personnalisés. Concrètement aujourd'hui :

- **`react-native-mmkv`** (stockage) bascule automatiquement sur un stockage en mémoire sous Expo Go — le profil et les réglages ne survivent pas à un rechargement de l'app. Le vrai stockage persistant fonctionnera dès qu'on passera par un Dev Client.
- **Le réseau local réel** (Phase 4, pas encore commencé) nécessitera aussi un Dev Client — mDNS et les sockets TCP ne sont pas disponibles dans Expo Go.

Pour lever ces limites :

```bash
eas build --profile development
```

Puis installer ce build de développement sur les appareils de test à la place d'Expo Go.

---

## Structure du projet

```
src/
├── app/                # Point d'entrée, navigation, providers
│   └── navigation/        # RootNavigator (toutes les routes de l'app)
├── theme/              # Couleurs, typographie, thème dynamique (couleur choisie par l'utilisateur)
├── components/         # Design system réutilisable (Button, Card, Avatar, PlayingCard, ...)
├── features/           # Fonctionnalités regroupées par domaine
│   ├── onboarding/         # Bienvenue → Pseudo → Avatar
│   ├── home/               # Écran d'accueil
│   ├── profile/            # Profil joueur
│   ├── settings/           # Paramètres (interface + jeu par défaut)
│   ├── stats/               # Statistiques
│   ├── rules/                # Règles du jeu (résumé consultable)
│   ├── party/                 # Créer / rejoindre / lobby (réseau mocké pour l'instant)
│   ├── table/                  # Table de jeu
│   └── shell/                   # Layout partagé (barre de navigation basse, etc.)
├── engine/              # Moteur de jeu — 100% indépendant de React Native, testé unitairement
├── network/             # Réseau local (vérification Wi-Fi pour l'instant, LAN à venir)
├── storage/             # Persistance locale (MMKV + repli mémoire)
└── utils/
```

---

## Principes d'architecture

- **Un seul système de thème** : aucune couleur codée en dur dans les écrans. Tout passe par `theme/tokens.ts` (valeurs statiques) et la palette générée dynamiquement à partir de la couleur choisie par l'utilisateur (`theme/colorUtils.ts` + `ThemeProvider`).
- **Le moteur de jeu (`src/engine`) ne connaît ni React Native, ni le réseau, ni l'UI.** C'est de la logique pure (fonctions + types), testée indépendamment. Ça permet de la tester facilement, de la faire écrire/maintenir par une IA sans risque de casser l'app, et de la réutiliser telle quelle une fois le réseau branché.
- **Organisation par fonctionnalité** (`features/`), pas par type de fichier — chaque dossier regroupe tout ce qui concerne un domaine (écrans, logique, types propres à cette fonctionnalité).
- **Composants réutilisables** : tous les écrans s'appuient sur le même design system (`components/`), jamais de style dupliqué à la main.
- **Une seule source de vérité pour l'état d'une partie** : à terme, ce sera l'hôte de la partie qui fait autorité sur l'état du jeu (les autres appareils ne font qu'envoyer des actions et recevoir l'état à jour) — voir Phase 4 dans `AVANCEMENT.md`.

---

## Résumé des règles du jeu

- **But** : être le premier à vider sa main.
- **À son tour** : jouer une carte qui correspond en enseigne ou en valeur à la carte visible, ou partir piocher en banque (ce qui termine le tour).
- **Le 2** : passe-partout, se glisse sous la pile sans changer la carte visible.
- **Le Valet** : impose une enseigne au joueur suivant.
- **L'As** : fait sauter le tour du joueur suivant (à 2 joueurs, redonne la main pour enchaîner).
- **Le 7 et les Jokers** : déclenchent une attaque cumulable (+2 pour un 7, +4 pour un Joker) — le joueur suivant surenchérit ou encaisse toute la pénalité.
- **Fin de manche** : dès qu'il ne reste qu'un seul joueur avec des cartes en main, il est déclaré perdant de la manche.
- **Tournoi** : le perdant de chaque manche est éliminé, jusqu'à une finale à deux joueurs. Classement basé sur le temps mis à se qualifier à chaque manche.

Le détail complet (avec tous les cas particuliers) est dans le code du moteur (`src/engine`) et dans l'écran Règles du jeu de l'app.

---

## Roadmap technique

1. ~~Fondations UI (thème, design system)~~ ✅
2. ~~Onboarding~~ ✅
3. ~~Shell (Accueil, Profil, Paramètres, Statistiques, Règles)~~ ✅
4. ~~Interfaces de création/lobby (réseau mocké)~~ ✅
5. Réseau local réel (découverte LAN, synchronisation entre appareils) — 🔜
6. Brancher le moteur de jeu à l'écran de table — 🔜
7. Écrans de fin de manche / fin de tournoi (classement, vote de disqualification) — 🔜
8. Mode solo contre une IA — plus tard

Pour le détail fonctionnel (ce qui marche vraiment vs ce qui est simulé), voir [`AVANCEMENT.md`](./AVANCEMENT.md).