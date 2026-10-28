import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, ReactNode, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleProp, StyleSheet, Switch,
  Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/providers/theme-provider';
import { maxContentWidth, radius, spacing, ThemePreference } from '@/theme/tokens';

export function AppText({ children, variant = 'body', color = 'primary', style, numberOfLines }: PropsWithChildren<{
  variant?: 'display' | 'heading' | 'section' | 'body' | 'support' | 'caption';
  color?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'warning' | 'onAccent';
  style?: StyleProp<any>;
  numberOfLines?: number;
}>) {
  const { colors } = useAppTheme();
  const colorMap = { primary: colors.textPrimary, secondary: colors.textSecondary, accent: colors.accent, danger: colors.danger, success: colors.success, warning: colors.warning, onAccent: colors.accentOnSolid };
  return <Text maxFontSizeMultiplier={1.5} numberOfLines={numberOfLines} style={[styles[variant], { color: colorMap[color] }, style]}>{children}</Text>;
}

export function ScreenScaffold({ children, padded = true, style }: PropsWithChildren<{ padded?: boolean; style?: StyleProp<ViewStyle> }>) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.screenContent, padded && styles.screenPadding, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function AppHeader({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      {onBack ? <IconButton icon="arrow-back" label="Voltar" onPress={onBack} /> : null}
      <View style={styles.headerTitle}>
        <AppText variant="section" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="caption" color="secondary" numberOfLines={1}>{subtitle}</AppText> : null}
      </View>
      {right ?? (onBack ? <View style={styles.iconPlaceholder} /> : null)}
    </View>
  );
}

type ButtonProps = PropsWithChildren<{ onPress: () => void; loading?: boolean; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap; fullWidth?: boolean; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }>;
export function AppButton({ children, onPress, loading, disabled, icon, fullWidth, variant = 'primary' }: ButtonProps) {
  const { colors } = useAppTheme();
  const background = variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : variant === 'ghost' ? 'transparent' : colors.surface;
  const foreground = variant === 'primary' || variant === 'danger' ? colors.accentOnSolid : variant === 'ghost' ? colors.accent : colors.textPrimary;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, busy: !!loading }} disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => [styles.button, fullWidth && styles.fullWidth, { backgroundColor: background, borderColor: variant === 'secondary' ? colors.border : background, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 }]}>
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <Ionicons name={icon} color={foreground} size={18} /> : null}
      <AppText variant="support" style={styles.buttonLabel} color={variant === 'primary' || variant === 'danger' ? 'onAccent' : variant === 'ghost' ? 'accent' : 'primary'}>{children}</AppText>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} hitSlop={4} onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surfaceMuted, opacity: disabled ? 0.4 : pressed ? 0.65 : 1 }]}><Ionicons name={icon} size={20} color={colors.textPrimary} /></Pressable>;
}

export function AppInput({ label, error, hint, right, style, ...props }: TextInputProps & { label: string; error?: string; hint?: string; right?: ReactNode; style?: StyleProp<any> }) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <AppText variant="support" style={styles.fieldLabel}>{label}</AppText>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: error ? colors.danger : focused ? colors.accent : colors.border }]}>
        <TextInput {...props} placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }} style={[styles.input, { color: colors.textPrimary }, style]} />
        {right}
      </View>
      {error ? <AppText variant="caption" color="danger">{error}</AppText> : hint ? <AppText variant="caption" color="secondary">{hint}</AppText> : null}
    </View>
  );
}

export function SearchField({ value, onChangeText, placeholder = 'Buscar produtos' }: { value: string; onChangeText: (text: string) => void; placeholder?: string }) {
  const { colors } = useAppTheme();
  return <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="search" size={20} color={colors.textSecondary} /><TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textSecondary} returnKeyType="search" style={[styles.searchInput, { color: colors.textPrimary }]} />{value ? <IconButton icon="close" label="Limpar busca" onPress={() => onChangeText('')} /> : null}</View>;
}

export function FilterChip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderColor: selected ? colors.accent : colors.border, opacity: pressed ? 0.75 : 1 }]}><AppText variant="support" color={selected ? 'accent' : 'primary'}>{label}</AppText></Pressable>;
}

export function AppSwitch({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const { colors } = useAppTheme();
  return <View style={styles.switchRow}><AppText>{label}</AppText><Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.surface} /></View>;
}

