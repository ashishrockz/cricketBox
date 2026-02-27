import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, TabParamList } from '../../navigation/types';
import { useRooms }      from '../../hooks/useRooms';
import LoadingOverlay    from '../../components/LoadingOverlay';
import ScreenHeader      from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { MatchFormat } from '../../types';
import { useTranslation } from 'react-i18next';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Create'>,
  NativeStackScreenProps<MainStackParamList>
>;

const FORMATS: { labelKey: string; value: MatchFormat; overs: number }[] = [
  { labelKey: 'createRoom.formats.t10',    value: 'T10',    overs: 10  },
  { labelKey: 'createRoom.formats.t20',    value: 'T20',    overs: 20  },
  { labelKey: 'createRoom.formats.odi',    value: 'ODI',    overs: 50  },
  { labelKey: 'createRoom.formats.test',   value: 'TEST',   overs: 0   },
  { labelKey: 'createRoom.formats.custom', value: 'CUSTOM', overs: 0   },
];

const ROLES: { labelKey: string; value: string }[] = [
  { labelKey: 'createRoom.roles.scorer',       value: 'scorer' },
  { labelKey: 'createRoom.roles.teamAManager', value: 'team_a_manager' },
  { labelKey: 'createRoom.roles.teamBManager', value: 'team_b_manager' },
];

export default function CreateRoomScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { createRoom, isLoading } = useRooms();

  const [name,      setName]      = useState('');
  const [teamA,     setTeamA]     = useState('');
  const [teamB,     setTeamB]     = useState('');
  const [format,    setFormat]    = useState<MatchFormat>('T20');
  const [overs,     setOvers]     = useState('20');
  const [role,      setRole]      = useState('scorer');

  const handleFormatSelect = (f: typeof FORMATS[0]) => {
    setFormat(f.value);
    if (f.overs > 0) setOvers(String(f.overs));
  };

  const handleCreate = async () => {
    if (!name.trim() || !teamA.trim() || !teamB.trim()) {
      Alert.alert(t('common.error'), t('createRoom.errorFillFields'));
      return;
    }
    const totalOvers = parseInt(overs, 10);
    if (format !== 'TEST' && (!totalOvers || totalOvers < 1)) {
      Alert.alert(t('common.error'), t('createRoom.errorInvalidOvers'));
      return;
    }
    const res = await createRoom({
      name: name.trim(),
      matchFormat: format,
      totalOvers: format === 'TEST' ? 0 : totalOvers,
      teamAName: teamA.trim(),
      teamBName: teamB.trim(),
      creatorRole: role as any,
    });
    if (res.success && res.result) {
      navigation.navigate('RoomLobby', { roomId: (res.result as any)._id });
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? t('createRoom.errorCreateFailed'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} message={t('createRoom.creating')} />
      <ScreenHeader title={t('createRoom.title')} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Match Name */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('createRoom.matchName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sunday League Final"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Format */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('createRoom.format')}</Text>
          <View style={styles.formatRow}>
            {FORMATS.map((f) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => handleFormatSelect(f)}
                style={[styles.formatBtn, format === f.value && styles.formatBtnActive]}
              >
                <Text style={[styles.formatText, format === f.value && styles.formatTextActive]}>
                  {t(f.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overs */}
        {format !== 'TEST' && (
          <View style={styles.field}>
            <Text style={styles.label}>{t('createRoom.overs')}</Text>
            <TextInput
              style={styles.input}
              value={overs}
              onChangeText={setOvers}
              placeholder="20"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
        )}

        {/* Teams */}
        <View style={styles.teamsRow}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>{t('createRoom.teamA')}</Text>
            <TextInput
              style={styles.input}
              value={teamA}
              onChangeText={setTeamA}
              placeholder={t('createRoom.teamA')}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>{t('createRoom.teamB')}</Text>
            <TextInput
              style={styles.input}
              value={teamB}
              onChangeText={setTeamB}
              placeholder={t('createRoom.teamB')}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Creator Role */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('createRoom.yourRole')}</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
              >
                <Text style={[styles.roleText, role === r.value && styles.roleTextActive]}>
                  {t(r.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={handleCreate} style={styles.primaryBtn} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{t('createRoom.createRoom')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: Colors.background },
  container:       { padding: Spacing.xl, gap: Spacing.lg },
  field:           { gap: 6 },
  label:           { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
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
  formatRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  formatBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  formatBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  formatText:      { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  formatTextActive:{ color: Colors.white, fontWeight: FontWeight.semibold },
  teamsRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  vsText:          { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  roleRow:         { flexDirection: 'column', gap: 8 },
  roleBtn: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  roleBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleText:        { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  roleTextActive:  { color: Colors.white, fontWeight: FontWeight.semibold },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText:  { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
