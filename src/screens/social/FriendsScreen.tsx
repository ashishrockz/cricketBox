import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useFriends } from '../../hooks/useFriends';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { User, Friendship } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'Friends'>;
type FriendsTab = 'friends' | 'requests' | 'sent';

export default function FriendsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    friends, pendingRequests, sentRequests,
    fetchFriends, fetchPendingRequests, fetchSentRequests,
    acceptRequest, rejectRequest, removeFriend,
    isLoading,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  const handleRemove = (friendship: any) => {
    Alert.alert(t('friends.removeFriend'), t('friends.removeFriendConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('friends.remove'), style: 'destructive', onPress: () => removeFriend(friendship._id) },
    ]);
  };

  const TABS: { key: FriendsTab; label: string; count: number }[] = [
    { key: 'friends',  label: t('friends.friends'),  count: friends.length },
    { key: 'requests', label: t('friends.requests'), count: pendingRequests.length },
    { key: 'sent',     label: t('friends.sent'),     count: sentRequests.length },
  ];

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={t('friends.title')}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('UserSearch')}>
            <Ionicons name="search" size={22} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.count > 0 ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(u) => u._id}
          renderItem={({ item: u }) => (
            <TouchableOpacity
              style={styles.userCard}
              onLongPress={() => handleRemove({ _id: u._id })}
              activeOpacity={0.8}
            >
              <UserAvatar user={u} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.fullName ?? u.username}</Text>
                <Text style={styles.userMeta}>@{u.username}</Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchFriends} tintColor={Colors.accent} />}
          ListEmptyComponent={<EmptyState icon="people-outline" text={t('friends.noFriends')} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Requests List */}
      {activeTab === 'requests' && (
        <FlatList
          data={pendingRequests}
          keyExtractor={(r) => r._id}
          renderItem={({ item: r }) => {
            const requester = r.requester as User;
            return (
              <View style={styles.requestCard}>
                <UserAvatar user={requester} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{requester.fullName ?? requester.username}</Text>
                  <Text style={styles.userMeta}>@{requester.username}</Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    onPress={() => acceptRequest(r._id)}
                    style={styles.acceptBtn}
                  >
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => rejectRequest(r._id)}
                    style={styles.rejectBtn}
                  >
                    <Ionicons name="close" size={16} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPendingRequests} tintColor={Colors.accent} />}
          ListEmptyComponent={<EmptyState icon="mail-outline" text={t('friends.noRequests')} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sent List */}
      {activeTab === 'sent' && (
        <FlatList
          data={sentRequests}
          keyExtractor={(r) => r._id}
          renderItem={({ item: r }) => {
            const recipient = r.recipient as User;
            return (
              <View style={styles.userCard}>
                <UserAvatar user={recipient} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{recipient.fullName ?? recipient.username}</Text>
                  <Text style={styles.userMeta}>@{recipient.username}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: Colors.warning + '22' }]}>
                  <Text style={[styles.statusText, { color: Colors.warning }]}>{t('friends.pending')}</Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchSentRequests} tintColor={Colors.accent} />}
          ListEmptyComponent={<EmptyState icon="paper-plane-outline" text={t('friends.noSent')} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function UserAvatar({ user }: { user?: User }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {((user?.fullName ?? user?.username ?? 'U')[0]).toUpperCase()}
      </Text>
    </View>
  );
}

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon as any} size={40} color={Colors.textMuted} />
      <Text style={styles.emptyText}>{text}</Text>
      {sub && <Text style={styles.emptySub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.background },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive:      { borderBottomColor: Colors.primary },
  tabText:        { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive:  { color: Colors.primary, fontWeight: FontWeight.semibold },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  requestCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText:     { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  userInfo:       { flex: 1 },
  userName:       { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  userMeta:       { fontSize: FontSize.xs, color: Colors.textSecondary },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:     { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty:          { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:      { fontSize: FontSize.md, color: Colors.textSecondary },
  emptySub:       { fontSize: FontSize.sm, color: Colors.textMuted },
});
