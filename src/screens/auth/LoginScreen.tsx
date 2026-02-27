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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { loginWithPassword, requestOTP, isLoading } = useAuthContext();
  const { t } = useTranslation();

  const [tab, setTab]           = useState<'password' | 'otp'>('password');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('auth.login.error'), t('auth.login.fillFields'));
      return;
    }
    const res = await loginWithPassword({ email: email.trim().toLowerCase(), password });
    if (!res.success) {
      Alert.alert(t('auth.login.loginFailed'), res.error?.message ?? t('auth.login.invalidCreds'));
    }
  };

  const handleOTPRequest = async () => {
    if (!email.trim()) {
      Alert.alert(t('auth.login.error'), t('auth.login.enterEmail'));
      return;
    }
    const res = await requestOTP({ email: email.trim().toLowerCase(), purpose: 'login' });
    if (res.success) {
      navigation.navigate('OTPVerify', { email: email.trim().toLowerCase(), purpose: 'login' });
    } else {
      Alert.alert(t('auth.login.error'), res.error?.message ?? t('auth.login.failedOtp'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} message={t('auth.login.signingIn')} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="baseball-outline" size={40} color={Colors.white} />
          </View>
          <Text style={styles.title}>{t('auth.login.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.signInTo')}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setTab('password')}
            style={[styles.tabBtn, tab === 'password' && styles.tabActive]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color={tab === 'password' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabText, tab === 'password' && styles.tabTextActive]}>{t('auth.login.password')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('otp')}
            style={[styles.tabBtn, tab === 'otp' && styles.tabActive]}
          >
            <Ionicons
              name="mail-outline"
              size={14}
              color={tab === 'otp' ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabText, tab === 'otp' && styles.tabTextActive]}>{t('auth.login.otpLogin')}</Text>
          </TouchableOpacity>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.login.email')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.login.emailPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password tab */}
        {tab === 'password' && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.login.passwordLabel')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputInner, styles.inputInnerPwd]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
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
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>{t('auth.login.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePasswordLogin} style={styles.primaryBtn} activeOpacity={0.85}>
              <Ionicons name="log-in-outline" size={20} color={Colors.white} />
              <Text style={styles.primaryBtnText}>{t('auth.login.signIn')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* OTP tab */}
        {tab === 'otp' && (
          <>
            <View style={styles.otpHintRow}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.otpHint}>{t('auth.login.otpHint')}</Text>
            </View>
            <TouchableOpacity onPress={handleOTPRequest} style={styles.primaryBtn} activeOpacity={0.85}>
              <Ionicons name="send-outline" size={18} color={Colors.white} />
              <Text style={styles.primaryBtnText}>{t('auth.login.sendOtp')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>{t('auth.login.noAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>{t('auth.login.register')}</Text>
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
  tabs:          { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 4, gap: 4 },
  tabBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.sm },
  tabActive:     { backgroundColor: Colors.primary },
  tabText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
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
  inputIcon:     { marginRight: 8 },
  inputInner: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: 14,
  },
  inputInnerPwd: { paddingRight: 36 },
  eyeBtn:        { padding: 4 },
  forgotBtn:     { alignSelf: 'flex-end', marginTop: -4 },
  forgotText:    { color: Colors.accent, fontSize: FontSize.sm },
  otpHintRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  otpHint:       { color: Colors.textSecondary, fontSize: FontSize.sm },
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
  registerRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  registerText:   { color: Colors.textSecondary, fontSize: FontSize.sm },
  registerLink:   { color: Colors.accent, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
