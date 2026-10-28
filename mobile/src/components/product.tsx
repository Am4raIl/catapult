import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { mediaUrl } from '@/lib/api/client';
import { productsApi } from '@/lib/api/services';
import type { Product } from '@/lib/api/types';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { formatCurrency, stockStatus } from '@/utils/format';

import { AppButton, AppText } from './ui/core';

export function StockBadge({ quantity }: { quantity: number }) {
  const { colors } = useAppTheme();
  const status = stockStatus(quantity);
  const data = status === 'OUT_OF_STOCK' ? { label: 'Esgotado', color: colors.danger, bg: colors.dangerSoft, icon: 'close-circle' as const } : status === 'LOW_STOCK' ? { label: 'Estoque baixo', color: colors.warning, bg: colors.warningSoft, icon: 'alert-circle' as const } : { label: 'Em estoque', color: colors.success, bg: colors.successSoft, icon: 'checkmark-circle' as const };
  return <View style={[styles.badge, { backgroundColor: data.bg }]}><Ionicons name={data.icon} size={14} color={data.color} /><AppText variant="caption" style={{ color: data.color }}>{data.label}</AppText></View>;
}

export function StatusBadge({ active }: { active: boolean }) {
  const { colors } = useAppTheme();
  return <View style={[styles.badge, { backgroundColor: active ? colors.successSoft : colors.surfaceMuted }]}><AppText variant="caption" style={{ color: active ? colors.success : colors.textSecondary }}>{active ? 'Ativo' : 'Inativo'}</AppText></View>;
}

export function ProductMedia({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { colors } = useAppTheme();
  const typeQuery = useQuery({ queryKey: ['media-type', product.id, product.photo], queryFn: () => productsApi.mediaType(product.photo!), enabled: !!product.photo, staleTime: 10 * 60_000, retry: 1 });
  const type = typeQuery.data;
  const isImage = type?.startsWith('image/');
  const isPdf = type === 'application/pdf';
  const open = () => product.photo && WebBrowser.openBrowserAsync(mediaUrl(product.photo)!);
  if (!product.photo) return <View style={[styles.media, compact && styles.mediaCompact, { backgroundColor: colors.surfaceMuted }]}><Ionicons name="cube-outline" size={compact ? 24 : 42} color={colors.textSecondary} />{!compact ? <AppText variant="support" color="secondary">Sem imagem</AppText> : null}</View>;
  if (typeQuery.isLoading) return <View style={[styles.media, compact && styles.mediaCompact, { backgroundColor: colors.skeleton }]} />;
  if (isImage) return <View style={[styles.media, compact && styles.mediaCompact, { backgroundColor: colors.surfaceMuted }]}><Image source={{ uri: mediaUrl(product.photo)! }} contentFit="contain" transition={180} style={StyleSheet.absoluteFill} accessibilityLabel={`Arquivo de ${product.name}`} /></View>;
  return <View style={[styles.media, compact && styles.mediaCompact, { backgroundColor: colors.surfaceMuted }]}><Ionicons name={isPdf ? 'document-text-outline' : 'attach-outline'} size={compact ? 25 : 44} color={colors.accent} />{!compact ? <><AppText variant="section">{isPdf ? 'Documento PDF' : 'Arquivo do produto'}</AppText><AppButton variant="secondary" onPress={open}>{isPdf ? 'Abrir PDF' : 'Abrir arquivo'}</AppButton></> : null}</View>;
}

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${product.name}`} onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}><ProductMedia product={product} /><View style={styles.cardBody}><AppText variant="caption" color="secondary" numberOfLines={1}>{product.category.name}</AppText><AppText variant="body" style={styles.productName} numberOfLines={2}>{product.name}</AppText><AppText variant="section">{formatCurrency(product.price)}</AppText><StockBadge quantity={product.stock_quantity} /></View></Pressable>;
}

export function ProductRow({ product, onPress, stockControl }: { product: Product; onPress: () => void; stockControl?: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.84 : 1 }]}><ProductMedia product={product} compact /><View style={styles.rowInfo}><View style={styles.rowBadges}><StatusBadge active={product.active} /><StockBadge quantity={product.stock_quantity} /></View><AppText variant="body" style={styles.productName} numberOfLines={2}>{product.name}</AppText><AppText variant="caption" color="secondary" numberOfLines={1}>{product.category.name} · {formatCurrency(product.price)}</AppText>{stockControl}</View><Ionicons name="chevron-forward" size={20} color={colors.textSecondary} /></Pressable>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', minHeight: 25, borderRadius: radius.pill, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 5 }, media: { width: '100%', aspectRatio: 1.16, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: spacing.md, overflow: 'hidden' }, mediaCompact: { width: 76, height: 76, aspectRatio: undefined },
  card: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.sm, gap: spacing.sm, overflow: 'hidden' }, cardBody: { padding: spacing.sm, gap: 6 }, productName: { fontWeight: '700' }, row: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, rowInfo: { flex: 1, gap: 6 }, rowBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
