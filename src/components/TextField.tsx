import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTextStyle } from '../theme/textStyle';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
}

/**
 * Champ de saisie arrondi. La bordure passe à la couleur dominante au focus,
 * et en rouge (danger) si `error` est fourni — utilisé par exemple pour le
 * choix du pseudo à l'onboarding.
 */
export function TextField({ label, error, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const theme = useTheme();
  const [focus, setFocus] = useState(false);
  const corps = resolveTextStyle(theme, 'body');
  const captionStyle = resolveTextStyle(theme, 'caption');

  const couleurBordure = error ? theme.colors.danger : focus ? theme.accent[500] : theme.colors.border;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[captionStyle, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
          {label}
        </Text>
      )}
      <TextInput
        {...inputProps}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.textDisabled}
        style={[
          corps,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surface,
            borderColor: couleurBordure,
            borderWidth: 1.5,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.lg,
            height: 50,
          },
        ]}
      />
      {error && (
        <Text style={[captionStyle, { color: theme.colors.danger, marginTop: theme.spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
