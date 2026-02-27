import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, TabParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { useRooms } from '../../hooks/useRooms';
import AdBanner from '../../components/AdBanner';
import RoomCard from '../../components/RoomCard';
import { resolveMatchId, isRoomParticipant } from '../../utils/roomHelpers';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { Room, RoomStatus } from '../../types';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Matches'>,
  NativeStackScreenProps<MainStackParamList>
>;

type TabDef = { key: string; statuses: RoomStatus[] };

const TAB_KEYS: TabDef[] = [
  { key: 'active',    statuses: ['waiting', 'ready', 'live'] },
  { key: 'completed', statuses: ['completed', 'cancelled'] },
];

export default function MyMatchesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const { rooms, fetchMyRooms, isLoading } = useRooms();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => { fetchMyRooms(); }, []);

  const filtered = rooms.filter((r) => TAB_KEYS[activeTab].statuses.includes(r.status));

  const handlePress = (room: Room) => {
    const matchId = resolveMatchId(room.match);

    if (room.status === 'live' && matchId) {
      if (isRoomParticipant(room, user?._id)) {
        navigation.navigate('Scoring', { matchId, roomId: room._id });
      } else {
        navigation.navigate('LiveViewer', { matchId });
      }
    } else if (room.status === 'completed' && matchId) {
      navigation.navigate('MatchDetail', { matchId });
    } else {
      navigation.navigate('RoomLobby', { roomId: room._id });
    }
  };

  const TABS = [
    { key: 'active',    label: t('myMatches.active') },
    { key: 'completed', label: t('myMatches.completed') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('myMatches.title')}</Text>
      </View>

      <AdBanner placement="match_list_banner" />

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(i)}
            style={[styles.tab, i === activeTab && styles.tabActive]}
          >
            <Text style={[styles.tabText, i === activeTab && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r._id}
        renderItem={({ item }) => (
          <RoomCard room={item} onPress={() => handlePress(item)} showCode />
        )}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMyRooms} tintColor={Colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏏</Text>
              <Text style={styles.emptyText}>
                {activeTab === 0 ? t('myMatches.noActive') : t('myMatches.noCompleted')}
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title:         { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 4,
  },
  tab:           { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center' },
  tabActive:     { backgroundColor: Colors.primary },
  tabText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
  empty:         { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyIcon:     { fontSize: 48 },
  emptyText:     { fontSize: FontSize.md, color: Colors.textSecondary },
});
