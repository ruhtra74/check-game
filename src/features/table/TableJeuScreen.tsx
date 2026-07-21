import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, Text, View } from 'react-native';
import { Avatar, Button, PlayingCard } from '../../components';
import { useTheme } from '../../theme';
import { resolveTextStyle } from '../../theme/textStyle';
import { creerPaquetComplet, melanger, type Card } from '../../engine';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';
import { ShellLayout } from '../shell/ShellLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'TableJeu'>;

// Adversaires mockés — viendront de la vraie liste du lobby une fois le
// moteur et le réseau branchés (Phase 5).
const ADVERSAIRES_MOCK = [
  { pseudo: 'Maria', emoji: '🐱', cartes: 6 },
  { pseudo: 'John', emoji: '🦊', cartes: 4 },
  { pseudo: 'Sophie', emoji: '🐼', cartes: 7 },
];

export function TableJeuScreen({ navigation }: Props) {
  const theme = useTheme();
  const h2 = resolveTextStyle(theme, 'h2');
  const caption = resolveTextStyle(theme, 'caption');

  // Données mockées, mais construites avec le vrai paquet du moteur pour que
  // le rendu visuel soit fidèle (54 cartes, mêmes types) même si les règles
  // ne sont pas encore branchées ici.
  const [table, setTable] = useState(() => {
    const paquet = melanger(creerPaquetComplet());
    return {
      pileTop: paquet[0] as Card,
      main: paquet.slice(1, 8),
      banque: paquet.slice(8),
    };
  });
  const [selectionId, setSelectionId] = useState<string | null>(null);

  function jouerCarte() {
    if (!selectionId) return;
    setTable((actuel) => {
      const carte = actuel.main.find((c) => c.id === selectionId);
      if (!carte) return actuel;
      return { ...actuel, pileTop: carte, main: actuel.main.filter((c) => c.id !== selectionId) };
    });
    setSelectionId(null);
  }

  function partirEnBanque() {
    setTable((actuel) => {
      if (actuel.banque.length === 0) return actuel;
      const [carte, ...reste] = actuel.banque;
      return { ...actuel, main: [...actuel.main, carte as Card], banque: reste };
    });
  }

  return (
    <ShellLayout ongletActif={null} masquerBottomNav>
      {/* Adversaires */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: theme.spacing.lg }}>
        {ADVERSAIRES_MOCK.map((adversaire) => (
          <View key={adversaire.pseudo} style={{ alignItems: 'center' }}>
            <Avatar nom={adversaire.pseudo} emoji={adversaire.emoji} size={44} />
            <Text style={[caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              {adversaire.pseudo} · {adversaire.cartes}
            </Text>
          </View>
        ))}
      </View>

      {/* Pile centrale + banque */}
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xl }}>
          <View style={{ alignItems: 'center' }}>
            <PlayingCard carte={table.pileTop} faceCachee taille="md" />
            <Text style={[caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>
              Banque · {table.banque.length}
            </Text>
          </View>
          <PlayingCard carte={table.pileTop} taille="lg" />
        </View>
      </View>

      {/* Main du joueur */}
      <Text style={[h2, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>Votre main</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}>
        {table.main.map((carte) => (
          <PlayingCard
            key={carte.id}
            carte={carte}
            taille="md"
            selectionnee={carte.id === selectionId}
            onPress={() => setSelectionId((actuel) => (actuel === carte.id ? null : carte.id))}
          />
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <Button label="JOUER UNE CARTE" onPress={jouerCarte} disabled={!selectionId} />
        <Button label="BANQUE" variant="danger" onPress={partirEnBanque} />
      </View>
    </ShellLayout>
  );
}