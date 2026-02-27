import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../theme';
import type { Room, RoomStatus } from '../types';

function statusColor(status: RoomStatus): string {
  switch (status) {
    case 'live':      return Colors.success;
    case 'waiting':   return Colors.warning;
    case 'completed': return Colors.textMuted;
    default:          return Colors.error;
  }
}

interface Props {
  room: Room;
  onPress: () => void;
  /** Show the room code in the bottom row (used in match list) */
  showCode?: boolean;
}

export default function RoomCard({ room, onPress, showCode = false }: Props) {
  const color = statusColor(room.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>{room.name}</Text>
        <View style={[styles.badge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.badgeText, { color }]}>{room.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.teams}>{room.teamAName}  vs  {room.teamBName}</Text>
      <View style={styles.bottom}>
        <Text style={styles.meta}>{room.matchFormat} · {room.totalOvers} ov</Text>
        {showCode && <Text style={styles.meta}>{room.roomCode}</Text>}
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  top:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name:      { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  badge:     { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  teams:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  bottom:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta:      { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
});
