import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import type { CheckoutRequest, Product } from '@/lib/api/types';

export type BagProduct = Pick<Product, 'id' | 'name' | 'price' | 'photo' | 'category' | 'active' | 'stock_quantity'>;
export type BagItem = { product: BagProduct; quantity: number };
type Bag = { items: BagItem[]; pending: CheckoutRequest | null };
const KEY = '@catapult/bag-v1';
const empty: Bag = { items: [], pending: null };

function readBag(raw: string | null): Bag {
  if (!raw) return empty;
  const value = JSON.parse(raw);
  if (!value || !Array.isArray(value.items)) throw new Error('Sacola inválida');
  const ids = new Set<string>();
  for (const item of value.items) {
    const p = item?.product;
    if (!p || typeof p.id !== 'string' || ids.has(p.id) || typeof p.name !== 'string' ||
      !Number.isFinite(p.price) || p.price < 0 || typeof p.category?.name !== 'string' ||
      typeof p.category?.id !== 'string' || typeof p.active !== 'boolean' ||
      !Number.isInteger(p.stock_quantity) || p.stock_quantity < 0 ||
      (p.photo !== null && typeof p.photo !== 'string') || !Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error('Sacola inválida');
    ids.add(p.id);
  }
  if (value.pending && (!/^[0-9a-f-]{36}$/i.test(value.pending.request_id) ||
    !Array.isArray(value.pending.items) || value.pending.items.length !== value.items.length ||
    !value.pending.items.every((item: { product_id: string; quantity: number }, index: number) => item.product_id === value.items[index].product.id && item.quantity === value.items[index].quantity))) throw new Error('Compra pendente inválida');
  return { items: value.items, pending: value.pending ?? null };
}

type CartContextValue = Bag & {
  ready: boolean; error: string; count: number; total: number;
  add: (product: Product) => boolean;
  setQuantity: (id: string, quantity: number, latest?: BagProduct) => void;
  beginCheckout: () => Promise<CheckoutRequest>;
  finishCheckout: () => Promise<void>;
  releaseCheckout: () => Promise<void>;
  reload: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [bag, setBag] = useState<Bag>(empty);
  const state = useRef<Bag>(empty);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const writes = useRef(Promise.resolve());
  const load = async () => {
    try {
      const stored = readBag(await AsyncStorage.getItem(KEY));
      state.current = stored; setBag(stored); setReady(true); setError('');
    } catch {
      setError('Não foi possível recuperar sua sacola. Tente novamente para preservar uma possível compra pendente.');
    }
  };
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(KEY).then((raw) => {
      const stored = readBag(raw);
      if (mounted) { state.current = stored; setBag(stored); setReady(true); setError(''); }
    }).catch(() => {
      if (mounted) setError('Não foi possível recuperar sua sacola. Tente novamente para preservar uma possível compra pendente.');
    });
    return () => { mounted = false; };
  }, []);

  const commit = (next: Bag) => {
    state.current = next; setBag(next);
    const task = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)));
    writes.current = task;
    void task.then(() => setError(''), () => setError('Não foi possível salvar a sacola neste aparelho. Tente novamente antes de finalizar.'));
    return task;
  };
  const add = (product: Product) => {
    if (!ready || state.current.pending || !product.active || product.stock_quantity <= 0) return false;
    const current = state.current.items;
    const existing = current.find((item) => item.product.id === product.id);
    if (existing && existing.quantity >= product.stock_quantity) return false;
    if (!existing && current.length >= 100) return false;
    const { id, name, price, photo, category, active, stock_quantity } = product;
    const stored = { id, name, price, photo, category, active, stock_quantity };
    void commit({ pending: null, items: existing ? current.map((item) => item.product.id === id ? { product: stored, quantity: item.quantity + 1 } : item) : [...current, { product: stored, quantity: 1 }] });
    return true;
  };
  const setQuantity = (id: string, quantity: number, latest?: BagProduct) => {
    if (!ready || state.current.pending || !Number.isInteger(quantity)) return;
    void commit({ pending: null, items: state.current.items.flatMap((item) => {
      if (item.product.id !== id) return [item];
      const product = latest ?? item.product;
      const next = Math.min(quantity, product.active ? product.stock_quantity : 0);
      return next <= 0 ? [] : [{ product, quantity: next }];
    }) });
  };
  const beginCheckout = async () => {
    if (!ready || !state.current.items.length) throw new Error('Adicione um produto à sacola.');
    const request = state.current.pending ?? {
      request_id: Crypto.randomUUID(),
      items: state.current.items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
    };
    // Persist the exact request before sending it. Retries and app restarts reuse its ID.
    await commit({ ...state.current, pending: request });
    return request;
  };
  return <CartContext.Provider value={{ ...bag, ready, error, add, setQuantity, beginCheckout,
    finishCheckout: async () => {
      // Keep the pending ID in memory if persistence fails after server success.
      const task = writes.current.catch(() => undefined).then(() => AsyncStorage.setItem(KEY, JSON.stringify(empty)));
      writes.current = task;
      await task;
      state.current = empty; setBag(empty); setError('');
    },
    releaseCheckout: async () => { await commit({ ...state.current, pending: null }); },
    reload: () => { void load(); },
    count: bag.items.reduce((sum, item) => sum + item.quantity, 0),
    total: bag.items.reduce((sum, item) => sum + Math.round(item.product.price * 100) * item.quantity, 0) / 100,
  }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
