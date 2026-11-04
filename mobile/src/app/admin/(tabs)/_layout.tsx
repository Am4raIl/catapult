import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';

import { useAppTheme } from '@/providers/theme-provider';

export default function AdminTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.textSecondary, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64 + Math.max(insets.bottom, 8), paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) }, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Painel', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={String(color)} size={size} /> }} />
    <Tabs.Screen name="products" options={{ title: 'Produtos', tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={String(color)} size={size} /> }} />
    <Tabs.Screen name="categories" options={{ title: 'Categorias', tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" color={String(color)} size={size} /> }} />
  </Tabs>;
}
