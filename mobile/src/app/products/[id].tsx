import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ProductMedia, StockBadge } from '@/components/product';
import { AppButton, AppHeader, AppText, ErrorState, LoadingState, ScreenScaffold, InlineError } from '@/components/ui/core';
import { ApiError, friendlyError } from '@/lib/api/client';
import { productsApi } from '@/lib/api/services';
import { useCart } from '@/providers/cart-provider';
import { spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';

export default function PublicProductDetail() {
  const cart = useCart();
  const [notice, setNotice] = useState('');
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useQuery({ queryKey: ['product', id], queryFn: () => productsApi.get(id), enabled: !!id });
  return <ScreenScaffold><AppHeader title="Produto" onBack={back} />{product.isLoading ? <LoadingState label="Carregando produto..." /> : product.isError ? product.error instanceof ApiError && product.error.status === 404 ? <ErrorState message="Produto não encontrado." onRetry={() => product.refetch()} /> : <ErrorState message={friendlyError(product.error)} onRetry={() => product.refetch()} /> : product.data && product.data.active ? <ScrollView contentContainerStyle={styles.content}><ProductMedia product={product.data} /><View style={styles.info}><AppText color="secondary">{product.data.category.name}</AppText><AppText variant="heading">{product.data.name}</AppText><AppText variant="display">{formatCurrency(product.data.price)}</AppText><StockBadge quantity={product.data.stock_quantity} /><AppText color="secondary">{product.data.stock_quantity} {product.data.stock_quantity === 1 ? 'unidade disponível' : 'unidades disponíveis'}</AppText></View></ScrollView> : product.data ? <ErrorState message="Este produto não está disponível no catálogo." /> : null}<View style={styles.bottom}>{notice ? <InlineError>{notice}</InlineError> : null}{product.data?.active ? <AppButton fullWidth icon="bag-handle-outline" disabled={!cart.ready || !!cart.pending || product.data.stock_quantity <= 0} onPress={() => { if (cart.add(product.data!)) router.push('/cart'); else setNotice('A quantidade disponível já está na sacola.'); }}>{product.data.stock_quantity > 0 ? 'Adicionar à sacola' : 'Indisponível'}</AppButton> : null}<AppButton variant="secondary" fullWidth onPress={back}>Voltar ao catálogo</AppButton></View></ScreenScaffold>;
}

const styles = StyleSheet.create({ content: { paddingVertical: spacing.xl, gap: spacing.xxl }, info: { gap: spacing.md }, bottom: { gap: spacing.sm, paddingVertical: spacing.md } });
