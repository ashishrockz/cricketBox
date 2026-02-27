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

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { requestOTP, isLoading } = useAuthContext();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.login.enterEmail'));
      return;
    }
    const res = await requestOTP({ email: email.trim().toLowerCase(), purpose: 'password_reset' });
    if (res.success) {
      navigation.navigate('OTPVerify', { email: email.trim().toLowerCase(), purpose: 'password_reset' });
    } else {
      Alert.alert(t('common.error'), res.error?.message ?? 'Failed to send reset code');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} />
      <ScreenHeader title={t('auth.forgotPassword.title')} onBack={() => navigation.goBack()} />

      <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🔐</Text>
          <Text style={styles.heroTitle}>{t('auth.forgotPassword.subtitle')}</Text>
          <Text style={styles.heroDesc}>{t('auth.forgotPassword.hint')}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.login.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.login.emailPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity onPress={handleSend} style={styles.primaryBtn} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{t('auth.forgotPassword.sendCode')}</Text>
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
  heroDesc:       { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
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
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
