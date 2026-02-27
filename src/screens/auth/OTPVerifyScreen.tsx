import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader from '../../components/ScreenHeader';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerify'>;

export default function OTPVerifyScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { email, purpose } = route.params;
  const { verifyOTP, requestOTP, isLoading } = useAuthContext();
  const { t } = useTranslation();

  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[idx] = cleaned;
    setOtp(next);
    if (cleaned && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleBackspace = (idx: number) => {
    if (!otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert(t('common.error'), 'Please enter the 6-digit code');
      return;
    }
    const res = await verifyOTP({ email, otp: code, purpose });
    if (res.success) {
      if (purpose === 'password_reset' && res.resetToken) {
        navigation.replace('ResetPassword', { resetToken: res.resetToken, email });
      }
      // If login, AuthContext updates user → AppNavigator navigates to Main
    } else {
      Alert.alert('Invalid OTP', res.error?.message ?? 'Please try again');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    const res = await requestOTP({ email, purpose });
    if (res.success) {
      setCountdown(res.cooldownSeconds ?? 60);
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } else {
      Alert.alert(t('common.error'), res.error?.message ?? 'Failed to resend OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} message="Verifying…" />
      <ScreenHeader title={t('auth.otp.verifyOtp')} onBack={() => navigation.goBack()} />

      <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.info}>
          <Text style={styles.infoIcon}>📧</Text>
          <Text style={styles.infoTitle}>{t('auth.otp.checkEmail')}</Text>
          <Text style={styles.infoDesc}>
            {t('auth.otp.codeSentTo')}{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => { refs.current[idx] = r; }}
              style={[styles.otpInput, digit ? styles.otpFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(v, idx)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') handleBackspace(idx);
              }}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleVerify} style={styles.primaryBtn} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{t('auth.otp.verify')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={countdown > 0} style={styles.resendBtn}>
          <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? t('auth.otp.resendIn', { seconds: countdown }) : t('auth.otp.resendOtp')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: Colors.background },
  container:       { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 32, gap: Spacing.xl, alignItems: 'center' },
  info:            { alignItems: 'center', gap: 10 },
  infoIcon:        { fontSize: 48 },
  infoTitle:       { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  infoDesc:        { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailText:       { color: Colors.accent, fontWeight: FontWeight.semibold },
  otpRow:          { flexDirection: 'row', gap: 10, marginTop: 8 },
  otpInput: {
    width: 46,
    height: 56,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    textAlign: 'center',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  otpFilled:       { borderColor: Colors.primary },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText:  { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  resendBtn:       { marginTop: 4 },
  resendText:      { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  resendDisabled:  { color: Colors.textMuted },
});
