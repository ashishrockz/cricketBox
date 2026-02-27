import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useUser }       from '../../hooks/useUser';
import { useAuthContext } from '../../context/AuthContext';
import LoadingOverlay    from '../../components/LoadingOverlay';
import ScreenHeader      from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { PlayingRole, BattingStyle } from '../../types';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>;

const PLAYING_ROLES: { labelKey: string; value: PlayingRole }[] = [
  { labelKey: 'addPlayers.roles.batsman',      value: 'batsman' },
  { labelKey: 'addPlayers.roles.bowler',        value: 'bowler' },
  { labelKey: 'addPlayers.roles.allRounder',    value: 'all_rounder' },
  { labelKey: 'addPlayers.roles.wicketKeeper',  value: 'wicket_keeper' },
];

const BATTING_STYLE_KEYS: { labelKey: string; value: BattingStyle }[] = [
  { labelKey: 'editProfile.battingStyles.rightHand', value: 'right_hand' },
  { labelKey: 'editProfile.battingStyles.leftHand',  value: 'left_hand' },
];

export default function EditProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuthContext();
  const { updateProfile, isLoading } = useUser();

  const [fullName,      setFullName]      = useState(user?.fullName ?? '');
  const [phone,         setPhone]         = useState(user?.phone ?? '');
  const [bio,           setBio]           = useState(user?.bio ?? '');
  const [city,          setCity]          = useState(user?.city ?? '');
  const [playingRole,   setPlayingRole]   = useState<PlayingRole | undefined>(user?.playingRole);
  const [battingStyle,  setBattingStyle]  = useState<BattingStyle | undefined>(user?.battingStyle);
  const [bowlingStyle,  setBowlingStyle]  = useState(user?.bowlingStyle ?? '');

  const handleSave = async () => {
    const res = await updateProfile({
      fullName:     fullName.trim() || undefined,
      phone:        phone.trim() || undefined,
      bio:          bio.trim() || undefined,
      city:         city.trim() || undefined,
      playingRole,
      battingStyle,
      bowlingStyle: bowlingStyle.trim() || undefined,
    });
    if (res.success) {
      await refreshUser();
      Alert.alert(t('editProfile.savedTitle'), t('editProfile.savedMessage'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to update profile');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} message={t('editProfile.saving')} />
      <ScreenHeader
        title={t('editProfile.title')}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>{t('editProfile.save')}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Placeholder */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(fullName || user?.username || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.avatarHint}>@{user?.username}</Text>
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionTitle}>{t('editProfile.personalInfo')}</Text>

        <Field label={t('editProfile.fullName')}>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder={t('editProfile.fullNamePlaceholder')} placeholderTextColor={Colors.textMuted} />
        </Field>

        <Field label={t('editProfile.phone')}>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('editProfile.phonePlaceholder')} placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
        </Field>

        <Field label={t('editProfile.city')}>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder={t('editProfile.cityPlaceholder')} placeholderTextColor={Colors.textMuted} />
        </Field>

        <Field label={t('editProfile.bio')}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder={t('editProfile.bioPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </Field>

        {/* Cricket Info */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>{t('editProfile.cricketProfile')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('editProfile.playingRole')}</Text>
          <View style={styles.chipRow}>
            {PLAYING_ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setPlayingRole(r.value)}
                style={[styles.chip, playingRole === r.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, playingRole === r.value && styles.chipTextActive]}>
                  {t(r.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('editProfile.battingStyle')}</Text>
          <View style={styles.chipRow}>
            {BATTING_STYLE_KEYS.map((b) => (
              <TouchableOpacity
                key={b.value}
                onPress={() => setBattingStyle(b.value)}
                style={[styles.chip, battingStyle === b.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, battingStyle === b.value && styles.chipTextActive]}>
                  {t(b.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Field label={t('editProfile.bowlingStyle')}>
          <TextInput
            style={styles.input}
            value={bowlingStyle}
            onChangeText={setBowlingStyle}
            placeholder={t('editProfile.bowlingPlaceholder')}
            placeholderTextColor={Colors.textMuted}
          />
        </Field>

        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{t('editProfile.saveChanges')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: Colors.background },
  saveText:      { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  container:     { padding: Spacing.xl, gap: Spacing.lg },
  avatarSection: { alignItems: 'center', gap: 8, marginBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter:  { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.white },
  avatarHint:    { fontSize: FontSize.sm, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    paddingBottom: 6,
  },
  field:         { gap: 6 },
  label:         { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
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
  textArea:      { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  chipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:      { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive:{ color: Colors.white, fontWeight: FontWeight.semibold },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText:   { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
