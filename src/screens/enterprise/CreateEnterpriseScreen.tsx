import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useEnterprise } from '../../hooks/useEnterprise';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader   from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { EnterpriseType } from '../../types';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateEnterprise'>;

const TYPES: { labelKey: string; value: EnterpriseType }[] = [
  { labelKey: 'createEnterprise.types.cricketAcademy',  value: 'cricket_academy' },
  { labelKey: 'createEnterprise.types.club',            value: 'club' },
  { labelKey: 'createEnterprise.types.school',          value: 'school' },
  { labelKey: 'createEnterprise.types.coachingCenter',  value: 'coaching_center' },
  { labelKey: 'createEnterprise.types.association',     value: 'association' },
  { labelKey: 'createEnterprise.types.other',           value: 'other' },
];

export default function CreateEnterpriseScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { createEnterprise, isLoading } = useEnterprise();

  const [name,        setName]        = useState('');
  const [type,        setType]        = useState<EnterpriseType>('cricket_academy');
  const [description, setDescription] = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('createEnterprise.nameRequired'));
      return;
    }
    const res = await createEnterprise({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      contact: {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      },
    });
    if (res.success) {
      navigation.replace('Enterprise');
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to create academy');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} message={t('createEnterprise.creating')} />
      <ScreenHeader title={t('createEnterprise.title')} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field label={t('createEnterprise.academyName')} required>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('createEnterprise.namePlaceholder')}
            placeholderTextColor={Colors.textMuted}
          />
        </Field>

        <View style={styles.field}>
          <Text style={styles.label}>{t('createEnterprise.type')} <Text style={styles.required}>*</Text></Text>
          <View style={styles.typeGrid}>
            {TYPES.map((tp) => (
              <TouchableOpacity
                key={tp.value}
                onPress={() => setType(tp.value)}
                style={[styles.typeBtn, type === tp.value && styles.typeBtnActive]}
              >
                <Text style={[styles.typeText, type === tp.value && styles.typeTextActive]}>{t(tp.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Field label={t('createEnterprise.description')}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('createEnterprise.descriptionPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </Field>

        <Text style={styles.sectionHeader}>{t('createEnterprise.contact')} ({t('createEnterprise.optional')})</Text>

        <Field label={t('createEnterprise.email')}>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder={t('createEnterprise.emailPlaceholder')} placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
        </Field>

        <Field label={t('createEnterprise.phone')}>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('createEnterprise.phonePlaceholder')} placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
        </Field>

        <TouchableOpacity onPress={handleCreate} style={styles.primaryBtn} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{t('createEnterprise.createBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: Colors.background },
  container:       { padding: Spacing.xl, gap: Spacing.lg },
  field:           { gap: 6 },
  label:           { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  required:        { color: Colors.error },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  textArea:        { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  typeGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  typeBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText:        { fontSize: FontSize.sm, color: Colors.textSecondary },
  typeTextActive:  { color: Colors.white, fontWeight: FontWeight.semibold },
  sectionHeader: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText:  { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