export function EmptyState({ title, description, actionLabel, onAction, icon = 'cube-outline' }: { title: string; description?: string; actionLabel?: string; onAction?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useAppTheme();
  return <View style={styles.state}><View style={[styles.stateIcon, { backgroundColor: colors.surfaceMuted }]}><Ionicons name={icon} size={30} color={colors.textSecondary} /></View><AppText variant="section" style={styles.stateText}>{title}</AppText>{description ? <AppText color="secondary" style={styles.stateText}>{description}</AppText> : null}{actionLabel && onAction ? <AppButton variant="secondary" onPress={onAction}>{actionLabel}</AppButton> : null}</View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState title="Algo não saiu como esperado" description={message} actionLabel={onRetry ? 'Tentar novamente' : undefined} onAction={onRetry} icon="alert-circle-outline" />;
}

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  const { colors } = useAppTheme();
  return <View style={styles.state}><ActivityIndicator size="large" color={colors.accent} /><AppText color="secondary">{label}</AppText></View>;
}

export function InlineError({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return <View accessibilityRole="alert" style={[styles.inlineError, { backgroundColor: colors.dangerSoft }]}><Ionicons name="alert-circle-outline" size={18} color={colors.danger} /><AppText variant="support" color="danger" style={styles.flex}>{children}</AppText></View>;
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={styles.sectionHeading}><AppText variant="section">{title}</AppText>{action}</View>;
}

export function AppModal({ visible, title, children, onClose }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const { colors } = useAppTheme();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={onClose}><Pressable style={[styles.sheet, { backgroundColor: colors.surfaceElevated }]} onPress={() => undefined}><View style={[styles.sheetHandle, { backgroundColor: colors.border }]} /><View style={styles.sheetHeader}><AppText variant="section">{title}</AppText><IconButton icon="close" label="Fechar" onPress={onClose} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>{children}</ScrollView></Pressable></Pressable></Modal>;
}

export function ConfirmDialog({ visible, title, description, confirmLabel, destructive, loading, onCancel, onConfirm }: { visible: boolean; title: string; description: string; confirmLabel: string; destructive?: boolean; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { colors } = useAppTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}><View style={[styles.dialogBackdrop, { backgroundColor: colors.overlay }]}><View style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}><AppText variant="section">{title}</AppText><AppText color="secondary">{description}</AppText><View style={styles.dialogActions}><AppButton variant="secondary" onPress={onCancel}>Cancelar</AppButton><AppButton variant={destructive ? 'danger' : 'primary'} loading={loading} onPress={onConfirm}>{confirmLabel}</AppButton></View></View></View></Modal>;
}

export function ThemeSelector() {
  const { colors, preference, setPreference } = useAppTheme();
  const [open, setOpen] = useState(false);
  const options: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' }, { value: 'light', label: 'Claro', icon: 'sunny-outline' }, { value: 'dark', label: 'Escuro', icon: 'moon-outline' },
  ];
  return <><IconButton icon="contrast-outline" label="Escolher tema" onPress={() => setOpen(true)} /><AppModal visible={open} title="Aparência" onClose={() => setOpen(false)}>{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: preference === option.value }} onPress={() => { setPreference(option.value); setOpen(false); }} style={styles.optionRow}><Ionicons name={option.icon} size={22} color={preference === option.value ? colors.accent : colors.textSecondary} /><AppText style={styles.flex}>{option.label}</AppText>{preference === option.value ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}</Pressable>)}</AppModal></>;
}


const styles = StyleSheet.create({
  flex: { flex: 1 }, screen: { flex: 1 }, screenContent: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', flex: 1 }, screenPadding: { paddingHorizontal: spacing.xl },
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' }, heading: { fontSize: 26, lineHeight: 32, fontWeight: '700' }, section: { fontSize: 19, lineHeight: 25, fontWeight: '700' }, body: { fontSize: 16, lineHeight: 23, fontWeight: '400' }, support: { fontSize: 14, lineHeight: 19, fontWeight: '600' }, caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.sm }, headerTitle: { flex: 1 }, iconPlaceholder: { width: 44 },
  button: { minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, buttonLabel: { fontWeight: '700' }, fullWidth: { width: '100%' }, iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  fieldWrap: { gap: 6 }, fieldLabel: { marginLeft: 2 }, inputWrap: { minHeight: 52, borderWidth: 1, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, input: { minHeight: 50, paddingHorizontal: spacing.lg, fontSize: 16, flex: 1 },
  search: { minHeight: 54, borderWidth: 1, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg, paddingRight: 4, gap: spacing.sm }, searchInput: { flex: 1, minHeight: 50, fontSize: 16 }, chip: { minHeight: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  switchRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }, state: { flexGrow: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl }, stateIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' }, stateText: { textAlign: 'center' }, inlineError: { padding: spacing.md, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' }, sheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: spacing.xxl }, sheetHandle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 9 }, sheetHeader: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sheetContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  dialogBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }, dialog: { width: '100%', maxWidth: 440, padding: spacing.xxl, borderRadius: radius.lg, gap: spacing.lg }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, flexWrap: 'wrap' }, optionRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
