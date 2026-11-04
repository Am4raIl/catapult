import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { router, usePreventRemove } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { friendlyError } from '@/lib/api/client';
import { categoriesApi, productFormData, productsApi } from '@/lib/api/services';
import type { PickedFile, Product, ProductInput } from '@/lib/api/types';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { fileIsPdf, formatCurrency, maskMoneyInput, parseMaskedMoney } from '@/utils/format';

import { ProductMedia } from '../product';
import { AppButton, AppHeader, AppInput, AppModal, AppSwitch, AppText, FilterChip, InlineError, ErrorState, LoadingState } from '../ui/core';

type Errors = Partial<Record<'name' | 'category' | 'price' | 'cost' | 'stock' | 'file', string>>;
type MediaMode = 'keep' | 'replace' | 'remove';

export function ProductForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Product }) {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(initial?.category.id ?? '');
  const [price, setPrice] = useState(initial ? formatCurrency(initial.price) : '');
  const [cost, setCost] = useState(initial?.cost_price != null ? formatCurrency(initial.cost_price) : '');
  const [stock, setStock] = useState(String(initial?.stock_quantity ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);
  const [file, setFile] = useState<PickedFile | undefined>();
  const [mediaMode, setMediaMode] = useState<MediaMode>(initial?.photo ? 'keep' : 'remove');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  usePreventRemove(dirty && !submitted, ({ repeat }) => {
    Alert.alert('Descartar alterações?', 'As mudanças não salvas serão perdidas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => { setDirty(false); repeat(); } },
    ]);
  });

  const change = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setDirty(true); };
  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], multiple: false, copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const extensionAllowed = /\.(png|jpe?g|gif|webp|pdf)$/i.test(asset.name);
    const mimeAllowed = asset.mimeType?.startsWith('image/') || asset.mimeType === 'application/pdf';
    if (!extensionAllowed || !mimeAllowed) { setErrors((current) => ({ ...current, file: 'Use PNG, JPG, JPEG, GIF, WEBP ou PDF.' })); return; }
    if ((asset.size ?? 0) > 5 * 1024 * 1024) { setErrors((current) => ({ ...current, file: 'O arquivo deve ter no máximo 5 MB.' })); return; }
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size, file: asset.file });
    setMediaMode('replace'); setDirty(true); setErrors((current) => ({ ...current, file: undefined }));
  };

  const validate = () => {
    const next: Errors = {};
    const parsedPrice = parseMaskedMoney(price);
    const parsedCost = parseMaskedMoney(cost);
    if (!name.trim()) next.name = 'Informe o nome do produto.';
    if (!categoryId) next.category = 'Escolha uma categoria.';
    if (parsedPrice == null || !Number.isFinite(parsedPrice) || parsedPrice < 0.01) next.price = 'Informe um preço de pelo menos R$ 0,01.';
    if (cost.trim() && (parsedCost == null || !Number.isFinite(parsedCost) || parsedCost < 0)) next.cost = 'O custo deve ser zero ou maior.';
    if (mode === 'edit' && initial?.cost_price != null && !cost.trim()) next.cost = 'O backend não permite limpar um custo existente. Informe um valor.';
    if (!/^\d+$/.test(stock) || Number(stock) < 0) next.stock = 'Use um número inteiro igual ou maior que zero.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (submitting || !validate()) return;
    setSubmitting(true); setSubmitError('');
    try {
      const input: ProductInput = { name: name.trim(), category_id: categoryId, price: parseMaskedMoney(price)!, cost_price: parseMaskedMoney(cost), stock_quantity: Number(stock), active };
      let payload: ProductInput | FormData = input;
      if (mode === 'create' && file) payload = productFormData(input, file);
      if (mode === 'edit') {
        if (mediaMode === 'keep' && initial?.photo) {
          const currentFile = await productsApi.downloadMedia(initial.photo, `arquivo-${initial.id}`);
          payload = productFormData(input, currentFile);
        } else if (mediaMode === 'replace' && file) payload = productFormData(input, file);
      }
      const saved = mode === 'create' ? await productsApi.create(payload) : await productsApi.update(initial!.id, payload);
      setSubmitted(true); setDirty(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin'] }), queryClient.invalidateQueries({ queryKey: ['catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }), queryClient.invalidateQueries({ queryKey: ['category'] }), queryClient.invalidateQueries({ queryKey: ['bag-stock'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      queryClient.setQueryData(['product', saved.id], saved);
      router.replace({ pathname: '/admin/products/[id]', params: { id: saved.id, saved: mode } });
    } catch (error) {
      setSubmitError(mediaMode === 'keep' && initial?.photo ? `Não foi possível preservar o arquivo atual. ${friendlyError(error)} Tente novamente ou escolha explicitamente trocar/remover.` : friendlyError(error));
    } finally { setSubmitting(false); }
  };

  const selectedCategory = categories.data?.find((item) => item.id === categoryId);
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><AppHeader title={mode === 'create' ? 'Novo produto' : 'Editar produto'} onBack={() => router.back()} /><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    {submitError ? <InlineError>{submitError}</InlineError> : null}
    <Section title="Informações básicas"><AppInput label="Nome" value={name} onChangeText={change(setName)} error={errors.name} returnKeyType="next" /><View style={styles.field}><AppText variant="support">Categoria</AppText><Pressable accessibilityRole="button" onPress={() => setCategoryOpen(true)} style={[styles.select, { backgroundColor: colors.surface, borderColor: errors.category ? colors.danger : colors.border }]}><AppText color={selectedCategory ? 'primary' : 'secondary'}>{selectedCategory?.name ?? 'Escolher categoria'}</AppText><Ionicons name="chevron-down" color={colors.textSecondary} size={20} /></Pressable>{errors.category ? <AppText variant="caption" color="danger">{errors.category}</AppText> : null}</View></Section>
    <Section title="Preço e estoque"><AppInput label="Preço" value={price} onChangeText={(text) => change(setPrice)(maskMoneyInput(text, price))} keyboardType="number-pad" placeholder="R$ 0,00" error={errors.price} /><AppInput label="Custo (opcional)" value={cost} onChangeText={(text) => change(setCost)(maskMoneyInput(text, cost))} keyboardType="number-pad" placeholder="R$ 0,00" error={errors.cost} /><AppInput label="Quantidade em estoque" value={stock} onChangeText={change(setStock)} keyboardType="number-pad" error={errors.stock} /></Section>
    <Section title="Visibilidade e arquivo"><AppSwitch label="Produto ativo" value={active} onValueChange={change(setActive)} />{mode === 'edit' && initial?.photo ? <><ProductMedia product={initial} /><AppText variant="support">O que fazer com o arquivo atual?</AppText><View style={styles.chips}><FilterChip label="Manter arquivo atual" selected={mediaMode === 'keep'} onPress={() => { setMediaMode('keep'); setDirty(true); }} /><FilterChip label="Trocar arquivo" selected={mediaMode === 'replace'} onPress={chooseFile} /><FilterChip label="Remover arquivo" selected={mediaMode === 'remove'} onPress={() => Alert.alert('Remover arquivo?', 'O arquivo atual será excluído ao salvar.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => { setMediaMode('remove'); setFile(undefined); setDirty(true); } }])} /></View></> : <FilePicker file={file} error={errors.file} onPick={chooseFile} onRemove={() => { setFile(undefined); setMediaMode('remove'); setDirty(true); }} />}{mediaMode === 'replace' && initial?.photo ? <FilePicker file={file} error={errors.file} onPick={chooseFile} onRemove={() => { setFile(undefined); setMediaMode('keep'); }} /> : null}</Section>
    <AppButton fullWidth loading={submitting} onPress={submit}>{submitting ? (mode === 'create' ? 'Criando...' : 'Salvando...') : (mode === 'create' ? 'Criar produto' : 'Salvar alterações')}</AppButton>
  </ScrollView><AppModal visible={categoryOpen} title="Escolher categoria" onClose={() => setCategoryOpen(false)}>{categories.isLoading ? <LoadingState /> : categories.isError ? <ErrorState message={friendlyError(categories.error)} onRetry={() => categories.refetch()} /> : !categories.data?.length ? <><AppText color="secondary">Crie uma categoria para organizar seu primeiro produto.</AppText><AppButton onPress={() => { setCategoryOpen(false); router.push('/admin/categories'); }}>Gerenciar categorias</AppButton></> : [...(categories.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((category) => <FilterChip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => { setCategoryId(category.id); setCategoryOpen(false); setDirty(true); }} />)}</AppModal></KeyboardAvoidingView>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}><AppText variant="section">{title}</AppText>{children}</View>;
}

function FilePicker({ file, error, onPick, onRemove }: { file?: PickedFile; error?: string; onPick: () => void; onRemove: () => void }) {
  const { colors } = useAppTheme();
  return <View style={styles.field}><Pressable accessibilityRole="button" onPress={onPick} style={[styles.fileCard, { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.surfaceMuted }]}><Ionicons name={file ? (fileIsPdf(file.name, file.mimeType) ? 'document-text-outline' : 'image-outline') : 'cloud-upload-outline'} size={30} color={colors.accent} /><View style={styles.flex}><AppText variant="support">{file?.name ?? 'Adicionar imagem ou PDF'}</AppText><AppText variant="caption" color="secondary">{file ? `${file.mimeType ?? 'Arquivo'} · ${file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'tamanho indisponível'}` : 'PNG, JPG, GIF, WEBP ou PDF · Máx. 5 MB'}</AppText></View></Pressable>{file ? <AppButton variant="ghost" onPress={onRemove}>Remover seleção</AppButton> : null}{error ? <AppText variant="caption" color="danger">{error}</AppText> : null}</View>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { paddingVertical: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg }, section: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg }, field: { gap: 6 }, select: { minHeight: 52, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, fileCard: { minHeight: 100, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, });
