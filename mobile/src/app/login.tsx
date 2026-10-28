import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppInput, AppText, IconButton, InlineError, ScreenScaffold } from '@/components/ui/core';
import { API_ORIGIN, ApiError, friendlyError } from '@/lib/api/client';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { login, notice, dismissNotice, status } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim()) { setError('Preencha usuário e senha.'); return; }
    setLoading(true); setError(''); dismissNotice();
    try { await login(username.trim(), password); router.replace('/admin'); }
    catch (cause) { setError(cause instanceof ApiError && cause.status === 401 ? 'Usuário ou senha incorretos.' : cause instanceof ApiError && cause.status === 400 ? 'Confira os campos informados.' : `${friendlyError(cause)}${API_ORIGIN ? '' : ' Configure EXPO_PUBLIC_API_ORIGIN.'}`); }
    finally { setLoading(false); }
  };

  if (status === 'authenticated') return <Redirect href="/admin" />;
  return <ScreenScaffold><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.logo, { backgroundColor: colors.accent }]}><Ionicons name="cube" size={28} color={colors.accentOnSolid} /></View><View style={styles.title}><AppText variant="heading">Acessar gestão</AppText><AppText color="secondary">Entre para gerenciar catálogo e estoque.</AppText></View>{notice ? <InlineError>{notice}</InlineError> : null}{error ? <InlineError>{error}</InlineError> : null}<AppInput label="Usuário" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} returnKeyType="next" textContentType="username" /><AppInput label="Senha" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} returnKeyType="done" textContentType="password" onSubmitEditing={submit} right={<IconButton icon={showPassword ? 'eye-off-outline' : 'eye-outline'} label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword((value) => !value)} />} /><AppButton fullWidth loading={loading} onPress={submit}>{loading ? 'Entrando...' : 'Entrar'}</AppButton><AppButton fullWidth variant="ghost" onPress={() => router.replace('/')}>Voltar ao catálogo</AppButton></View></ScrollView></KeyboardAvoidingView></ScreenScaffold>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.huge }, card: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: spacing.xxl, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg }, logo: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, title: { gap: spacing.xs, marginBottom: spacing.sm } });
