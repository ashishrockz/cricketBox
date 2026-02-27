import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useRooms }   from '../../hooks/useRooms';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader   from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { PlayingRole } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'AddPlayers'>;

const ROLES: { labelKey: string; value: PlayingRole }[] = [
  { labelKey: 'addPlayers.roles.batsman',       value: 'batsman' },
  { labelKey: 'addPlayers.roles.bowler',         value: 'bowler' },
  { labelKey: 'addPlayers.roles.allRounder',     value: 'all_rounder' },
  { labelKey: 'addPlayers.roles.wicketKeeper',   value: 'wicket_keeper' },
];

export default function AddPlayersScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { roomId, team } = route.params;
  const { room, addPlayer, removePlayer, isLoading } = useRooms();

  const [name,     setName]     = useState('');
  const [role,     setRole]     = useState<PlayingRole>('batsman');

  const players = team === 'team_a' ? (room?.teamA?.players ?? []) : (room?.teamB?.players ?? []);
  const teamName = team === 'team_a' ? (room?.teamAName ?? 'Team A') : (room?.teamBName ?? 'Team B');

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('addPlayers.playerName'));
      return;
    }
    if (players.length >= 11) {
      Alert.alert(t('common.error'), t('addPlayers.teamFull'));
      return;
    }
    const res = await addPlayer(roomId, {
      team,
      name: name.trim(),
      playerType: 'static',
      playingRole: role,
    });
    if (res.success) {
      setName('');
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to add player');
    }
  };

  const handleRemove = async (playerId: string) => {
    const res = await removePlayer(roomId, playerId);
    if (!res.success) {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to remove player');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} />
      <ScreenHeader
        title={t('addPlayers.title', { team: teamName })}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Add Form */}
        <View style={styles.addForm}>
          <Text style={styles.label}>{t('addPlayers.playerName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rohit Sharma"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>{t('addPlayers.playingRole')}</Text>
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

          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, players.length >= 11 && styles.addBtnDisabled]}
            disabled={players.length >= 11}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={18} color={Colors.white} />
            <Text style={styles.addBtnText}>{t('addPlayers.addPlayer')}</Text>
          </TouchableOpacity>
        </View>

        {/* Players List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('addPlayers.teamCount', { team: teamName, count: players.length })}
          </Text>
          {players.map((p, idx) => (
            <View key={p._id} style={styles.playerRow}>
              <Text style={styles.playerNum}>{idx + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerRole}>{p.playingRole.replace('_', ' ')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(p._id)}
                style={styles.removeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {players.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('addPlayers.noPlayers')}</Text>
            </View>
          )}
        </View>

        {players.length > 0 && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.doneBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{t('addPlayers.done')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.background },
  container:      { padding: Spacing.xl, gap: Spacing.xl },
  addForm: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  label:          { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  roleRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  roleBtnActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleText:       { fontSize: FontSize.sm, color: Colors.textSecondary },
  roleTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText:     { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  section:        { gap: Spacing.sm },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  playerNum:      { width: 24, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  playerInfo:     { flex: 1 },
  playerName:     { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  playerRole:     { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
  removeBtn:      {},
  empty: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyText:      { color: Colors.textMuted, fontSize: FontSize.sm },
  doneBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText:    { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
