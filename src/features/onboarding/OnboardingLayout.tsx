import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background, ProgressDots } from '../../components';
import { useTheme } from '../../theme';

interface OnboardingLayoutProps {
  /** Index de l'étape courante (0 = Bienvenue, 1 = Pseudo, 2 = Avatar). */
  etape: number;
  totalEtapes?: number;
  children: React.ReactNode;
  /** Zone fixe en bas (généralement un Button). */
  pied?: React.ReactNode;
}

export function OnboardingLayout({ etape, totalEtapes = 3, children, pied }: OnboardingLayoutProps) {
  const theme = useTheme();

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.progress, { marginTop: theme.spacing.lg }]}>
            <ProgressDots total={totalEtapes} activeIndex={etape} />
          </View>

          <View style={[styles.content, { padding: theme.spacing.xxl }]}>{children}</View>

          {pied && (
            <View
              style={{
                padding: theme.spacing.xxl,
                paddingTop: 0,
              }}
            >
              {pied}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  progress: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
});
