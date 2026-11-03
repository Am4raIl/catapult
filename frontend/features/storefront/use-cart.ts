"use client";

import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import type { Product, CheckoutRequest } from "@/lib/api/types";

const CART_KEY = "catapult-bag-v1";
const CHANGE_EVENT = "catapult-bag-change";
const PENDING_KEY = "catapult-pending-checkout-v1";
const checkoutSchema = z.object({
  request_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});
const itemSchema = z.object({
  product: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().finite().nonnegative(),
    photo: z.string().nullable(),
    active: z.boolean(),
    stock_quantity: z.number().int().nonnegative(),
    category: z.object({ id: z.string(), name: z.string() }),
  }),
  quantity: z.number().int().positive(),
});
export type CartItem = z.infer<typeof itemSchema>;
let memorySnapshot: string | null = null;
let memoryOnly = false;
let memoryPending: string | null = null;

function pendingSnapshot() {
  if (memoryOnly) return memoryPending;
  try {
    memoryPending = localStorage.getItem(PENDING_KEY);
    return memoryPending;
  } catch {
    return memoryPending;
  }
}

function readPending(): CheckoutRequest | null {
  try {
    const parsed = checkoutSchema.safeParse(
      JSON.parse(pendingSnapshot() ?? "null"),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function savePending(request: CheckoutRequest | null) {
  memoryPending = request ? JSON.stringify(request) : null;
  try {
    if (memoryPending) localStorage.setItem(PENDING_KEY, memoryPending);
    else localStorage.removeItem(PENDING_KEY);
  } catch {
    memoryOnly = true;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function getSnapshot() {
  if (memoryOnly) return memorySnapshot;
  try {
    memorySnapshot = localStorage.getItem(CART_KEY);
    return memorySnapshot;
  } catch {
    memoryOnly = true;
    return memorySnapshot;
  }
}

function readItems(snapshot: string | null): CartItem[] {
  try {
    const parsed = z.array(itemSchema).safeParse(JSON.parse(snapshot ?? "[]"));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === CART_KEY ||
      event.key === PENDING_KEY ||
      event.key === null
    )
      callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

function save(items: CartItem[]) {
  memorySnapshot = JSON.stringify(items);
  try {
    localStorage.setItem(CART_KEY, memorySnapshot);
  } catch {
    memoryOnly = true;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const items = useMemo(() => readItems(snapshot), [snapshot]);
  const pendingRaw = useSyncExternalStore(
    subscribe,
    pendingSnapshot,
    () => null,
  );
  const pending = useMemo(() => {
    try {
      const parsed = checkoutSchema.safeParse(JSON.parse(pendingRaw ?? "null"));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }, [pendingRaw]);

  function add(product: Product) {
    if (readPending()) return false;
    if (!product.active || product.stock_quantity <= 0) return false;
    const current = readItems(getSnapshot());
    const existing = current.find((item) => item.product.id === product.id);
    if (existing && existing.quantity >= product.stock_quantity) return false;
    const storedProduct: CartItem["product"] = {
      id: product.id,
      name: product.name,
      price: product.price,
      photo: product.photo,
      active: product.active,
      stock_quantity: product.stock_quantity,
      category: product.category,
    };
    save(
      existing
        ? current.map((item) =>
            item.product.id === product.id
              ? { product: storedProduct, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, { product: storedProduct, quantity: 1 }],
    );
    return true;
  }

  function setQuantity(
    id: string,
    quantity: number,
    latest?: CartItem["product"],
  ) {
    if (readPending()) return;
    if (!Number.isInteger(quantity)) return;
    save(
      readItems(getSnapshot()).flatMap((item) => {
        if (item.product.id !== id) return [item];
        if (quantity <= 0) return [];
        if (latest && (!latest.active || latest.stock_quantity <= 0)) return [];
        return [
          {
            ...item,
            product: latest ?? item.product,
            quantity: Math.min(
              quantity,
              latest?.stock_quantity ?? item.product.stock_quantity,
            ),
          },
        ];
      }),
    );
  }

  return {
    items,
    pending,
    add,
    setQuantity,
    beginCheckout: (): CheckoutRequest => {
      const existing = readPending();
      if (existing) return existing;
      const request = {
        request_id: crypto.randomUUID(),
        items: readItems(getSnapshot()).map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };
      savePending(request);
      return request;
    },
    finishCheckout: () => {
      save([]);
      savePending(null);
    },
    releaseCheckout: () => savePending(null),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total:
      items.reduce(
        (sum, item) =>
          sum + Math.round(item.product.price * 100) * item.quantity,
        0,
      ) / 100,
  };
}
