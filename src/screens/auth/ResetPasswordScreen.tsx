import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader from '../../components/ScreenHeader';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { resetToken } = route.params;
  const { resetPassword, isLoading } = useAuthContext();
  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) {
      Alert.alert(t('common.error'), t('auth.login.fillFields'));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t('common.error'), t('auth.register.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('common.error'), 'Password must be at least 8 characters');
      return;
    }
    const res = await resetPassword({ resetToken, newPassword: password });
    if (res.success) {
      Alert.alert('Success', 'Password reset successfully! You are now logged in.', [
        { text: t('common.ok') },
      ]);
    } else {
      Alert.alert(t('common.error'), res.error?.message ?? 'Failed to reset password');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} message="Resetting…" />
      <ScreenHeader title={t('auth.resetPassword.title')} onBack={() => navigation.goBack()} />

      <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🔑</Text>
          <Text style={styles.heroTitle}>{t('auth.resetPassword.subtitle')}</Text>
          <Text style={styles.heroDesc}>{t('auth.resetPassword.hint')}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.resetPassword.newPassword')}</Text>
          <View style={styles.pwdRow}>
            <TextInput
              style={[styles.input, styles.pwdInput]}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.resetPassword.placeholder')}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={styles.eyeBtn}>
              <Text>{showPwd ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.resetPassword.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showPwd}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.primaryBtn} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{t('auth.resetPassword.resetBtn')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.background },
  container:      { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 32, gap: Spacing.xl },
  hero:           { alignItems: 'center', gap: 10 },
  heroIcon:       { fontSize: 52 },
  heroTitle:      { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  heroDesc:       { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  field:          { gap: 6 },
  label:          { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  pwdRow:         { flexDirection: 'row', alignItems: 'center' },
  pwdInput:       { flex: 1 },
  eyeBtn:         { position: 'absolute', right: 14, padding: 4 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
