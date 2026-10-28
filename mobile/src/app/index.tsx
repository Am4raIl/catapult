import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ProductCard } from '@/components/product';
import { AppButton, AppInput, AppModal, AppText, EmptyState, ErrorState, FilterChip, IconButton, ScreenScaffold, SearchField } from '@/components/ui/core';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { friendlyError } from '@/lib/api/client';
import { categoriesApi, productsApi } from '@/lib/api/services';
import type { StockStatusApi } from '@/lib/api/types';
import { useAppTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';
import { parseMoney } from '@/utils/format';

type SortOption = 'name,asc' | 'price,asc' | 'price,desc';

export default function CatalogScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const columns = width < 350 ? 1 : 2;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>('name,asc');
  const [filters, setFilters] = useState<{ min?: number; max?: number; hasPhoto?: boolean; stock?: StockStatusApi }>({});
  const [draftMin, setDraftMin] = useState('');
  const [draftMax, setDraftMax] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterError, setFilterError] = useState('');

  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const products = useInfiniteQuery({
    queryKey: ['catalog', debouncedSearch, categoryId, filters, sort],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => productsApi.list({ page: pageParam, size: 12, nome: debouncedSearch, category_id: categoryId, min_price: filters.min, max_price: filters.max, has_photo: filters.hasPhoto, stock_status: filters.stock, sort }, signal),
    getNextPageParam: (last) => last.last ? undefined : last.number + 1,
  });
  const items = useMemo(() => products.data?.pages.flatMap((page) => page.content.filter((product) => product.active)) ?? [], [products.data]);
  const activeFilterCount = [filters.min != null || filters.max != null, filters.hasPhoto != null, !!filters.stock].filter(Boolean).length;
  const hasCriteria = !!debouncedSearch || !!categoryId || activeFilterCount > 0;

  const clearFilters = () => { setCategoryId(undefined); setFilters({}); setDraftMin(''); setDraftMax(''); setSearch(''); };
  const applyFilters = () => {
    const min = parseMoney(draftMin) ?? undefined;
    const max = parseMoney(draftMax) ?? undefined;
    if (min != null && max != null && min > max) { setFilterError('O preço mínimo não pode ser maior que o máximo.'); return; }
    setFilters((current) => ({ ...current, min, max })); setFilterError(''); setFilterOpen(false);
  };

  const header = <View style={styles.headerContent}>
    <View style={styles.brandRow}><View style={styles.brand}><View style={[styles.brandMark, { backgroundColor: colors.accent }]}><Ionicons name="cube" color={colors.accentOnSolid} size={19} /></View><AppText variant="section">Catapult</AppText></View><Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.adminLink}><Ionicons name="lock-closed-outline" size={17} color={colors.textSecondary} /><AppText variant="support" color="secondary">Admin</AppText></Pressable></View>
    <View style={styles.hero}><AppText variant="display">Explore o catálogo</AppText><AppText color="secondary">Encontre o que você procura.</AppText></View>
    <SearchField value={search} onChangeText={setSearch} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><FilterChip label="Todas" selected={!categoryId} onPress={() => setCategoryId(undefined)} />{[...(categories.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((category) => <FilterChip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />)}</ScrollView>
    <View style={styles.tools}><AppText variant="section">Produtos</AppText><View style={styles.toolButtons}><AppButton variant="secondary" icon="options-outline" onPress={() => setFilterOpen(true)}>Filtrar{activeFilterCount ? ` (${activeFilterCount})` : ''}</AppButton><IconButton icon="swap-vertical-outline" label="Ordenar" onPress={() => setSortOpen(true)} /></View></View>
    {hasCriteria ? <Pressable onPress={clearFilters}><AppText variant="support" color="accent">Limpar busca e filtros</AppText></Pressable> : null}
  </View>;

  return <ScreenScaffold padded={false}><FlatList key={`catalog-${columns}`} data={items} numColumns={columns} keyExtractor={(item) => item.id} columnWrapperStyle={columns > 1 ? styles.columns : undefined} renderItem={({ item }) => <View style={[styles.cardSlot, columns === 1 && styles.cardSlotSingle]}><ProductCard product={item} onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })} /></View>} ListHeaderComponent={header} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={products.isRefetching && !products.isFetchingNextPage} onRefresh={async () => { await products.refetch(); }} tintColor={colors.accent} />} onEndReached={() => { if (products.hasNextPage && !products.isFetchingNextPage) products.fetchNextPage(); }} onEndReachedThreshold={0.35} ListFooterComponent={products.isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={styles.footer} /> : products.hasNextPage ? undefined : items.length ? <AppText variant="caption" color="secondary" style={styles.end}>Fim do catálogo</AppText> : undefined} ListEmptyComponent={products.isLoading ? <View style={styles.loadingGrid}><ActivityIndicator size="large" color={colors.accent} /><AppText color="secondary">Carregando produtos...</AppText></View> : products.isError ? <ErrorState message={friendlyError(products.error)} onRetry={() => products.refetch()} /> : <EmptyState title={hasCriteria ? 'Nenhum produto encontrado' : 'Ainda não há produtos no catálogo'} description={hasCriteria ? 'Tente remover alguns filtros.' : 'Os produtos ativos aparecerão aqui.'} actionLabel={hasCriteria ? 'Limpar filtros' : undefined} onAction={hasCriteria ? clearFilters : undefined} />} />
    <AppModal visible={filterOpen} title="Filtrar produtos" onClose={() => setFilterOpen(false)}><AppInput label="Preço mínimo" value={draftMin} onChangeText={setDraftMin} keyboardType="decimal-pad" placeholder="0,00" /><AppInput label="Preço máximo" value={draftMax} onChangeText={setDraftMax} keyboardType="decimal-pad" placeholder="0,00" error={filterError} /><AppText variant="support">Arquivo</AppText><View style={styles.wrap}><FilterChip label="Todos" selected={filters.hasPhoto == null} onPress={() => setFilters((f) => ({ ...f, hasPhoto: undefined }))} /><FilterChip label="Com foto" selected={filters.hasPhoto === true} onPress={() => setFilters((f) => ({ ...f, hasPhoto: true }))} /><FilterChip label="Sem foto" selected={filters.hasPhoto === false} onPress={() => setFilters((f) => ({ ...f, hasPhoto: false }))} /></View><AppText variant="support">Estoque</AppText><View style={styles.wrap}>{([['Todos', undefined], ['Em estoque', 'IN_STOCK'], ['Estoque baixo', 'LOW_STOCK'], ['Esgotado', 'OUT_OF_STOCK']] as const).map(([label, value]) => <FilterChip key={label} label={label} selected={filters.stock === value} onPress={() => setFilters((f) => ({ ...f, stock: value }))} />)}</View><View style={styles.modalActions}><AppButton variant="secondary" onPress={() => { setDraftMin(''); setDraftMax(''); setFilters({}); }}>Limpar</AppButton><AppButton onPress={applyFilters}>Aplicar filtros</AppButton></View></AppModal>
    <AppModal visible={sortOpen} title="Ordenar produtos" onClose={() => setSortOpen(false)}>{([['Nome A–Z', 'name,asc'], ['Menor preço', 'price,asc'], ['Maior preço', 'price,desc']] as const).map(([label, value]) => <FilterChip key={value} label={label} selected={sort === value} onPress={() => { setSort(value); setSortOpen(false); }} />)}</AppModal>
  </ScreenScaffold>;
}

const styles = StyleSheet.create({ list: { paddingBottom: spacing.huge }, headerContent: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing.lg }, brandRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, brandMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, adminLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }, hero: { gap: spacing.xs, paddingVertical: spacing.sm }, chips: { gap: spacing.sm }, tools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, toolButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, columns: { paddingHorizontal: spacing.lg, gap: spacing.md }, cardSlot: { flex: 1, marginBottom: spacing.md }, cardSlotSingle: { marginHorizontal: spacing.xl }, footer: { padding: spacing.xl }, end: { textAlign: 'center', padding: spacing.xl }, loadingGrid: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md } });
