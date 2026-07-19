import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components';
import { useTheme } from '../../theme';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';

export type OngletBottomNav = 'accueil' | 'statistiques' | 'regles' | 'parametres';

interface BottomNavProps {
  /** null = aucun onglet en surbrillance (ex. écran Profil, atteint via le header, pas via la barre). */
  actif: OngletBottomNav | null;
}

/**
 * Barre flottante en pilule, visible sur tous les écrans principaux du
 * Shell. Exactement 4 onglets : Accueil, Statistiques, Règles du jeu,
 * Paramètres. Profil n'y figure pas — on y accède depuis le header de
 * l'Accueil (avatar / nom).
 */
export function BottomNav({ actif }: BottomNavProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const items: { id: OngletBottomNav; glyphe: string; onPress: () => void }[] = [
    { id: 'accueil', glyphe: '🏠', onPress: () => navigation.navigate('Accueil') },
    { id: 'statistiques', glyphe: '📊', onPress: () => navigation.navigate('Statistiques') },
    { id: 'regles', glyphe: 'ℹ️', onPress: () => navigation.navigate('Regles') },
    { id: 'parametres', glyphe: '⚙️', onPress: () => navigation.navigate('Parametres') },
  ];

  return (
    <View style={styles.wrapper}>
      <Card padding="sm" style={{ borderRadius: theme.radius.pill }}>
        <View style={styles.row}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.item,
                item.id === actif && { backgroundColor: theme.accent[500] },
                pressed && item.id !== actif && { backgroundColor: theme.colors.surfaceAlt },
              ]}
            >
              <Text style={{ fontSize: 18 }}>{item.glyphe}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});