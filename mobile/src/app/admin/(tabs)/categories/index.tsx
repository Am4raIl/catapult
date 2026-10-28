import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppHeader, AppInput, AppModal, AppText, ConfirmDialog, EmptyState, ErrorState, IconButton, InlineError, LoadingState, ScreenScaffold } from '@/components/ui/core';
import { ApiError, friendlyError } from '@/lib/api/client';
import { categoriesApi } from '@/lib/api/services';
import type { Category } from '@/lib/api/types';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const [editing, setEditing] = useState<Category | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const save = useMutation({
    mutationFn: () => editing === 'new' ? categoriesApi.create(name.trim()) : categoriesApi.update((editing as Category).id, name.trim()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setEditing(null); setName(''); setError(''); },
    onError: (cause) => setError(friendlyError(cause)),
  });
  const remove = useMutation({
    mutationFn: (category: Category) => categoriesApi.remove(category.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setDeleting(null); setError(''); },
    onError: (cause) => { setDeleting(null); setError(cause instanceof ApiError && cause.status === 409 ? 'Mova ou exclua os produtos desta categoria antes de removê-la.' : friendlyError(cause)); },
  });
  const open = (category: Category | 'new') => { setEditing(category); setName(category === 'new' ? '' : category.name); setError(''); };
  const submit = () => { if (!name.trim()) { setError('Informe o nome da categoria.'); return; } save.mutate(); };
  const sorted = [...(categories.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return <ScreenScaffold><AppHeader title="Categorias" right={<AppButton icon="add" onPress={() => open('new')}>Nova categoria</AppButton>} />{error ? <View style={styles.error}><InlineError>{error}</InlineError></View> : null}{categories.isLoading ? <LoadingState label="Carregando categorias..." /> : categories.isError ? <ErrorState message={friendlyError(categories.error)} onRetry={() => categories.refetch()} /> : <ScrollView refreshControl={<RefreshControl refreshing={categories.isRefetching} onRefresh={async () => { await categories.refetch(); }} tintColor={colors.accent} />} contentContainerStyle={styles.list}>{sorted.length === 0 ? <EmptyState title="Nenhuma categoria" description="Organize o catálogo criando a primeira categoria." actionLabel="Criar primeira categoria" onAction={() => open('new')} /> : sorted.map((category) => <View key={category.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.rowInfo}><AppText variant="body" style={styles.name}>{category.name}</AppText><AppText variant="caption" color="secondary">{category.products.length} {category.products.length === 1 ? 'produto' : 'produtos'}</AppText></View><IconButton icon="pencil-outline" label={`Renomear ${category.name}`} onPress={() => open(category)} /><IconButton icon="trash-outline" label={`Excluir ${category.name}`} onPress={() => setDeleting(category)} /></View>)}</ScrollView>}
    <AppModal visible={editing != null} title={editing === 'new' ? 'Nova categoria' : 'Renomear categoria'} onClose={() => setEditing(null)}><AppInput label="Nome da categoria" value={name} onChangeText={setName} error={error || undefined} autoFocus returnKeyType="done" onSubmitEditing={submit} /><AppButton fullWidth loading={save.isPending} onPress={submit}>{editing === 'new' ? 'Criar' : 'Salvar'}</AppButton></AppModal>
    <ConfirmDialog visible={!!deleting} title="Excluir categoria?" description={deleting ? `A categoria “${deleting.name}” será removida. Esta ação só funciona se ela não possuir produtos.` : ''} confirmLabel="Excluir categoria" destructive loading={remove.isPending} onCancel={() => setDeleting(null)} onConfirm={() => deleting && remove.mutate(deleting)} />
  </ScreenScaffold>;
}

const styles = StyleSheet.create({ error: { paddingTop: spacing.md }, list: { paddingVertical: spacing.lg, paddingBottom: 100, gap: spacing.md }, row: { minHeight: 76, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, rowInfo: { flex: 1, gap: 4 }, name: { fontWeight: '700' } });
