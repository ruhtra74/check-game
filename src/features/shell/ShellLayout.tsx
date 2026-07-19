import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Background } from '../../components';
import { useTheme } from '../../theme';
import { BottomNav, type OngletBottomNav } from './BottomNav';

interface ShellLayoutProps {
  children: React.ReactNode;
  ongletActif: OngletBottomNav | null;
  /** Certains écrans secondaires (ex. Personnaliser la couleur) n'affichent pas la barre. */
  masquerBottomNav?: boolean;
}

export function ShellLayout({ children, ongletActif, masquerBottomNav = false }: ShellLayoutProps) {
  const theme = useTheme();

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.xxl,
            paddingBottom: masquerBottomNav ? theme.spacing.xxl : 120,
          }}
        >
          {children}
        </ScrollView>
        {!masquerBottomNav && <BottomNav actif={ongletActif} />}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});