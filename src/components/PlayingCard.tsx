import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { Card as CardDuMoteur } from '../engine';

interface PlayingCardProps {
  carte: CardDuMoteur;
  taille?: 'sm' | 'md' | 'lg';
  /** Dos de carte (main des adversaires, pioche). */
  faceCachee?: boolean;
  selectionnee?: boolean;
  onPress?: () => void;
}

const DIMENSIONS = {
  sm: { largeur: 40, hauteur: 56, police: 14 },
  md: { largeur: 56, hauteur: 78, police: 18 },
  lg: { largeur: 72, hauteur: 100, police: 24 },
};

const SYMBOLES: Record<'pique' | 'coeur' | 'trefle' | 'carreau', string> = {
  pique: '♠',
  coeur: '♥',
  trefle: '♣',
  carreau: '♦',
};

function estRouge(suit: 'pique' | 'coeur' | 'trefle' | 'carreau'): boolean {
  return suit === 'coeur' || suit === 'carreau';
}

/** Rendu visuel d'une carte à jouer. Accepte directement le type Card du moteur. */
export function PlayingCard({ carte, taille = 'md', faceCachee = false, selectionnee, onPress }: PlayingCardProps) {
  const theme = useTheme();
  const dim = DIMENSIONS[taille];

  const contenu = faceCachee ? (
    <View
      style={[
        styles.base,
        {
          width: dim.largeur,
          height: dim.hauteur,
          backgroundColor: theme.accent[500],
          borderRadius: theme.radius.sm,
        },
      ]}
    >
      <View
        style={{
          width: dim.largeur * 0.5,
          height: dim.hauteur * 0.5,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: theme.accent[200],
        }}
      />
    </View>
  ) : carte.kind === 'joker' ? (
    <View
      style={[
        styles.base,
        {
          width: dim.largeur,
          height: dim.hauteur,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={{ fontSize: dim.police * 1.3 }}>🃏</Text>
      <View
        style={{
          position: 'absolute',
          bottom: 4,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: carte.color === 'noir' ? theme.colors.textPrimary : theme.colors.danger,
        }}
      />
    </View>
  ) : (
    <View
      style={[
        styles.base,
        styles.faceVisible,
        {
          width: dim.largeur,
          height: dim.hauteur,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontSize: dim.police * 0.6,
          fontWeight: '700',
          color: estRouge(carte.suit) ? theme.colors.danger : theme.colors.textPrimary,
        }}
      >
        {carte.rank}
      </Text>
      <Text
        style={{
          fontSize: dim.police,
          color: estRouge(carte.suit) ? theme.colors.danger : theme.colors.textPrimary,
        }}
      >
        {SYMBOLES[carte.suit]}
      </Text>
    </View>
  );

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View
        style={[
          selectionnee && { transform: [{ translateY: -10 }] },
          selectionnee && {
            borderRadius: theme.radius.sm + 2,
            borderWidth: 2,
            borderColor: theme.accent[500],
          },
        ]}
      >
        {contenu}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceVisible: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});