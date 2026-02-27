import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import * as authApi from '../../api/authApi';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('changePassword.weakPassword'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('changePassword.weakPassword'), t('changePassword.minLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('changePassword.mismatch'), t('changePassword.mismatchDesc'));
      return;
    }
    setIsLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      Alert.alert(t('common.success'), 'Password changed successfully.', [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to change password.';
      Alert.alert(t('common.error'), msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <LoadingOverlay visible={isLoading} message={t('changePassword.title') + '…'} />
      <ScreenHeader title={t('changePassword.title')} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Enter your current password and choose a new one.
        </Text>

        <PasswordField
          label={t('changePassword.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          show={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
        />
        <PasswordField
          label={t('changePassword.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
        />
        <PasswordField
          label={t('changePassword.confirmNewPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Ionicons name="lock-closed" size={18} color={Colors.white} />
          <Text style={styles.submitBtnText}>{t('changePassword.changeBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PasswordField({
  label, value, onChangeText, show, onToggle,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          placeholderTextColor={Colors.textMuted}
          placeholder="••••••••"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:              { flex: 1, backgroundColor: Colors.background },
  content:           { padding: Spacing.xl, gap: Spacing.xl },
  subtitle:          { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  fieldWrap:         { gap: 8 },
  fieldLabel:        { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  eyeBtn:            { padding: 4 },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText:     { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
