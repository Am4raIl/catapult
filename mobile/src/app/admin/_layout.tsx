import { Stack } from 'expo-router';

import { useAppTheme } from '@/providers/theme-provider';

export default function AdminLayout() {
  const { colors } = useAppTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="products/new" options={{ presentation: 'card' }} /><Stack.Screen name="products/[id]" /><Stack.Screen name="products/[id]/edit" /></Stack>;
}
