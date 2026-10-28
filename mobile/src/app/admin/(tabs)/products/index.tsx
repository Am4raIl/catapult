import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ProductRow } from '@/components/product';
import { AppButton, AppHeader, AppModal, AppText, EmptyState, ErrorState, FilterChip, IconButton, InlineError, LoadingState, ScreenScaffold, SearchField } from '@/components/ui/core';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { friendlyError } from '@/lib/api/client';
import { categoriesApi, productsApi } from '@/lib/api/services';
import type { Product, SpringPage, StockStatusApi } from '@/lib/api/types';
import { useAppTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

type PendingStock = { desired: number; committed: number; running: boolean };

export default function AdminProductsScreen() {
  const params = useLocalSearchParams<{ stock_status?: string; has_photo?: string }>();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [stock, setStock] = useState<StockStatusApi | undefined>(params.stock_status as StockStatusApi | undefined);
  const [hasPhoto, setHasPhoto] = useState<boolean | undefined>(params.has_photo === 'false' ? false : params.has_photo === 'true' ? true : undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [stockError, setStockError] = useState('');
  const pending = useRef<Record<string, PendingStock>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const queryKey = ['admin', 'products', { page, debouncedSearch, categoryId, stock, hasPhoto }] as const;
  const products = useQuery({ queryKey, queryFn: ({ signal }) => productsApi.list({ page, size: 10, nome: debouncedSearch, category_id: categoryId, stock_status: stock, has_photo: hasPhoto, sort: 'name,asc' }, signal), placeholderData: (previous) => previous });

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const patchCachedQuantity = (id: string, quantity: number) => queryClient.setQueryData<SpringPage<Product>>(queryKey, (current) => current ? { ...current, content: current.content.map((item) => item.id === id ? { ...item, stock_quantity: quantity } : item) } : current);
  const saveStock = async (id: string) => {
    const entry = pending.current[id];
    if (!entry || entry.running) return;
    entry.running = true;
    setSaving((current) => new Set(current).add(id));
    while (entry.desired !== entry.committed) {
      const target = entry.desired;
      try {
        const updated = await productsApi.updateStock(id, target);
        entry.committed = updated.stock_quantity;
        if (entry.desired === target) patchCachedQuantity(id, updated.stock_quantity);
        queryClient.setQueryData(['product', id], updated);
      } catch (error) {
        entry.desired = entry.committed;
        patchCachedQuantity(id, entry.committed);
        setStockError(`Não foi possível salvar o estoque. ${friendlyError(error)}`);
        break;
      }
    }
    entry.running = false;
    setSaving((current) => { const next = new Set(current); next.delete(id); return next; });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const adjustStock = (product: Product, delta: number) => {
    setStockError('');
    const entry = pending.current[product.id] ?? { desired: product.stock_quantity, committed: product.stock_quantity, running: false };
    entry.desired = Math.max(0, entry.desired + delta);
    pending.current[product.id] = entry;
    patchCachedQuantity(product.id, entry.desired);
    clearTimeout(timers.current[product.id]);
    timers.current[product.id] = setTimeout(() => saveStock(product.id), 350);
  };
  const stop = (event: NativeSyntheticEvent<any>) => event.stopPropagation();
  const clearFilters = () => { setSearch(''); setCategoryId(undefined); setStock(undefined); setHasPhoto(undefined); setPage(0); };
  const hasFilters = !!search || !!categoryId || !!stock || hasPhoto != null;

  return <ScreenScaffold><AppHeader title="Produtos" subtitle={products.data ? `${products.data.totalElements} cadastrados` : undefined} right={<AppButton icon="add" onPress={() => router.push('/admin/products/new')}>Novo</AppButton>} />
    <View style={styles.filters}><SearchField value={search} onChangeText={(value) => { setSearch(value); setPage(0); }} /><View style={styles.filterRow}><AppButton variant="secondary" icon="options-outline" onPress={() => setFilterOpen(true)}>Filtros</AppButton>{hasFilters ? <AppButton variant="ghost" onPress={clearFilters}>Limpar</AppButton> : null}</View></View>
    {stockError ? <InlineError>{stockError}</InlineError> : null}
    {products.isLoading ? <LoadingState label="Carregando produtos..." /> : products.isError ? <ErrorState message={friendlyError(products.error)} onRetry={() => products.refetch()} /> : <ScrollView refreshControl={<RefreshControl refreshing={products.isRefetching} onRefresh={async () => { await products.refetch(); }} tintColor={colors.accent} />} contentContainerStyle={styles.list}>{products.data?.content.length ? products.data.content.map((product) => <ProductRow key={product.id} product={product} onPress={() => router.push({ pathname: '/admin/products/[id]', params: { id: product.id } })} stockControl={<View style={styles.stockControl}><Pressable accessibilityRole="button" accessibilityLabel={`Diminuir estoque de ${product.name}`} disabled={product.stock_quantity === 0} onPress={(event) => { stop(event); adjustStock(product, -1); }} style={({ pressed }) => [styles.stockButton, { borderColor: colors.border, opacity: product.stock_quantity === 0 ? 0.35 : pressed ? 0.6 : 1 }]}><AppText variant="section">−</AppText></Pressable><View style={styles.quantity}><AppText variant="support">{product.stock_quantity}</AppText>{saving.has(product.id) ? <AppText variant="caption" color="secondary">Salvando...</AppText> : null}</View><Pressable accessibilityRole="button" accessibilityLabel={`Aumentar estoque de ${product.name}`} onPress={(event) => { stop(event); adjustStock(product, 1); }} style={({ pressed }) => [styles.stockButton, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}><AppText variant="section">+</AppText></Pressable></View>} />) : <EmptyState title={hasFilters ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'} description={hasFilters ? 'Tente remover alguns filtros.' : 'Cadastre o primeiro item do catálogo.'} actionLabel={hasFilters ? 'Limpar filtros' : 'Cadastrar produto'} onAction={hasFilters ? clearFilters : () => router.push('/admin/products/new')} />}{products.data && products.data.totalPages > 1 ? <View style={styles.pagination}><IconButton icon="chevron-back" label="Página anterior" disabled={products.data.first || products.isFetching} onPress={() => setPage((value) => Math.max(0, value - 1))} /><AppText variant="support">Página {products.data.number + 1} de {products.data.totalPages}</AppText><IconButton icon="chevron-forward" label="Próxima página" disabled={products.data.last || products.isFetching} onPress={() => setPage((value) => value + 1)} /></View> : null}</ScrollView>}
    <AppModal visible={filterOpen} title="Filtrar produtos" onClose={() => setFilterOpen(false)}><AppText variant="support">Categoria</AppText><View style={styles.wrap}><FilterChip label="Todas" selected={!categoryId} onPress={() => { setCategoryId(undefined); setPage(0); }} />{[...(categories.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <FilterChip key={item.id} label={item.name} selected={categoryId === item.id} onPress={() => { setCategoryId(item.id); setPage(0); }} />)}</View><AppText variant="support">Estoque</AppText><View style={styles.wrap}>{([['Todos', undefined], ['Em estoque', 'IN_STOCK'], ['Baixo', 'LOW_STOCK'], ['Esgotado', 'OUT_OF_STOCK']] as const).map(([label, value]) => <FilterChip key={label} label={label} selected={stock === value} onPress={() => { setStock(value); setPage(0); }} />)}</View><AppText variant="support">Arquivo</AppText><View style={styles.wrap}><FilterChip label="Todos" selected={hasPhoto == null} onPress={() => { setHasPhoto(undefined); setPage(0); }} /><FilterChip label="Com foto" selected={hasPhoto === true} onPress={() => { setHasPhoto(true); setPage(0); }} /><FilterChip label="Sem foto" selected={hasPhoto === false} onPress={() => { setHasPhoto(false); setPage(0); }} /></View><AppButton fullWidth onPress={() => setFilterOpen(false)}>Aplicar filtros</AppButton></AppModal>
  </ScreenScaffold>;
}

const styles = StyleSheet.create({ filters: { gap: spacing.md, paddingVertical: spacing.lg }, filterRow: { flexDirection: 'row', gap: spacing.sm }, list: { gap: spacing.md, paddingBottom: 100 }, stockControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }, stockButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, quantity: { minWidth: 54, alignItems: 'center' }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.lg }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
