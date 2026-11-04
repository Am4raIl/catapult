import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { StockStepper } from '@/components/admin/stock-stepper';
import { ProductCheckbox } from '@/components/admin/product-checkbox';
import { ProductRow } from '@/components/product';
import { AppButton, AppHeader, AppModal, AppText, EmptyState, ErrorState, FilterChip, IconButton, InlineError, LoadingState, ScreenScaffold, SearchField } from '@/components/ui/core';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiError, friendlyError } from '@/lib/api/client';
import { categoriesApi, productsApi } from '@/lib/api/services';
import type { Product, StockStatusApi } from '@/lib/api/types';
import { useAppTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

const statuses = [['Todos', undefined], ['Esgotado', 'OUT_OF_STOCK'], ['Baixo', 'LOW_STOCK'], ['Em estoque', 'IN_STOCK']] as const;
const validStatus = (value?: string) => statuses.some(([, status]) => status === value) ? value as StockStatusApi | undefined : undefined;

export default function AdminProductsScreen() {
  const params = useLocalSearchParams<{ stock_status?: string; has_photo?: string; category_id?: string }>();
  return <ProductsContent key={`${params.category_id ?? ''}:${params.stock_status ?? ''}:${params.has_photo ?? ''}`} params={params} />;
}

function ProductsContent({ params }: { params: { stock_status?: string; has_photo?: string; category_id?: string } }) {
  const { colors } = useAppTheme();
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState<string | undefined>(params.category_id);
  const [stock, setStock] = useState<StockStatusApi | undefined>(validStatus(params.stock_status));
  const [hasPhoto, setHasPhoto] = useState<boolean | undefined>(params.has_photo === 'false' ? false : params.has_photo === 'true' ? true : undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [stockError, setStockError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteSelection, setDeleteSelection] = useState<Product[] | null>(null);
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const products = useQuery({ queryKey: ['admin', 'products', { page, debouncedSearch, categoryId, stock, hasPhoto }], queryFn: ({ signal }) => productsApi.list({ page, size: 10, nome: debouncedSearch, category_id: categoryId, stock_status: stock, has_photo: hasPhoto, sort: 'name,asc' }, signal), placeholderData: (previous) => previous });
  const counts = useQueries({ queries: statuses.map(([, stock_status]) => ({ queryKey: ['admin', 'product-count', stock_status ?? 'ALL'], queryFn: () => productsApi.list({ size: 1, stock_status }) })) });
  const scope = JSON.stringify([page, search, debouncedSearch, categoryId, stock, hasPhoto, products.data?.content.map((product) => product.id)]);
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope, ids: [] });
  if (selection.scope !== scope) setSelection({ scope, ids: [] });
  if (products.data && !products.isPlaceholderData && !products.isFetching && page > Math.max(0, products.data.totalPages - 1)) setPage(Math.max(0, products.data.totalPages - 1));
  const selectedIds = selection.scope === scope ? selection.ids : [];
  const allSelected = !!products.data?.content.length && selectedIds.length === products.data.content.length;
  const remove = useMutation({
    mutationFn: (items: Product[]) => productsApi.removeMany(items.map((product) => product.id)),
    onSuccess: (_, items) => {
      setDeleteSelection(null);
      setSelection({ scope, ids: [] });
      setDeleteError('');
      setDeleteSuccess(`${items.length} produto(s) excluído(s).`);
      for (const product of items) client.removeQueries({ queryKey: ['product', product.id] });
      for (const queryKey of [['admin'], ['catalog'], ['categories'], ['category'], ['bag-stock'], ['dashboard']]) void client.invalidateQueries({ queryKey });
    },
    onError: (cause) => {
      setDeleteSelection(null);
      setDeleteSuccess('');
      if (cause instanceof ApiError && cause.status === 404) {
        setSelection({ scope, ids: [] });
        setDeleteError('Um dos produtos já foi removido. Nenhum outro item foi excluído. Atualize a seleção.');
        void client.invalidateQueries({ queryKey: ['admin'] });
      } else setDeleteError(`Não foi possível concluir a exclusão. ${friendlyError(cause)}`);
    },
  });
  const selectionDisabled = products.isFetching || products.isPlaceholderData || products.isError || !products.data?.content.length || search !== debouncedSearch || remove.isPending;
  const clearFilters = () => { setSearch(''); setCategoryId(undefined); setStock(undefined); setHasPhoto(undefined); setPage(0); };
  const hasFilters = !!search || !!categoryId || !!stock || hasPhoto != null;
  const refresh = async () => { await Promise.all([products.refetch(), categories.refetch(), ...counts.map((query) => query.refetch())]); };
  return <ScreenScaffold bottomSafe={false}><AppHeader title="Produtos" subtitle={products.data ? `${products.data.totalElements} produtos nesta seleção` : 'Gerencie seu estoque'} right={<AppButton icon="add" onPress={() => router.push('/admin/products/new')}>Novo</AppButton>} />
    <View style={styles.filters}><SearchField value={search} onChangeText={(text) => { setSearch(text); setPage(0); }} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{statuses.map(([label, value], index) => <FilterChip key={label} label={`${label}${counts[index].data ? ` · ${counts[index].data.totalElements}` : ''}`} selected={stock === value} onPress={() => { setStock(value); setPage(0); }} />)}</ScrollView><View style={styles.filterRow}><AppButton variant="secondary" icon="options-outline" onPress={() => setFilterOpen(true)}>Filtros{categoryId || hasPhoto != null ? ' ativos' : ''}</AppButton>{hasFilters ? <AppButton variant="ghost" onPress={clearFilters}>Limpar</AppButton> : null}</View></View>
    {stockError ? <InlineError>{stockError}</InlineError> : null}
    {deleteError ? <InlineError>{deleteError}</InlineError> : null}
    {deleteSuccess ? <View accessibilityLiveRegion="polite"><AppText color="success">{deleteSuccess}</AppText></View> : null}
    {products.data?.content.length ? <View style={styles.selection}>
      <ProductCheckbox checked={allSelected ? true : selectedIds.length ? 'mixed' : false} label="Selecionar todos desta página" showLabel disabled={selectionDisabled}
        onPress={() => setSelection({ scope, ids: allSelected ? [] : products.data!.content.map((product) => product.id) })} />
      <View accessibilityLiveRegion="polite"><AppText variant="support">{selectedIds.length} selecionado(s) nesta página</AppText></View>
      {selectedIds.length ? <View style={styles.filterRow}>
        <AppButton variant="ghost" disabled={remove.isPending} onPress={() => setSelection({ scope, ids: [] })}>Limpar</AppButton>
        <AppButton variant="danger" disabled={selectionDisabled} icon="trash-outline" onPress={() => { setDeleteError(''); setDeleteSuccess(''); setDeleteSelection(products.data!.content.filter((product) => selectedIds.includes(product.id))); }}>Excluir ({selectedIds.length})</AppButton>
      </View> : null}
    </View> : null}
    {products.isLoading ? <LoadingState label="Carregando produtos..." /> : products.isError ? <ErrorState message={friendlyError(products.error)} onRetry={() => products.refetch()} /> : <FlatList data={products.data?.content ?? []} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={products.isRefetching} onRefresh={refresh} tintColor={colors.accent} />} contentContainerStyle={styles.list}
      extraData={selectedIds}
      renderItem={({ item }) => <ProductRow product={item} onPress={() => router.push({ pathname: '/admin/products/[id]', params: { id: item.id } })}
        selectionControl={<ProductCheckbox label={`Selecionar ${item.name}`} checked={selectedIds.includes(item.id)} disabled={selectionDisabled} onPress={() => setSelection({ scope, ids: selectedIds.includes(item.id) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id] })} />}
        stockControl={<StockStepper product={item} disabled={products.isPlaceholderData || remove.isPending} onError={setStockError} />} />}
      ListEmptyComponent={<EmptyState title={hasFilters ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'} description={hasFilters ? 'Tente remover alguns filtros.' : 'Cadastre o primeiro item do catálogo.'} actionLabel={hasFilters ? 'Limpar filtros' : 'Cadastrar produto'} onAction={hasFilters ? clearFilters : () => router.push('/admin/products/new')} />}
      ListFooterComponent={products.data && products.data.totalPages > 1 ? <View style={styles.pagination}><IconButton icon="chevron-back" label="Página anterior" disabled={products.data.first || products.isFetching} onPress={() => setPage((value) => Math.max(0, value - 1))} /><AppText variant="support">Página {products.data.number + 1} de {products.data.totalPages}</AppText><IconButton icon="chevron-forward" label="Próxima página" disabled={products.data.last || products.isFetching} onPress={() => setPage((value) => value + 1)} /></View> : undefined} />}
    <AppModal visible={filterOpen} title="Filtrar produtos" onClose={() => setFilterOpen(false)}><AppText variant="support">Categoria</AppText>{categories.isLoading ? <LoadingState /> : categories.isError ? <ErrorState message={friendlyError(categories.error)} onRetry={() => categories.refetch()} /> : <View style={styles.wrap}><FilterChip label="Todas" selected={!categoryId} onPress={() => { setCategoryId(undefined); setPage(0); }} />{[...(categories.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <FilterChip key={item.id} label={item.name} selected={categoryId === item.id} onPress={() => { setCategoryId(item.id); setPage(0); }} />)}</View>}<AppText variant="support">Arquivo</AppText><View style={styles.wrap}>{([['Todos', undefined], ['Com foto', true], ['Sem foto', false]] as const).map(([label, value]) => <FilterChip key={label} label={label} selected={hasPhoto === value} onPress={() => { setHasPhoto(value); setPage(0); }} />)}</View><AppButton fullWidth onPress={() => setFilterOpen(false)}>Ver resultados</AppButton></AppModal>
    <AppModal visible={!!deleteSelection} title={`Excluir ${deleteSelection?.length ?? 0} produto(s)?`} closeDisabled={remove.isPending} onClose={() => setDeleteSelection(null)}>
      <AppText color="secondary">Os produtos selecionados e seus arquivos serão excluídos permanentemente. Não é possível desfazer.</AppText>
      {deleteSelection?.map((product) => <AppText key={product.id} variant="support">• {product.name}</AppText>)}
      <AppButton fullWidth variant="secondary" disabled={remove.isPending} onPress={() => setDeleteSelection(null)}>Cancelar</AppButton>
      <AppButton fullWidth variant="danger" loading={remove.isPending} onPress={() => { if (deleteSelection && !remove.isPending) remove.mutate(deleteSelection); }}>Excluir selecionados</AppButton>
    </AppModal>
  </ScreenScaffold>;
}
const styles = StyleSheet.create({ selection: { gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'flex-start' }, filters: { gap: spacing.md, paddingVertical: spacing.lg }, chips: { gap: spacing.sm }, filterRow: { flexDirection: 'row', gap: spacing.sm }, list: { gap: spacing.md, paddingBottom: spacing.xxl }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.lg }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
