import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/core';
import { useAppTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export function ProductCheckbox({ checked, label, showLabel = false, disabled = false, onPress }: {
  checked: boolean | 'mixed'; label: string; showLabel?: boolean; disabled?: boolean; onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} aria-checked={checked} aria-disabled={disabled} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.checkbox, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>
    <Ionicons name={checked === 'mixed' ? 'remove-circle' : checked ? 'checkbox' : 'square-outline'} size={26} color={checked ? colors.accent : colors.textSecondary} />
    {showLabel ? <AppText variant="support" style={{ flexShrink: 1 }}>{label}</AppText> : null}
  </Pressable>;
}

const styles = StyleSheet.create({ checkbox: { minWidth: 44, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm } });
