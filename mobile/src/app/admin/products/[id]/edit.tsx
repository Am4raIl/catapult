import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { ProductForm } from '@/components/admin/product-form';
import { ErrorState, LoadingState, ScreenScaffold } from '@/components/ui/core';
import { ApiError, friendlyError } from '@/lib/api/client';
import { productsApi } from '@/lib/api/services';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useQuery({ queryKey: ['product', id], queryFn: () => productsApi.get(id), enabled: !!id });
  return <ScreenScaffold>{product.isLoading ? <LoadingState label="Carregando formulário..." /> : product.isError ? <ErrorState message={product.error instanceof ApiError && product.error.status === 404 ? 'Produto não encontrado.' : friendlyError(product.error)} onRetry={() => product.refetch()} /> : product.data ? <ProductForm mode="edit" initial={product.data} /> : null}</ScreenScaffold>;
}
