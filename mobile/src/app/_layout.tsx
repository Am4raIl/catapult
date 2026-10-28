import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/core';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { AppQueryProvider } from '@/providers/query-provider';
import { AppThemeProvider, useAppTheme } from '@/providers/theme-provider';

function RootNavigator() {
  const { status } = useAuth();
  const { colors } = useAppTheme();
  if (status === 'checking') return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.accent} /><AppText color="secondary">Preparando o Catapult...</AppText></View>;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="login" options={{ animation: 'fade_from_bottom' }} />
      <Stack.Protected guard={status === 'authenticated'} redirectTo="/login">
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return <GestureHandlerRootView style={styles.flex}><SafeAreaProvider><AppQueryProvider><AppThemeProvider><AuthProvider><RootNavigator /></AuthProvider></AppThemeProvider></AppQueryProvider></SafeAreaProvider></GestureHandlerRootView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 } });
