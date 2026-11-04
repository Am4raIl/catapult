import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppHeader, AppText, ErrorState, LoadingState, ScreenScaffold, SectionHeading, ThemeSelector, IconButton, InlineError } from '@/components/ui/core';
import { friendlyError } from '@/lib/api/client';
import { dashboardApi } from '@/lib/api/services';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const { username, logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary });
  const byCategory = useQuery({ queryKey: ['dashboard', 'categories'], queryFn: dashboardApi.productsByCategory });
  const ranges = useQuery({ queryKey: ['dashboard', 'ranges'], queryFn: dashboardApi.priceRanges });
  const refreshing = summary.isRefetching || byCategory.isRefetching || ranges.isRefetching;
  const refresh = async () => { await Promise.all([summary.refetch(), byCategory.refetch(), ranges.refetch()]); };
  const signOut = async () => { if (signingOut) return; setSigningOut(true); setLogoutError(''); try { await logout(); router.replace('/'); } catch (error) { setLogoutError(friendlyError(error)); } finally { setSigningOut(false); } };
  const metrics = summary.data ? [
    ['Produtos', String(summary.data.total_products), 'cube-outline'], ['Categorias', String(summary.data.total_categories), 'folder-outline'],
    ['Preço médio', formatCurrency(summary.data.average_product_price), 'pricetag-outline'], ['Sem foto', String(summary.data.products_without_photo), 'image-outline'], ['Estoque baixo', String(summary.data.low_stock_count), 'alert-circle-outline'],
  ] as const : [];
  const categories = [...(byCategory.data ?? [])].sort((a, b) => b.total_value - a.total_value);
  const maxCategory = Math.max(...categories.map((item) => item.total_value), 1);
  const maxRange = Math.max(...(ranges.data ?? []).map((item) => item.count), 1);

  return <ScreenScaffold bottomSafe={false}><AppHeader title="Painel" subtitle={`Olá, ${username ?? 'gestor'}`} right={<View style={styles.headerActions}><IconButton icon="storefront-outline" label="Vitrine pública" onPress={() => router.push('/')} /><ThemeSelector /><IconButton icon="log-out-outline" label="Sair da conta" disabled={signingOut} onPress={signOut} /></View>} />
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />} contentContainerStyle={styles.content}>
      {logoutError ? <InlineError>{logoutError}</InlineError> : null}<AppButton icon="add" fullWidth onPress={() => router.push('/admin/products/new')}>Novo produto</AppButton>
      {summary.isLoading ? <LoadingState label="Carregando indicadores..." /> : summary.isError ? <ErrorState message={friendlyError(summary.error)} onRetry={() => summary.refetch()} /> : summary.data ? <>
        <View style={[styles.heroMetric, { backgroundColor: colors.hero, borderColor: colors.heroLine, borderWidth: 1 }]}><View style={styles.metricIcon}><Ionicons name="wallet-outline" size={24} color={colors.accent} /></View><AppText color="secondary">Valor em estoque</AppText><AppText variant="display">{formatCurrency(summary.data.total_inventory_value)}</AppText><AppText variant="caption" color="secondary">Inclui produtos ativos e inativos</AppText></View>
        <View style={styles.metricGrid}>{metrics.map(([label, value, icon]) => <View key={label} style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name={icon} size={21} color={colors.accent} /><AppText variant="caption" color="secondary">{label}</AppText><AppText variant="section" numberOfLines={1}>{value}</AppText></View>)}</View>
      </> : null}
      <SectionHeading title="Atenção necessária" /><View style={styles.attention}><AppButton variant="secondary" icon="alert-circle-outline" onPress={() => router.push({ pathname: '/admin/products', params: { stock_status: 'LOW_STOCK' } })}>Ver estoque baixo</AppButton><AppButton variant="secondary" icon="image-outline" onPress={() => router.push({ pathname: '/admin/products', params: { has_photo: 'false' } })}>Ver produtos sem foto</AppButton></View>
      <SectionHeading title="Valor por categoria" />{byCategory.isLoading ? <LoadingState /> : byCategory.isError ? <ErrorState message={friendlyError(byCategory.error)} onRetry={() => byCategory.refetch()} /> : categories.length === 0 ? <AppText color="secondary">Nenhuma categoria com produtos.</AppText> : <View style={styles.bars}>{categories.map((item) => <View key={item.category_id} style={styles.barItem}><View style={styles.barLabels}><AppText variant="support" numberOfLines={1}>{item.category_name}</AppText><AppText variant="caption" color="secondary">{formatCurrency(item.total_value)}</AppText></View><View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}><View style={[styles.fill, { backgroundColor: colors.accent, width: `${item.total_value / maxCategory * 100}%` }]} /></View></View>)}</View>}
      <SectionHeading title="Faixas de preço" />{ranges.isLoading ? <LoadingState /> : ranges.isError ? <ErrorState message={friendlyError(ranges.error)} onRetry={() => ranges.refetch()} /> : <View style={styles.bars}>{ranges.data?.map((item) => <View key={item.range} style={styles.barItem}><View style={styles.barLabels}><AppText variant="support">{item.range}</AppText><AppText variant="caption" color="secondary">{item.count} produtos</AppText></View><View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}><View style={[styles.fill, { backgroundColor: colors.success, width: `${item.count / maxRange * 100}%` }]} /></View></View>)}</View>}
    </ScrollView>
  </ScreenScaffold>;
}

const styles = StyleSheet.create({ headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, content: { paddingVertical: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xl }, heroMetric: { padding: spacing.xxl, borderRadius: radius.lg, gap: spacing.sm }, metricIcon: { alignSelf: 'flex-start' }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, metric: { width: '47%', flexGrow: 1, minHeight: 112, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm }, attention: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, bars: { gap: spacing.lg }, barItem: { gap: spacing.sm }, barLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }, track: { height: 9, borderRadius: 5, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 5 } });
