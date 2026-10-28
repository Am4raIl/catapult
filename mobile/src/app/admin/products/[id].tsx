import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ProductMedia, StatusBadge, StockBadge } from '@/components/product';
import { AppButton, AppHeader, AppText, ConfirmDialog, ErrorState, InlineError, LoadingState, ScreenScaffold, SectionHeading } from '@/components/ui/core';
import { ApiError, friendlyError } from '@/lib/api/client';
import { productsApi } from '@/lib/api/services';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { formatCurrency, formatDate } from '@/utils/format';

export default function AdminProductDetail() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const product = useQuery({ queryKey: ['product', id], queryFn: () => productsApi.get(id), enabled: !!id });
  const remove = useMutation({
    mutationFn: () => productsApi.remove(id),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }), queryClient.invalidateQueries({ queryKey: ['catalog'] }), queryClient.invalidateQueries({ queryKey: ['categories'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]); router.replace('/admin/products'); },
    onError: (cause) => { setConfirmDelete(false); if (cause instanceof ApiError && cause.status === 404) { setError('Este produto já não existe. A lista será atualizada.'); queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); } else setError(friendlyError(cause)); },
  });
  return <ScreenScaffold><AppHeader title="Produto" onBack={() => router.back()} right={product.data ? <AppButton variant="secondary" icon="pencil-outline" onPress={() => router.push({ pathname: '/admin/products/[id]/edit', params: { id } })}>Editar</AppButton> : undefined} />{product.isLoading ? <LoadingState label="Carregando produto..." /> : product.isError ? <ErrorState message={product.error instanceof ApiError && product.error.status === 404 ? 'Produto não encontrado.' : friendlyError(product.error)} onRetry={() => product.refetch()} /> : product.data ? <ScrollView contentContainerStyle={styles.content}>{saved ? <View style={[styles.success, { backgroundColor: colors.successSoft }]}><Ionicons name="checkmark-circle" size={20} color={colors.success} /><AppText variant="support" color="success">{saved === 'create' ? 'Produto criado com sucesso.' : 'Alterações salvas.'}</AppText></View> : null}{error ? <InlineError>{error}</InlineError> : null}<ProductMedia product={product.data} /><View style={styles.title}><AppText color="secondary">{product.data.category.name}</AppText><AppText variant="heading">{product.data.name}</AppText><AppText variant="display">{formatCurrency(product.data.price)}</AppText><View style={styles.badges}><StatusBadge active={product.data.active} /><StockBadge quantity={product.data.stock_quantity} /></View></View><Section title="Estoque"><AppText variant="display">{product.data.stock_quantity}</AppText><AppText color="secondary">unidades disponíveis</AppText></Section><Section title="Dados do produto"><DataRow label="Custo" value={product.data.cost_price == null ? 'Não informado' : formatCurrency(product.data.cost_price)} /><DataRow label="Criado em" value={formatDate(product.data.created_at)} /><DataRow label="Atualizado em" value={formatDate(product.data.updated_at)} /></Section><AppButton fullWidth onPress={() => router.push({ pathname: '/admin/products/[id]/edit', params: { id } })}>Editar produto</AppButton><AppButton fullWidth variant="ghost" onPress={() => setConfirmDelete(true)}>Excluir produto</AppButton></ScrollView> : null}<ConfirmDialog visible={confirmDelete} title="Excluir produto?" description={product.data ? `“${product.data.name}” e seu arquivo serão excluídos permanentemente.` : ''} confirmLabel="Excluir produto" destructive loading={remove.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} /></ScreenScaffold>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}><SectionHeading title={title} />{children}</View>;
}
function DataRow({ label, value }: { label: string; value: string }) { return <View style={styles.dataRow}><AppText color="secondary">{label}</AppText><AppText variant="support">{value}</AppText></View>; }

const styles = StyleSheet.create({ content: { paddingVertical: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg }, success: { padding: spacing.md, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, title: { gap: spacing.sm }, badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }, section: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }, dataRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md } });
