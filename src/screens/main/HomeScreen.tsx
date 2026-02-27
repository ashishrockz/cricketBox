import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, TabParamList } from '../../navigation/types';
import { useAuthContext } from '../../context/AuthContext';
import { useRooms }        from '../../hooks/useRooms';
import { useSubscription } from '../../hooks/useSubscription';
import AdBanner from '../../components/AdBanner';
import RoomCard from '../../components/RoomCard';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import { resolveMatchId, isRoomParticipant } from '../../utils/roomHelpers';
import type { Room } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<MainStackParamList>
>;

const PLAN_COLORS: Record<string, string> = {
  free: Colors.textMuted,
  basic: Colors.info,
  pro: Colors.accent,
  enterprise: Colors.success,
};

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const { rooms, fetchMyRooms, isLoading } = useRooms();
  const { subscription, fetchMySubscription } = useSubscription();
  const { t } = useTranslation();

  useEffect(() => {
    fetchMyRooms();
    fetchMySubscription();
  }, []);

  const liveRooms      = (rooms ?? []).filter((r) => r.status === 'live');
  const completedRooms = (rooms ?? []).filter((r) => r.status === 'completed').slice(0, 3);

  const goToRoom = (room: Room) => {
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

  const planSlug = user?.subscriptionPlan ?? 'free';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMyRooms} tintColor={Colors.accent} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>{t('home.greeting', { name: user?.fullName ?? user?.username })}</Text>
          <View style={styles.planBadge}>
            <Text style={[styles.planText, { color: PLAN_COLORS[planSlug] }]}>
              {t(`home.plans.${planSlug}` as any)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Profile' } as any)}>
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>
                {(user?.fullName ?? user?.username ?? 'U')[0].toUpperCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Ad Banner */}
      <AdBanner placement="home_banner" />

      {/* CTA Cards */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.ctaCard, { backgroundColor: Colors.primary }]}
          onPress={() => navigation.navigate('Tabs', { screen: 'Create' } as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={28} color={Colors.white} />
          <Text style={styles.ctaText}>{t('home.startMatch')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctaCard, { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder }]}
          onPress={() => navigation.navigate('JoinRoom')}
          activeOpacity={0.85}
        >
          <Ionicons name="enter-outline" size={28} color={Colors.accent} />
          <Text style={[styles.ctaText, { color: Colors.text }]}>{t('home.joinMatch')}</Text>
        </TouchableOpacity>
      </View>

      {/* Live Matches */}
      {liveRooms.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.liveIndicator} />
            <Text style={styles.sectionTitle}>{t('home.liveNow')}</Text>
          </View>
          {liveRooms.map((room) => (
            <RoomCard key={room._id} room={room} onPress={() => goToRoom(room)} />
          ))}
        </View>
      )}

      {/* Recent Matches */}
      {completedRooms.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.recentMatches')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Matches' } as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {completedRooms.map((room) => (
            <RoomCard key={room._id} room={room} onPress={() => goToRoom(room)} />
          ))}
        </View>
      )}

      {/* Empty state */}
      {rooms.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏏</Text>
          <Text style={styles.emptyTitle}>{t('home.noMatches')}</Text>
          <Text style={styles.emptyDesc}>{t('home.startOrJoin')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  greeting:      { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  planBadge:     { marginTop: 4 },
  planText:      { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg:     { width: 44, height: 44, borderRadius: 22 },
  avatarInitial: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  ctaRow:        { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, marginVertical: Spacing.md },
  ctaCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  ctaText:       { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  section:       { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: 8 },
  sectionTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, flex: 1 },
  seeAll:        { fontSize: FontSize.sm, color: Colors.accent },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  emptyState:    { alignItems: 'center', gap: 12, paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:     { fontSize: 56 },
  emptyTitle:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  emptyDesc:     { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
});
