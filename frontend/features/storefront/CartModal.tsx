"use client";

import { useId, useRef, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Modal, ModalHeader } from "@/components/Modal";
import { Thumb } from "@/components/Thumb";
import { BagIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { checkoutApi } from "@/lib/api/checkout";
import { productsApi } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/components/Toaster";
import type { CheckoutReceipt } from "@/lib/api/types";
import type { useCart } from "./use-cart";

export function CartModal({
  cart,
  onClose,
}: {
  cart: ReturnType<typeof useCart>;
  onClose: () => void;
}) {
  const titleId = useId();
  const queryClient = useQueryClient();
  const toast = useToast();
  const submitting = useRef(false);
  const [receipt, setReceipt] = useState<CheckoutReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stockQueries = useQueries({
    queries: cart.items.map(({ product }) => ({
      queryKey: ["products", "bag-stock", product.id],
      queryFn: async () => {
        try {
          return await productsApi.get(product.id);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }
      },
      staleTime: 0,
      refetchOnMount: "always" as const,
      refetchInterval: 15_000,
    })),
  });
  const liveItems = cart.items.map((item, index) => {
    const query = stockQueries[index];
    const product = query?.data ?? item.product;
    const available =
      query?.data === null || !product.active ? 0 : product.stock_quantity;
    return { ...item, product, available, ready: query?.isSuccess ?? false };
  });
  const invalidStock = liveItems.some((item) => item.quantity > item.available);
  const stockReady = liveItems.every((item) => item.ready);
  const stockError = stockQueries.some((query) => query.isError);
  const total =
    liveItems.reduce(
      (sum, item) => sum + Math.round(item.product.price * 100) * item.quantity,
      0,
    ) / 100;
  const mutation = useMutation({
    mutationFn: () => checkoutApi.submit(cart.beginCheckout()),
    onSuccess: (result) => {
      cart.finishCheckout();
      setReceipt(result);
      setErrorMessage(null);
      toast.success(
        "Compra finalizada",
        `${result.item_count} ${result.item_count === 1 ? "item confirmado" : "itens confirmados"}.`,
      );
      for (const key of ["products", "dashboard", "categories"])
        void queryClient.invalidateQueries({ queryKey: [key] });
    },
    onError: (error) => {
      if (error instanceof ApiError && [400, 409, 422].includes(error.status)) {
        cart.releaseCheckout();
        setErrorMessage(
          error.status === 409
            ? "A disponibilidade mudou. Revise os itens destacados e ajuste as quantidades antes de finalizar."
            : "Não foi possível finalizar esta seleção. Revise a sacola e tente novamente.",
        );
        void queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        setErrorMessage(
          "Ainda não foi possível confirmar o resultado. Tente novamente: a mesma compra será consultada sem descontar o estoque duas vezes.",
        );
      }
    },
    onSettled: () => {
      submitting.current = false;
    },
  });
  const locked = mutation.isPending || Boolean(cart.pending);

  function finalize() {
    if (submitting.current || (!cart.pending && (!stockReady || invalidStock)))
      return;
    submitting.current = true;
    setErrorMessage(null);
    mutation.mutate();
  }
  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={titleId}
      widthClass="max-w-[720px]"
      closeDisabled={mutation.isPending}
    >
      <ModalHeader
        title={receipt ? "Compra finalizada." : "Sua sacola"}
        titleId={titleId}
        subtitle={`${cart.count} ${cart.count === 1 ? "item selecionado" : "itens selecionados"}`}
        onClose={onClose}
        closeDisabled={mutation.isPending}
      />
      {receipt ? (
        <div className="py-10 text-center" role="status">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-ink">
            <BagIcon className="h-7 w-7" />
          </span>
          <p className="mt-5 font-display text-2xl font-bold">
            Tudo certo com sua escolha.
          </p>
          <p className="mt-3 text-muted">
            {receipt.item_count}{" "}
            {receipt.item_count === 1 ? "item confirmado" : "itens confirmados"}{" "}
            · {formatCurrency(receipt.total)}
          </p>
          <p className="mt-2 text-sm text-muted">
            O estoque foi atualizado e sua sacola está vazia.
          </p>
          <p className="mt-5 break-all text-xs text-muted">
            Compra {receipt.id}
          </p>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="py-14 text-center">
          <BagIcon className="mx-auto h-12 w-12 text-muted" />
          <p className="mt-5 font-display text-2xl font-bold">
            Uma boa escolha começa aqui.
          </p>
          <p className="mt-2 text-muted">
            Explore o catálogo e adicione seus favoritos.
          </p>
        </div>
      ) : (
        <>
          <ul
            className="my-6 divide-y divide-line"
            aria-label="Itens da sacola"
          >
            {liveItems.map(({ product, quantity, available, ready }) => (
              <li key={product.id} className="flex gap-3 py-5 sm:gap-5">
                <Thumb
                  id={product.id}
                  photo={product.photo}
                  alt={product.name}
                  className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{product.category.name}</p>
                  <h3 className="mt-1 break-words font-bold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {formatCurrency(product.price)} / un.
                  </p>
                  {ready && quantity > available ? (
                    <div
                      className="mt-3 rounded-xl bg-warning p-3 text-xs text-warning-ink"
                      role="alert"
                    >
                      {available > 0
                        ? `Restam ${available} unidades. Sua sacola tem ${quantity}.`
                        : "Produto indisponível no momento."}
                      <button
                        type="button"
                        disabled={locked}
                        className="mt-1 block min-h-11 font-bold underline disabled:opacity-50"
                        onClick={() =>
                          cart.setQuantity(product.id, available, product)
                        }
                      >
                        {available > 0
                          ? "Ajustar ao estoque"
                          : "Remover da sacola"}
                      </button>
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-full border border-line">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={locked || quantity <= 1}
                        aria-label={`Diminuir quantidade de ${product.name}`}
                        onClick={() =>
                          cart.setQuantity(product.id, quantity - 1, product)
                        }
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                      <span
                        className="min-w-7 text-center tabular-nums"
                        aria-live="polite"
                      >
                        {quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={locked || !ready || quantity >= available}
                        aria-label={`Aumentar quantidade de ${product.name}`}
                        onClick={() =>
                          cart.setQuantity(product.id, quantity + 1, product)
                        }
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(product.price * quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={locked}
                      aria-label={`Remover ${product.name} da sacola`}
                      onClick={() => cart.setQuantity(product.id, 0)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl bg-ground p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted">Subtotal</span>
              <span
                className="font-display text-3xl font-bold tabular-nums"
                aria-live="polite"
              >
                {formatCurrency(total)}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Ao finalizar, as quantidades serão descontadas do estoque. A
              disponibilidade é confirmada para todos os itens juntos. Não há
              cobrança online.
            </p>
          </div>
          {errorMessage ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-error p-4 text-sm text-error-ink"
            >
              {errorMessage}
            </p>
          ) : null}
          {stockError && !cart.pending ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              Não foi possível consultar o estoque.{" "}
              <button
                type="button"
                className="min-h-11 font-bold underline"
                onClick={() => {
                  for (const query of stockQueries) void query.refetch();
                }}
              >
                Tentar novamente
              </button>
            </p>
          ) : null}
          {cart.pending && !mutation.isPending && !errorMessage ? (
            <p role="status" className="mt-4 text-sm text-muted">
              Há uma compra aguardando confirmação. Finalize novamente para
              consultar o resultado.
            </p>
          ) : null}
          <Button
            className="mt-6 w-full"
            loading={mutation.isPending}
            disabled={
              !cart.pending &&
              (!stockReady || invalidStock || cart.items.length > 100)
            }
            onClick={finalize}
          >
            <BagIcon className="h-4 w-4" />
            {cart.pending && !mutation.isPending
              ? "Confirmar resultado da compra"
              : "Finalizar compra"}
          </Button>
        </>
      )}
      <Button
        variant={cart.items.length > 0 ? "ghost" : "primary"}
        disabled={mutation.isPending}
        className="mt-3 w-full"
        onClick={onClose}
      >
        Continuar explorando
      </Button>
    </Modal>
  );
}
