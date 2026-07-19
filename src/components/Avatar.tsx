import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTextStyle } from '../theme/textStyle';

export type AvatarStatut = 'pret' | 'enAttente' | 'nonPret' | 'aucun';

export interface AvatarBadge {
  icone: string;
  couleur?: string;
  position?: 'hautDroite' | 'basDroite';
}

interface AvatarProps {
  nom: string;
  /** Emoji utilisé comme visuel d'avatar (seul mode supporté pour l'instant). */
  emoji?: string;
  size?: number;
  statut?: AvatarStatut;
  /**
   * Badge superposé sur l'avatar — couronne pour l'hôte du lobby, crayon pour
   * une action de modification (Profil), etc. Générique pour couvrir ces
   * deux cas avec le même mécanisme visuel.
   */
  badge?: AvatarBadge;
}

/**
 * Avatar circulaire. Pour l'instant, uniquement emoji + repli sur l'initiale
 * du nom — pas de photo (volontairement, pour ne pas mélanger deux systèmes
 * visuels différents avant d'en avoir réellement besoin). Le support photo
 * pourra être ajouté plus tard comme un mode à part entière, pas mélangé
 * avec l'emoji dans le même composant.
 *
 * L'anneau de couleur reflète le statut du joueur dans le lobby :
 *  - pret     -> anneau vert (couleur success)
 *  - enAttente-> anneau ambre (couleur warning)
 *  - nonPret  -> anneau neutre
 *  - aucun    -> pas d'anneau (ex. avatar du profil)
 */
export function Avatar({ nom, emoji, size = 48, statut = 'aucun', badge }: AvatarProps) {
  const theme = useTheme();
  const couleurAnneau = {
    pret: theme.colors.success,
    enAttente: theme.colors.warning,
    nonPret: theme.colors.border,
    aucun: 'transparent',
  }[statut];

  const initiale = nom.trim().charAt(0).toUpperCase() || '?';
  const texteInitiale = resolveTextStyle(theme, 'h2');
  const positionBadge = badge?.position ?? 'hautDroite';

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.anneau,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: couleurAnneau,
            borderWidth: statut === 'aucun' ? 0 : 2.5,
          },
        ]}
      >
        <View
          style={[
            styles.fallback,
            {
              width: size - 6,
              height: size - 6,
              borderRadius: (size - 6) / 2,
              backgroundColor: theme.accent[100],
            },
          ]}
        >
          {emoji ? (
            <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
          ) : (
            <Text style={[texteInitiale, { color: theme.accent[700] }]}>{initiale}</Text>
          )}
        </View>
      </View>

      {badge && (
        <View
          style={[
            styles.badge,
            positionBadge === 'hautDroite' ? { top: -4, right: -4 } : { bottom: -4, right: -4 },
            {
              backgroundColor: badge.couleur ?? theme.colors.warning,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={styles.badgeTexte}>{badge.icone}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  anneau: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexte: {
    fontSize: 10,
    color: '#FFFFFF',
  },
});
