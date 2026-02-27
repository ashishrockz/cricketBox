import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import LoadingOverlay from '../../components/LoadingOverlay';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export default function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuthContext();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    setFieldErrors({});

    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirm) {
      Alert.alert(t('common.error'), t('auth.register.fillFields'));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t('common.error'), t('auth.register.passwordMismatch'));
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setFieldErrors({ password: 'Password must contain uppercase, lowercase, number and special character' });
      return;
    }

    const res = await register({
      fullName:  fullName.trim(),
      username:  username.trim().toLowerCase(),
      email:     email.trim().toLowerCase(),
      password,
    });

    if (!res.success) {
      const apiErrors = (res as any).error?.errors as Record<string, string> | null | undefined;
      if (apiErrors && Object.keys(apiErrors).length) {
        setFieldErrors(apiErrors);
      } else {
        Alert.alert(t('auth.register.registrationFailed'), (res as any).error?.message ?? t('common.error'));
      }
    }
  };

  const clearFieldError = (field: string) =>
    setFieldErrors((e) => ({ ...e, [field]: '' }));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} message={t('auth.register.creatingAccount')} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="person-add-outline" size={36} color={Colors.white} />
          </View>
          <Text style={styles.title}>{t('auth.register.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.joinCricCircle')}</Text>
        </View>

        {/* Full Name */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.register.fullName')}</Text>
          <View style={[styles.inputWrapper, !!fieldErrors.fullName && styles.inputWrapperError]}>
            <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              value={fullName}
              onChangeText={(v) => { setFullName(v); clearFieldError('fullName'); }}
              placeholder={t('auth.register.fullNamePlaceholder')}
              placeholderTextColor={Colors.textMuted}
              autoCorrect={false}
            />
          </View>
          {!!fieldErrors.fullName && <Text style={styles.errorText}>{fieldErrors.fullName}</Text>}
        </View>

        {/* Username */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.register.username')}</Text>
          <View style={[styles.inputWrapper, !!fieldErrors.username && styles.inputWrapperError]}>
            <Ionicons name="at-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              value={username}
              onChangeText={(v) => { setUsername(v); clearFieldError('username'); }}
              placeholder={t('auth.register.usernamePlaceholder')}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {!!fieldErrors.username && <Text style={styles.errorText}>{fieldErrors.username}</Text>}
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.register.email')}</Text>
          <View style={[styles.inputWrapper, !!fieldErrors.email && styles.inputWrapperError]}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              value={email}
              onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
              placeholder={t('auth.register.emailPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {!!fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.register.password')}</Text>
          <View style={[styles.inputWrapper, !!fieldErrors.password && styles.inputWrapperError]}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputInner, styles.inputInnerPwd]}
              value={password}
              onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
              placeholder={t('auth.register.passwordHint')}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {!!fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
        </View>

        {/* Confirm Password */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.register.confirmPassword')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputInner, styles.inputInnerPwd]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity onPress={handleRegister} style={styles.primaryBtn} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.primaryBtnText}>{t('auth.register.createAccountBtn')}</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>{t('auth.register.alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>{t('auth.register.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: Colors.background },
  container:     { flexGrow: 1, paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  header:        { alignItems: 'center', gap: 8, marginBottom: 8 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title:         { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle:      { fontSize: FontSize.md, color: Colors.textSecondary },
  field:         { gap: 6 },
  label:         { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperError: { borderColor: Colors.error },
  inputIcon:     { marginRight: 8 },
  inputInner: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: 14,
  },
  inputInnerPwd: { paddingRight: 4 },
  eyeBtn:        { padding: 4 },
  errorText:     { fontSize: FontSize.xs, color: Colors.error },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: 4,
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  loginRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  loginText:      { color: Colors.textSecondary, fontSize: FontSize.sm },
  loginLink:      { color: Colors.accent, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
