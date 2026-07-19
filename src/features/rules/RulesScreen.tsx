import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Card, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Regles'>;

interface Section {
  titre: string;
  paragraphes: string[];
}

const SECTIONS: Section[] = [
  {
    titre: '🎯 Objectif',
    paragraphes: [
      "Sois le premier à vider ta main. À chaque tour, dépose une carte qui correspond à l'enseigne ou à la valeur de la carte visible, ou pars piocher en banque.",
    ],
  },
  {
    titre: '🃏 Déroulement d\'un tour',
    paragraphes: [
      "Deux choix possibles : jouer une carte valide, ou partir en banque piocher une carte (ce qui termine ton tour, même si tu avais une carte jouable).",
    ],
  },
  {
    titre: '2️⃣ Le 2 passe-partout',
    paragraphes: [
      "Se joue à tout moment, quelle que soit la carte au sommet. Il se glisse tout en dessous de la pile : la carte visible ne change pas pour le joueur suivant.",
    ],
  },
  {
    titre: '🎩 Le Valet commande',
    paragraphes: [
      "Une fois posé, tu choisis l'enseigne que le joueur suivant devra respecter — jusqu'à ce qu'un autre Valet change à nouveau la commande.",
    ],
  },
  {
    titre: '🅰️ L\'As arrête',
    paragraphes: [
      "Fait sauter le tour du joueur suivant. À 2 joueurs seulement, ça te redonne la main : tu peux enchaîner un autre As si tu en as.",
    ],
  },
  {
    titre: '🔥 Le 7 et les Jokers attaquent',
    paragraphes: [
      'Un 7 ajoute 2 cartes à la pénalité, un Joker en ajoute 4. Le joueur suivant peut surenchérir avec un autre 7/Joker, ou encaisser toute la pénalité cumulée.',
      "Après avoir encaissé, ton tour continue : tu dois encore jouer une carte ou repartir en banque (ce qui, cette fois, terminera vraiment ton tour).",
    ],
  },
  {
    titre: '🏁 Fin de manche',
    paragraphes: [
      "À 1 carte en main : \"Check\". À 0 carte : tu es qualifié et sors du jeu. La manche se termine quand il ne reste qu'un seul joueur avec des cartes — c'est le perdant.",
    ],
  },
  {
    titre: '🏆 Le tournoi',
    paragraphes: [
      'Le perdant de chaque manche est éliminé du tournoi, jusqu\'à une finale à 2 joueurs. Le classement de chaque manche se base sur le temps mis à se qualifier.',
      "Avec beaucoup de joueurs, ceux déjà qualifiés peuvent voter à l'unanimité pour disqualifier directement les joueurs restants et passer à la manche suivante.",
    ],
  },
];

export function RulesScreen({ navigation }: Props) {
  const theme = useTheme();
  const h2 = resolveTextStyle(theme, 'h2');
  const body = resolveTextStyle(theme, 'body');

  return (
    <ShellLayout ongletActif="regles">
      <ScreenHeader title="Règles du jeu" onBack={navigation.goBack} />

      <View style={{ gap: theme.spacing.md }}>
        {SECTIONS.map((section) => (
          <Card key={section.titre}>
            <Text style={[h2, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
              {section.titre}
            </Text>
            {section.paragraphes.map((paragraphe, index) => (
              <Text
                key={index}
                style={[
                  body,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: index > 0 ? theme.spacing.sm : 0,
                  },
                ]}
              >
                {paragraphe}
              </Text>
            ))}
          </Card>
        ))}
      </View>
    </ShellLayout>
  );
}