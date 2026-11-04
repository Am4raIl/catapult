import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ProductCard } from '@/components/product';
import { AppButton, AppInput, AppModal, AppText, EmptyState, ErrorState, FilterChip, IconButton, ScreenScaffold, SearchField, ThemeSelector, InlineError } from '@/components/ui/core';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { friendlyError } from '@/lib/api/client';
import { categoriesApi, productsApi } from '@/lib/api/services';
import type { StockStatusApi } from '@/lib/api/types';
import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { formatCurrency, parseMoney } from '@/utils/format';

type SortOption = 'name,asc' | 'price,asc' | 'price,desc';

export default function CatalogScreen() {
  const { colors } = useAppTheme();
  const cart = useCart();
  const { status } = useAuth();
  const listRef = useRef<FlatList>(null);
  const [feedback, setFeedback] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<boolean | undefined>();
  const [draftStock, setDraftStock] = useState<StockStatusApi | undefined>();
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
    queryFn: ({ pageParam, signal }) => productsApi.list({ page: pageParam, size: 12, active: true, nome: debouncedSearch, category_id: categoryId, min_price: filters.min, max_price: filters.max, has_photo: filters.hasPhoto, stock_status: filters.stock, sort }, signal),
    getNextPageParam: (last) => last.last ? undefined : last.number + 1,
  });
  const items = useMemo(() => Array.from(new Map((products.data?.pages.flatMap((page) => page.content.filter((product) => product.active)) ?? []).map((product) => [product.id, product])).values()), [products.data]);
  const activeFilterCount = [filters.min != null || filters.max != null, filters.hasPhoto != null, !!filters.stock].filter(Boolean).length;
  const hasCriteria = !!debouncedSearch || !!categoryId || activeFilterCount > 0;

  const clearFilters = () => { setCategoryId(undefined); setFilters({}); setDraftMin(''); setDraftMax(''); setSearch(''); };
  const applyFilters = () => {
    const min = parseMoney(draftMin) ?? undefined;
    const max = parseMoney(draftMax) ?? undefined;
    if ((draftMin.trim() && (min == null || !Number.isFinite(min) || min < 0)) || (draftMax.trim() && (max == null || !Number.isFinite(max) || max < 0))) { setFilterError('Informe preços válidos, iguais ou maiores que zero.'); return; }
    if (min != null && max != null && min > max) { setFilterError('O preço mínimo não pode ser maior que o máximo.'); return; }
    setFilters((current) => ({ ...current, min, max, hasPhoto: draftPhoto, stock: draftStock })); setFilterError(''); setFilterOpen(false);
  };

  const header = <View style={styles.headerContent}>
    <View style={styles.brandRow}><View style={styles.brand}><View style={[styles.brandMark, { backgroundColor: colors.accentSolid }]}><Ionicons name="layers-outline" color={colors.accentOnSolid} size={20} /></View><AppText variant="section" color="accent">Catapult</AppText></View><View style={styles.toolButtons}><ThemeSelector /><View><IconButton icon="bag-handle-outline" label={`Abrir sacola, ${cart.count} itens`} onPress={() => router.push('/cart')} />{cart.count > 0 ? <View pointerEvents="none" style={[styles.bagCount, { backgroundColor: colors.accentSolid }]}><AppText variant="caption" color="onAccent">{cart.count > 99 ? '99+' : cart.count}</AppText></View> : null}</View><IconButton icon="person-outline" label="Área do administrador" onPress={() => router.push(status === 'authenticated' ? '/admin' : '/login')} /></View></View>
    <View style={[styles.hero, { backgroundColor: colors.hero, borderColor: colors.heroLine }]}>
      <AppText variant="caption" color="accent" style={styles.eyebrow}>ESCOLHAS QUE MOVEM VOCÊ</AppText>
      <AppText variant="display">Boas escolhas.{'\n'}<AppText variant="display" color="accent">Novas possibilidades.</AppText></AppText>
      <AppText color="secondary">Encontre o que combina com o seu dia. Explore, descubra e escolha seu próximo favorito.</AppText>
      <AppButton icon="arrow-forward" onPress={() => listRef.current?.scrollToOffset({ offset: 310, animated: true })}>Explorar catálogo</AppButton>
    </View>
    {feedback ? <View accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: colors.accentSoft }]}><AppText variant="support" style={{ flex: 1 }}>{feedback}</AppText><AppButton variant="ghost" onPress={() => router.push('/cart')}>Ver sacola ({cart.count})</AppButton><IconButton icon="close" label="Fechar aviso" onPress={() => setFeedback('')} /></View> : null}
    <SearchField value={search} onChangeText={setSearch} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><FilterChip label="Todas" selected={!categoryId} onPress={() => setCategoryId(undefined)} />{[...(categories.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((category) => <FilterChip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />)}</ScrollView>
    <View style={styles.tools}><AppText variant="section">Produtos</AppText><View style={styles.toolButtons}><AppButton variant="secondary" icon="options-outline" onPress={() => { setDraftMin(filters.min == null ? '' : String(filters.min).replace('.', ',')); setDraftMax(filters.max == null ? '' : String(filters.max).replace('.', ',')); setDraftPhoto(filters.hasPhoto); setDraftStock(filters.stock); setFilterError(''); setFilterOpen(true); }}>Filtrar{activeFilterCount ? ` (${activeFilterCount})` : ''}</AppButton><IconButton icon="swap-vertical-outline" label="Ordenar" onPress={() => setSortOpen(true)} /></View></View>
    {categories.isError ? <><InlineError>Não foi possível carregar as categorias.</InlineError><AppButton variant="ghost" onPress={() => categories.refetch()}>Tentar novamente</AppButton></> : null}
    {hasCriteria ? <Pressable accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }} onPress={clearFilters}><AppText variant="support" color="accent">Limpar busca e filtros</AppText></Pressable> : null}
  </View>;

  return <ScreenScaffold padded={false}><FlatList ref={listRef} key={`catalog-${columns}`} data={items} numColumns={columns} keyExtractor={(item) => item.id} columnWrapperStyle={columns > 1 ? styles.columns : undefined} renderItem={({ item }) => <View style={[styles.cardSlot, columns === 1 && styles.cardSlotSingle]}><ProductCard product={item} locked={!cart.ready || !!cart.pending} onBuy={() => { setFeedback(cart.add(item) ? `${item.name} adicionado à sacola.` : cart.pending ? 'Confirme a compra pendente na sacola.' : 'A quantidade disponível já está na sacola.'); }} onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })} /></View>} ListHeaderComponent={header} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={products.isRefetching && !products.isFetchingNextPage} onRefresh={async () => { await Promise.all([products.refetch(), categories.refetch()]); }} tintColor={colors.accent} />} onEndReached={() => { if (products.hasNextPage && !products.isFetchingNextPage) products.fetchNextPage(); }} onEndReachedThreshold={0.35} ListFooterComponent={products.isFetchNextPageError ? <ErrorState message="Não foi possível carregar mais produtos." onRetry={() => products.fetchNextPage()} /> : products.isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={styles.footer} /> : products.hasNextPage ? <AppButton variant="ghost" onPress={() => products.fetchNextPage()}>Carregar mais produtos</AppButton> : items.length ? <AppText variant="caption" color="secondary" style={styles.end}>Fim do catálogo</AppText> : undefined} ListEmptyComponent={products.isLoading ? <View style={styles.loadingGrid}><ActivityIndicator size="large" color={colors.accent} /><AppText color="secondary">Carregando produtos...</AppText></View> : products.isError ? <ErrorState message={friendlyError(products.error)} onRetry={() => products.refetch()} /> : <EmptyState title={hasCriteria ? 'Nenhum produto encontrado' : 'Ainda não há produtos no catálogo'} description={hasCriteria ? 'Tente remover alguns filtros.' : 'Os produtos ativos aparecerão aqui.'} actionLabel={hasCriteria ? 'Limpar filtros' : undefined} onAction={hasCriteria ? clearFilters : undefined} />} />
    {cart.count > 0 ? <View style={[styles.bagBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}><View style={{ flex: 1 }}><AppText variant="caption" color="secondary">{cart.count} {cart.count === 1 ? 'item na sacola' : 'itens na sacola'}</AppText><AppText variant="section">{formatCurrency(cart.total)}</AppText></View><AppButton icon="bag-handle-outline" onPress={() => router.push('/cart')}>{cart.pending ? 'Confirmar compra' : 'Ver sacola'}</AppButton></View> : null}
    <AppModal visible={filterOpen} title="Filtrar produtos" onClose={() => setFilterOpen(false)}><AppInput label="Preço mínimo" value={draftMin} onChangeText={setDraftMin} keyboardType="decimal-pad" placeholder="0,00" /><AppInput label="Preço máximo" value={draftMax} onChangeText={setDraftMax} keyboardType="decimal-pad" placeholder="0,00" error={filterError} /><AppText variant="support">Arquivo</AppText><View style={styles.wrap}><FilterChip label="Todos" selected={draftPhoto == null} onPress={() => setDraftPhoto(undefined)} /><FilterChip label="Com foto" selected={draftPhoto === true} onPress={() => setDraftPhoto(true)} /><FilterChip label="Sem foto" selected={draftPhoto === false} onPress={() => setDraftPhoto(false)} /></View><AppText variant="support">Estoque</AppText><View style={styles.wrap}>{([['Todos', undefined], ['Em estoque', 'IN_STOCK'], ['Estoque baixo', 'LOW_STOCK'], ['Esgotado', 'OUT_OF_STOCK']] as const).map(([label, value]) => <FilterChip key={label} label={label} selected={draftStock === value} onPress={() => setDraftStock(value)} />)}</View><View style={styles.modalActions}><AppButton variant="secondary" onPress={() => { setDraftMin(''); setDraftMax(''); setDraftPhoto(undefined); setDraftStock(undefined); setFilterError(''); }}>Limpar</AppButton><AppButton onPress={applyFilters}>Aplicar filtros</AppButton></View></AppModal>
    <AppModal visible={sortOpen} title="Ordenar produtos" onClose={() => setSortOpen(false)}>{([['Nome A–Z', 'name,asc'], ['Menor preço', 'price,asc'], ['Maior preço', 'price,desc']] as const).map(([label, value]) => <FilterChip key={value} label={label} selected={sort === value} onPress={() => { setSort(value); setSortOpen(false); }} />)}</AppModal>
  </ScreenScaffold>;
}

const styles = StyleSheet.create({ list: { paddingBottom: spacing.huge }, headerContent: { paddingHorizontal: spacing.xl, gap: spacing.lg, paddingBottom: spacing.lg }, brandRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, bagBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, bagCount: { position: 'absolute', right: -4, top: -4, minWidth: 22, minHeight: 22, paddingHorizontal: 4, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, brandMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, adminLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }, hero: { gap: spacing.lg, padding: spacing.xxl, borderRadius: 28, borderWidth: 1, alignItems: 'flex-start' }, eyebrow: { letterSpacing: 1.4, fontWeight: '700' }, feedback: { padding: spacing.sm, borderRadius: radius.md, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs }, chips: { gap: spacing.sm }, tools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, toolButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, columns: { paddingHorizontal: spacing.lg, gap: spacing.md }, cardSlot: { flex: 1, maxWidth: '50%', marginBottom: spacing.md }, cardSlotSingle: { maxWidth: '100%', marginHorizontal: spacing.xl }, footer: { padding: spacing.xl }, end: { textAlign: 'center', padding: spacing.xl }, loadingGrid: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: spacing.md }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md } });
