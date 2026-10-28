import { ScreenScaffold } from '@/components/ui/core';
import { ProductForm } from '@/components/admin/product-form';

export default function NewProductScreen() {
  return <ScreenScaffold><ProductForm mode="create" /></ScreenScaffold>;
}
