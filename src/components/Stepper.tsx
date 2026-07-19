import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTextStyle } from '../theme/textStyle';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (valeur: number) => void;
  step?: number;
}

/** Compteur "− n +" borné, utilisé pour les paramètres de jeu (nombre de joueurs, cartes, pénalités...). */
export function Stepper({ value, min, max, onChange, step = 1 }: StepperProps) {
  const theme = useTheme();
  const bodyMedium = resolveTextStyle(theme, 'bodyMedium');

  const peutDiminuer = value > min;
  const peutAugmenter = value < max;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={!peutDiminuer}
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.accent[50],
          opacity: peutDiminuer ? 1 : 0.4,
        }}
      >
        <Text style={{ color: theme.accent[700], fontSize: 16 }}>−</Text>
      </Pressable>

      <Text style={[bodyMedium, { color: theme.colors.textPrimary, minWidth: 22, textAlign: 'center' }]}>
        {value}
      </Text>

      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={!peutAugmenter}
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.accent[50],
          opacity: peutAugmenter ? 1 : 0.4,
        }}
      >
        <Text style={{ color: theme.accent[700], fontSize: 16 }}>+</Text>
      </Pressable>
    </View>
  );
}