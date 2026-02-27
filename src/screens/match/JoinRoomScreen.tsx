import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useRooms }   from '../../hooks/useRooms';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader   from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { RoomRole } from '../../types';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'JoinRoom'>;

const ROLES: { labelKey: string; descKey: string; value: RoomRole }[] = [
  { labelKey: 'joinRoom.roles.teamAManager', descKey: 'joinRoom.roleDesc.teamAManager', value: 'team_a_manager' },
  { labelKey: 'joinRoom.roles.teamBManager', descKey: 'joinRoom.roleDesc.teamBManager', value: 'team_b_manager' },
  { labelKey: 'joinRoom.roles.scorer',       descKey: 'joinRoom.roleDesc.scorer',       value: 'scorer' },
];

export default function JoinRoomScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { fetchRoomByCode, joinRoom, room, isLoading } = useRooms();

  const [code,     setCode]     = useState('');
  const [role,     setRole]     = useState<RoomRole>('scorer');
  const [preview,  setPreview]  = useState(false);

  const handlePreview = async () => {
    if (!code.trim()) {
      Alert.alert(t('common.error'), t('joinRoom.enterCode'));
      return;
    }
    const res = await fetchRoomByCode(code.trim().toUpperCase());
    if (res.success) setPreview(true);
    else Alert.alert(t('common.error'), t('joinRoom.notFound'));
  };

  const handleJoin = async () => {
    if (!room) return;
    const res = await joinRoom(room.roomCode, { role });
    if (res.success && res.result) {
      navigation.replace('RoomLobby', { roomId: (res.result as any)._id });
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to join room');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} />
      <ScreenHeader title={t('joinRoom.title')} onBack={() => navigation.goBack()} />

      <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
        {/* Code input */}
        <View style={styles.codeSection}>
          <Text style={styles.sectionTitle}>{t('joinRoom.enterCode')}</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(v) => { setCode(v); setPreview(false); }}
            placeholder={t('joinRoom.codePlaceholder')}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />
          {!preview && (
            <TouchableOpacity onPress={handlePreview} style={styles.previewBtn} activeOpacity={0.85}>
              <Text style={styles.previewBtnText}>{t('joinRoom.findRoom')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Room Preview */}
        {preview && room && (
          <>
            <View style={styles.roomPreview}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomMeta}>{room.teamAName} vs {room.teamBName}</Text>
              <Text style={styles.roomMeta}>{room.matchFormat} · {room.totalOvers} overs</Text>
              <View style={styles.roomMembers}>
                <Text style={styles.roomMeta}>{room.members.length} members</Text>
              </View>
            </View>

            {/* Role selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('joinRoom.selectRole')}</Text>
              <View style={styles.roles}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                  >
                    <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                      {t(r.labelKey)}
                    </Text>
                    <Text style={styles.roleDesc}>{t(r.descKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={handleJoin} style={styles.primaryBtn} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('joinRoom.joinMatch')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.background },
  container:      { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  codeSection:    { gap: Spacing.md },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  codeInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 4,
  },
  previewBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  previewBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  roomPreview: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  roomName:       { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  roomMeta:       { fontSize: FontSize.sm, color: Colors.textSecondary },
  roomMembers:    { marginTop: 4 },
  section:        { gap: Spacing.md },
  roles:          { gap: Spacing.sm },
  roleCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  roleLabel:      { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  roleLabelActive:{ color: Colors.primaryLight },
  roleDesc:       { fontSize: FontSize.sm, color: Colors.textSecondary },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
