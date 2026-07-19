import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { resolveTextStyle } from '../theme/textStyle';
import { Button, type ButtonVariant } from './Button';

export interface DialogAction {
  label: string;
  variant?: ButtonVariant;
  onPress: () => void;
}

interface DialogProps {
  visible: boolean;
  title: string;
  onClose?: () => void;
  children?: React.ReactNode;
  /** Boutons affichés en bas, empilés verticalement (comme "Oui !" / "Non !!" dans la maquette). */
  actions?: DialogAction[];
}

/**
 * Modale générique centrée. Couvre tous les cas de la maquette :
 *  - confirmation simple avec deux actions (Prêt à commencer, Disqualification)
 *  - contenu libre custom (grille des 4 enseignes pour le choix du Valet)
 */
export function Dialog({ visible, title, onClose, children, actions }: DialogProps) {
  const theme = useTheme();
  const titreStyle = resolveTextStyle(theme, 'h1');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.xxl,
            },
            theme.shadows.md,
          ]}
        >
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={[titreStyle, { color: theme.colors.textSecondary, fontSize: 18 }]}>✕</Text>
            </Pressable>
          )}

          <Text style={[titreStyle, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
            {title}
          </Text>

          {children && <View style={{ marginTop: theme.spacing.lg }}>{children}</View>}

          {actions && actions.length > 0 && (
            <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
              {actions.map((action) => (
                <Button
                  key={action.label}
                  label={action.label}
                  variant={action.variant ?? 'primary'}
                  onPress={action.onPress}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
  },
});
