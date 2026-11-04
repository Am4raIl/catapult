import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, IconButton } from '@/components/ui/core';
import { friendlyError } from '@/lib/api/client';
import { productsApi } from '@/lib/api/services';
import type { Product, SpringPage } from '@/lib/api/types';
import { spacing } from '@/theme/tokens';

export function StockStepper({ product, onError, disabled = false }: { product: Product; onError: (message: string) => void; disabled?: boolean }) {
  const client = useQueryClient();
  const entry = useRef({ desired: product.stock_quantity, committed: product.stock_quantity, running: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const [quantity, setQuantity] = useState(product.stock_quantity);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry.current.running && timer.current === null) {
      entry.current.desired = product.stock_quantity;
      entry.current.committed = product.stock_quantity;
      setQuantity(product.stock_quantity);
    }
  }, [product.stock_quantity]);
  const patch = (value: number) => {
    client.setQueriesData<SpringPage<Product>>({ queryKey: ['admin', 'products'] }, (page) => page ? { ...page, content: page.content.map((p) => p.id === product.id ? { ...p, stock_quantity: value } : p) } : page);
    client.setQueryData<Product>(['product', product.id], (p) => p ? { ...p, stock_quantity: value } : p);
  };
  const flush = async () => {
    if (entry.current.running) return;
    timer.current = null;
    entry.current.running = true;
    if (mounted.current) setSaving(true);
    let failed = false;
    while (entry.current.desired !== entry.current.committed) {
      const target = entry.current.desired;
      try {
        const updated = await productsApi.updateStock(product.id, target);
        entry.current.committed = updated.stock_quantity;
      } catch (error) {
        entry.current.desired = entry.current.committed;
        failed = true;
        if (mounted.current) onError(`Não foi possível salvar o estoque de ${product.name}. ${friendlyError(error)}`);
        break;
      }
    }
    patch(entry.current.desired);
    if (mounted.current) { setQuantity(entry.current.desired); setSaving(false); }
    entry.current.running = false;
    for (const queryKey of [['dashboard'], ['admin', 'product-count'], ['catalog'], ['categories'], ['category'], ['bag-stock']]) void client.invalidateQueries({ queryKey });
    if (failed) void client.invalidateQueries({ queryKey: ['admin', 'products'] });
  };
  const flushRef = useRef(flush);
  useEffect(() => { flushRef.current = flush; });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) {
        clearTimeout(timer.current);
        // Preserve the last taps when switching tabs or opening a detail.
        void flushRef.current();
      }
    };
  }, []);
  const adjust = (delta: number) => {
    const value = Math.max(0, entry.current.desired + delta);
    entry.current.desired = value;
    setQuantity(value);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flushRef.current(); }, 400);
  };
  return <View style={styles.row}>
    <IconButton icon="remove" label={`Diminuir estoque de ${product.name}`} disabled={disabled || quantity === 0} onPress={() => adjust(-1)} />
    <View style={styles.quantity}><AppText variant="support">{quantity}</AppText>{saving ? <AppText variant="caption" color="secondary">Salvando</AppText> : null}</View>
    <IconButton icon="add" label={`Aumentar estoque de ${product.name}`} disabled={disabled} onPress={() => adjust(1)} />
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }, quantity: { minWidth: 52, alignItems: 'center' } });
