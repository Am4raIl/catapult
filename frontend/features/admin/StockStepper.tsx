"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { useToast } from "@/components/Toaster";
import { productsApi } from "@/lib/api/products";
import type { Product, SpringPage } from "@/lib/api/types";

interface StockVariables {
  quantity: number;
}

export function StockStepper({ product }: { product: Product }) {
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const value = pendingValue ?? product.stock_quantity;
  const queryClient = useQueryClient();
  const toast = useToast();
  const timer = useRef<number | null>(null);
  const pending = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: ({ quantity }: StockVariables) =>
      productsApi.updateStock(product.id, quantity),
    onMutate: async ({ quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["products", "admin"] });

      const lists = queryClient.getQueriesData<SpringPage<Product>>({
        queryKey: ["products", "admin"],
      });
      const detail = queryClient.getQueryData<Product>(["product", product.id]);

      queryClient.setQueriesData<SpringPage<Product>>(
        { queryKey: ["products", "admin"] },
        (current) =>
          current
            ? {
                ...current,
                content: current.content.map((item) =>
                  item.id === product.id
                    ? { ...item, stock_quantity: quantity }
                    : item,
                ),
              }
            : current,
      );

      if (detail) {
        queryClient.setQueryData<Product>(["product", product.id], {
          ...detail,
          stock_quantity: quantity,
        });
      }

      return { lists, detail };
    },
    onSuccess: (updated) => {
      if (pending.current == null) setPendingValue(null);
      toast.success(
        "Estoque atualizado",
        `${updated.name} agora tem ${updated.stock_quantity} unidades.`,
      );
    },
    onError: (_error, _variables, context) => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      pending.current = null;
      setPendingValue(null);
      context?.lists.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
      if (context?.detail) {
        queryClient.setQueryData(["product", product.id], context.detail);
      }
      toast.error(
        "Não foi possível atualizar o estoque",
        "Tente novamente em alguns instantes.",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  function change(delta: number) {
    const next = Math.max(0, value + delta);
    if (next === value) return;

    setPendingValue(next);
    pending.current = next;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const quantity = pending.current;
      pending.current = null;
      timer.current = null;
      if (quantity != null) {
        mutation.mutate({ quantity });
      }
    }, 400);
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        variant="secondary"
        size="icon"
        className="h-11 w-11"
        onClick={() => change(-1)}
        disabled={value <= 0}
        aria-label={`Diminuir estoque de ${product.name}`}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <span
        className="min-w-9 text-center font-display text-lg font-extrabold text-ink"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        variant="secondary"
        size="icon"
        className="h-11 w-11"
        onClick={() => change(1)}
        aria-label={`Aumentar estoque de ${product.name}`}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
