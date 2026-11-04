import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppButton, AppHeader, AppInput, AppModal, AppText, ConfirmDialog, EmptyState, ErrorState, FilterChip, IconButton, InlineError, LoadingState, ScreenScaffold, SearchField } from '@/components/ui/core';
import { ApiError, friendlyError } from '@/lib/api/client';
import { categoriesApi, dashboardApi } from '@/lib/api/services';
import type { Category } from '@/lib/api/types';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';

type CategorySort = 'value' | 'products' | 'name';
export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const metrics = useQuery({ queryKey: ['dashboard', 'categories'], queryFn: dashboardApi.productsByCategory });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CategorySort>('value');
  const [editing, setEditing] = useState<Category | null | 'new'>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const detail = useQuery({ queryKey: ['category', viewing], queryFn: () => categoriesApi.get(viewing!), enabled: !!viewing });
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const invalidate = async () => {
    await Promise.all([['categories'], ['category'], ['dashboard'], ['admin', 'products'], ['catalog'], ['product']].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };
  const save = useMutation({
    mutationFn: () => editing === 'new' ? categoriesApi.create(name.trim()) : categoriesApi.update((editing as Category).id, name.trim()),
    onSuccess: async () => { setEditing(null); setName(''); setError(''); setSearch(''); setNotice('Categoria salva.'); await invalidate(); },
    onError: (cause) => setError(friendlyError(cause)),
  });
  const remove = useMutation({
    mutationFn: (category: Category) => categoriesApi.remove(category.id),
    onSuccess: async () => { setDeleting(null); setError(''); setNotice('Categoria excluída.'); await invalidate(); },
    onError: (cause) => { setDeleting(null); setError(cause instanceof ApiError && cause.status === 409 ? 'Mova ou exclua os produtos desta categoria antes de removê-la.' : friendlyError(cause)); },
  });
  const open = (category: Category | 'new') => { setEditing(category); setName(category === 'new' ? '' : category.name); setError(''); };
  const submit = () => { if (save.isPending) return; if (!name.trim()) { setError('Informe o nome da categoria.'); return; } save.mutate(); };
  const rows = (categories.data ?? []).map((category) => {
    const prices = category.products.map((product) => product.price);
    return { ...category, count: prices.length, value: metrics.data?.find((row) => row.category_id === category.id)?.total_value ?? 0,
      average: prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
      min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  });
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const visible = rows.filter((row) => row.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).sort((a, b) =>
    (sort === 'name' ? 0 : sort === 'products' ? b.count - a.count : b.value - a.value) || a.name.localeCompare(b.name, 'pt-BR'));
  const refresh = async () => { await Promise.all([categories.refetch(), metrics.refetch()]); };
  const manage = (id: string) => { setViewing(null); router.push({ pathname: '/admin/products', params: { category_id: id } }); };
  const kpis = [['Categorias', rows.length], ['Produtos cadastrados', rows.reduce((sum, row) => sum + row.count, 0)], ['Valor em estoque', metrics.isSuccess ? formatCurrency(totalValue) : '—'], ['Categorias vazias', rows.filter((row) => !row.count).length]];

  return <ScreenScaffold bottomSafe={false}><AppHeader title="Categorias" subtitle="Organize e acompanhe seu catálogo" right={<IconButton icon="add" label="Nova categoria" onPress={() => open('new')} />} />
    {categories.isLoading ? <LoadingState label="Carregando categorias..." /> : categories.isError ? <ErrorState message={friendlyError(categories.error)} onRetry={() => categories.refetch()} /> : <FlatList data={visible} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={categories.isRefetching || metrics.isRefetching} onRefresh={refresh} tintColor={colors.accent} />}
      ListHeaderComponent={<View style={styles.header}>
        {notice ? <View accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: colors.successSoft }]}><AppText color="success" variant="support" style={styles.flex}>{notice}</AppText><IconButton icon="close" label="Fechar aviso" onPress={() => setNotice('')} /></View> : null}
        {error && !editing ? <InlineError>{error}</InlineError> : null}
        <View style={styles.kpis}>{kpis.map(([label, value]) => <View key={label} style={[styles.kpi, { backgroundColor: colors.surface, borderColor: colors.border }]}><AppText variant="caption" color="secondary">{label}</AppText><AppText variant="section">{value}</AppText></View>)}</View>
        {metrics.isError ? <><InlineError>Os valores em estoque não estão disponíveis.</InlineError><AppButton variant="ghost" onPress={() => metrics.refetch()}>Atualizar indicadores</AppButton></> : null}
        <AppText variant="section">Uma visão de cada categoria.</AppText><AppText variant="caption" color="secondary">Inclui produtos ativos e inativos. Valor = preço × quantidade em estoque.</AppText>
        <SearchField value={search} onChangeText={setSearch} placeholder="Buscar categoria" />
        <View style={styles.wrap}>{([['Maior valor', 'value'], ['Mais produtos', 'products'], ['Nome A–Z', 'name']] as const).map(([label, value]) => <FilterChip key={value} label={label} selected={sort === value} onPress={() => setSort(value)} />)}</View><AppText color="secondary" variant="caption">{visible.length} categorias exibidas</AppText>
      </View>}
      renderItem={({ item }) => <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}><View style={[styles.categoryIcon, { backgroundColor: colors.accentSoft }]}><Ionicons name="layers-outline" size={24} color={colors.accent} /></View><AppText variant="caption" color="secondary">{item.count} {item.count === 1 ? 'produto' : 'produtos'}</AppText></View>
        <AppText variant="section">{item.name}</AppText><View><AppText variant="caption" color="secondary">Valor em estoque</AppText><AppText variant="heading">{metrics.isSuccess ? formatCurrency(item.value) : '—'}</AppText></View>
        <View style={styles.statRow}><AppText variant="caption" color="secondary">Participação no estoque</AppText><AppText variant="caption">{metrics.isSuccess ? `${Math.round(totalValue ? item.value / totalValue * 100 : 0)}%` : '—'}</AppText></View>
        <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}><View style={[styles.fill, { backgroundColor: colors.accentSolid, width: `${totalValue ? item.value / totalValue * 100 : 0}%` }]} /></View>
        <View style={styles.wrap}><View style={styles.flex}><AppText variant="caption" color="secondary">Preço médio</AppText><AppText variant="support">{item.count ? formatCurrency(item.average) : '—'}</AppText></View><View style={styles.flex}><AppText variant="caption" color="secondary">Faixa de preços</AppText><AppText variant="support">{item.count ? `${formatCurrency(item.min)} – ${formatCurrency(item.max)}` : '—'}</AppText></View></View>
        <View style={[styles.actions, { borderTopColor: colors.border }]}><AppButton variant="secondary" onPress={() => setViewing(item.id)}>Visualizar</AppButton><IconButton icon="pencil-outline" label={`Editar ${item.name}`} onPress={() => open(item)} /><IconButton icon="trash-outline" label={`Excluir ${item.name}`} onPress={() => { setError(''); setDeleting(item); }} /></View><AppButton variant="ghost" icon="arrow-forward-outline" onPress={() => manage(item.id)}>Ver produtos</AppButton>
      </View>}
      ListEmptyComponent={<EmptyState title={search ? 'Nenhuma categoria encontrada.' : 'Seu catálogo ainda não tem categorias.'} actionLabel={search ? 'Limpar busca' : 'Criar primeira categoria'} onAction={search ? () => setSearch('') : () => open('new')} />} />}
    <AppModal visible={editing != null} title={editing === 'new' ? 'Nova categoria' : 'Editar categoria'} closeDisabled={save.isPending} onClose={() => setEditing(null)}><AppInput label="Nome da categoria" value={name} onChangeText={setName} error={error || undefined} autoFocus returnKeyType="done" onSubmitEditing={submit} /><AppButton fullWidth loading={save.isPending} onPress={submit}>{editing === 'new' ? 'Criar categoria' : 'Salvar alterações'}</AppButton></AppModal>
    <AppModal visible={!!viewing} title={detail.data?.name ?? 'Detalhes da categoria'} onClose={() => setViewing(null)}>
      {detail.isLoading ? <LoadingState /> : detail.isError ? <ErrorState message={friendlyError(detail.error)} onRetry={() => detail.refetch()} /> : detail.data ? <>
        <AppText color="secondary">{detail.data.products.length} produtos vinculados</AppText><AppText variant="caption" color="secondary">Identificador: {detail.data.id}</AppText>
        {detail.data.products.length ? detail.data.products.map((product) => <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`Ver ${product.name}`} onPress={() => { setViewing(null); router.push({ pathname: '/admin/products/[id]', params: { id: product.id } }); }} style={[styles.linkedProduct, { borderBottomColor: colors.border }]}><AppText variant="support" style={styles.flex}>{product.name}</AppText><AppText color="secondary" variant="support">{formatCurrency(product.price)}</AppText><Ionicons name="chevron-forward" size={18} color={colors.accent} /></Pressable>) : <AppText color="secondary">Esta categoria ainda não tem produtos.</AppText>}
        <AppButton fullWidth onPress={() => manage(detail.data.id)}>Gerenciar produtos</AppButton><AppButton variant="secondary" onPress={() => { const category = detail.data; setViewing(null); open(category); }}>Editar categoria</AppButton>
      </> : null}
    </AppModal>
    <ConfirmDialog visible={!!deleting} title="Excluir categoria?" description={deleting ? `A categoria “${deleting.name}” será removida. Categorias com produtos precisam ser esvaziadas antes da exclusão.` : ''} confirmLabel="Excluir categoria" destructive loading={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting && !remove.isPending) remove.mutate(deleting); }} />
  </ScreenScaffold>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, list: { paddingVertical: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }, header: { gap: spacing.lg }, kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, kpi: { flexGrow: 1, width: '46%', borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }, card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, categoryIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, track: { height: 7, borderRadius: 4, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, borderTopWidth: 1, paddingTop: spacing.lg }, linkedProduct: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, paddingVertical: spacing.sm }, notice: { padding: spacing.sm, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center' } });
