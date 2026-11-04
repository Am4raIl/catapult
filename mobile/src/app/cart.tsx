import { Ionicons } from '@expo/vector-icons';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { router, usePreventRemove } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ProductMedia } from '@/components/product';
import { AppButton, AppHeader, AppText, EmptyState, IconButton, InlineError, LoadingState, ScreenScaffold } from '@/components/ui/core';
import { ApiError } from '@/lib/api/client';
import { checkoutApi, productsApi } from '@/lib/api/services';
import type { CheckoutReceipt } from '@/lib/api/types';
import { useCart } from '@/providers/cart-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';

export default function CartScreen() {
  const cart = useCart();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [receipt, setReceipt] = useState<CheckoutReceipt | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  usePreventRemove(submitting, () => undefined);
  const queries = useQueries({ queries: cart.items.map(({ product }) => ({
    queryKey: ['bag-stock', product.id],
    queryFn: async () => {
      try { return await productsApi.get(product.id); }
      catch (cause) { if (cause instanceof ApiError && cause.status === 404) return null; throw cause; }
    },
    staleTime: 0, refetchOnMount: 'always' as const, refetchInterval: 15_000,
  })) });
  const items = cart.items.map((item, index) => {
    const query = queries[index];
    const product = query?.data ?? item.product;
    return { ...item, product, ready: query?.isSuccess, available: query?.data === null || !product.active ? 0 : product.stock_quantity };
  });
  const ready = items.every((item) => item.ready);
  const invalid = items.some((item) => item.quantity > item.available);
  const locked = submitting || !!cart.pending;
  const total = items.reduce((sum, item) => sum + Math.round(item.product.price * 100) * item.quantity, 0) / 100;
  const refreshStock = async () => { await Promise.all(queries.map((query) => query.refetch())); };
  const back = () => { if (!busy.current) { if (router.canGoBack()) router.back(); else router.replace('/'); } };
  const finalize = async () => {
    if (busy.current || (!cart.pending && (!ready || invalid))) return;
    busy.current = true; setSubmitting(true); setError('');
    try {
      const request = await cart.beginCheckout();
      const result = await checkoutApi.submit(request);
      await cart.finishCheckout();
      setReceipt(result);
      for (const key of [['catalog'], ['admin', 'products'], ['product'], ['bag-stock'], ['dashboard'], ['categories']]) void queryClient.invalidateQueries({ queryKey: key });
    } catch (cause) {
      if (cause instanceof ApiError && [400, 409, 422].includes(cause.status)) {
        await cart.releaseCheckout().catch(() => undefined);
        setError(cause.status === 409 ? 'A disponibilidade mudou. Revise os itens e ajuste as quantidades antes de finalizar.' : 'Não foi possível finalizar esta seleção. Revise sua sacola e tente novamente.');
        void refreshStock();
      } else {
        setError('Ainda não foi possível confirmar o resultado. Tente novamente: a mesma compra será consultada sem descontar o estoque duas vezes.');
      }
    } finally { busy.current = false; setSubmitting(false); }
  };
  return <ScreenScaffold><AppHeader title={receipt ? 'Compra finalizada' : 'Sua sacola'} subtitle={receipt ? 'Tudo certo com sua escolha.' : `${cart.count} ${cart.count === 1 ? 'item selecionado' : 'itens selecionados'}`} onBack={submitting ? undefined : back} />
    {!cart.ready ? <View style={styles.content}>{cart.error ? <><InlineError>{cart.error}</InlineError><AppButton onPress={cart.reload}>Tentar novamente</AppButton></> : <LoadingState label="Recuperando sua sacola..." />}</View> : receipt ? <View accessibilityLiveRegion="polite" style={styles.receipt}>
      <View style={[styles.receiptIcon, { backgroundColor: colors.successSoft }]}><Ionicons name="checkmark" size={40} color={colors.success} /></View>
      <AppText variant="heading" style={styles.center}>Tudo certo com sua escolha.</AppText><AppText color="secondary">{receipt.item_count} itens confirmados</AppText><AppText variant="display">{formatCurrency(receipt.total)}</AppText><AppText color="secondary" style={styles.center}>O estoque foi atualizado e sua sacola está vazia.</AppText><AppText variant="caption" color="secondary" style={styles.center}>Compra {receipt.id}</AppText><AppButton fullWidth onPress={back}>Continuar explorando</AppButton>
    </View> : !items.length ? <EmptyState icon="bag-handle-outline" title="Uma boa escolha começa aqui." description="Explore o catálogo e adicione seus favoritos." actionLabel="Explorar catálogo" onAction={back} /> : <FlatList data={items} keyExtractor={(item) => item.product.id} contentContainerStyle={styles.content}
      renderItem={({ item }) => <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.row}><ProductMedia product={item.product} compact /><View style={styles.info}><AppText variant="caption" color="secondary">{item.product.category.name}</AppText><AppText variant="support">{item.product.name}</AppText><AppText color="secondary" variant="support">{formatCurrency(item.product.price)} / un.</AppText></View><IconButton icon="trash-outline" label={`Remover ${item.product.name}`} disabled={locked} onPress={() => cart.setQuantity(item.product.id, 0)} /></View>
        {item.ready && item.quantity > item.available ? <View style={[styles.warning, { backgroundColor: colors.warningSoft }]}><AppText color="warning" variant="support">{item.available ? `Restam ${item.available} unidades. Sua sacola tem ${item.quantity}.` : 'Produto indisponível no momento.'}</AppText><AppButton variant="ghost" disabled={locked} onPress={() => cart.setQuantity(item.product.id, item.available, item.product)}>{item.available ? 'Ajustar ao estoque' : 'Remover da sacola'}</AppButton></View> : null}
        <View style={styles.quantityRow}><View style={styles.row}><IconButton icon="remove" label={`Diminuir quantidade de ${item.product.name}`} disabled={locked || item.quantity <= 1} onPress={() => cart.setQuantity(item.product.id, item.quantity - 1, item.product)} /><AppText variant="support">{item.quantity}</AppText><IconButton icon="add" label={`Aumentar quantidade de ${item.product.name}`} disabled={locked || !item.ready || item.quantity >= item.available} onPress={() => cart.setQuantity(item.product.id, item.quantity + 1, item.product)} /></View><AppText variant="section">{formatCurrency(item.product.price * item.quantity)}</AppText></View>
      </View>}
      ListFooterComponent={<View style={styles.summary}>
        <View style={[styles.subtotal, { backgroundColor: colors.hero, borderColor: colors.heroLine }]}><AppText color="secondary">Subtotal</AppText><AppText variant="display">{formatCurrency(total)}</AppText><AppText variant="caption" color="secondary">Ao finalizar, as quantidades serão descontadas do estoque. A disponibilidade é confirmada para todos os itens juntos. Não há cobrança online.</AppText></View>
        {cart.error ? <InlineError>{cart.error}</InlineError> : null}{error ? <InlineError>{error}</InlineError> : null}
        {queries.some((query) => query.isError) && !cart.pending ? <><InlineError>Não foi possível consultar o estoque.</InlineError><AppButton variant="secondary" onPress={refreshStock}>Tentar novamente</AppButton></> : null}
        {cart.pending && !submitting ? <AppText variant="support" color="secondary">Há uma compra aguardando confirmação. Consulte o resultado para continuar.</AppText> : null}
        <AppButton fullWidth icon="bag-handle-outline" loading={submitting} disabled={!cart.pending && (!ready || invalid || items.length > 100)} onPress={finalize}>{cart.pending && !submitting ? 'Confirmar resultado da compra' : 'Finalizar compra'}</AppButton><AppButton fullWidth variant="ghost" disabled={submitting} onPress={back}>Continuar explorando</AppButton>
      </View>} />}
  </ScreenScaffold>;
}

const styles = StyleSheet.create({ content: { paddingVertical: spacing.xl, paddingBottom: spacing.huge, gap: spacing.lg }, item: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, info: { flex: 1, gap: 4 }, quantityRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }, warning: { padding: spacing.md, borderRadius: radius.md, gap: spacing.sm }, summary: { gap: spacing.lg }, subtotal: { padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md }, receipt: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xl, paddingVertical: spacing.huge }, receiptIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' }, center: { textAlign: 'center' } });
