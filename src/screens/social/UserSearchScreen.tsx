import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useUser }    from '../../hooks/useUser';
import { useFriends } from '../../hooks/useFriends';
import ScreenHeader   from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { User } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'UserSearch'>;

export default function UserSearchScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { searchResults, searchUsers, isLoading } = useUser();
  const { sendRequest }                           = useFriends();

  const [query,   setQuery]   = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length >= 2) await searchUsers({ q: q.trim() });
  };

  const handleSendRequest = async (userId: string) => {
    const res = await sendRequest(userId);
    if (res.success) {
      setSentIds((prev) => new Set([...prev, userId]));
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to send request');
    }
  };

  const renderUser = ({ item: u }: { item: User }) => {
    const sent = sentIds.has(u._id);
    return (
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(u.fullName ?? u.username ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{u.fullName ?? u.username}</Text>
          <Text style={styles.userMeta}>
            @{u.username} · {u.subscriptionPlan?.toUpperCase() ?? 'FREE'}
          </Text>
        </View>
        {sent ? (
          <View style={styles.sentBadge}>
            <Ionicons name="checkmark" size={12} color={Colors.success} />
            <Text style={styles.sentText}>{t('userSearch.sent')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => handleSendRequest(u._id)}
            style={styles.addBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={14} color={Colors.primary} />
            <Text style={styles.addBtnText}>{t('userSearch.add')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t('userSearch.title')} onBack={() => navigation.goBack()} />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleSearch}
          placeholder={t('userSearch.placeholder')}
          placeholderTextColor={Colors.textMuted}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(u) => u._id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          query.length >= 2 && !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('userSearch.noResults', { query })}</Text>
            </View>
          ) : query.length < 2 ? (
            <View style={styles.hint}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.hintText}>{t('userSearch.typeMore')}</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  searchInput:  { flex: 1, fontSize: FontSize.md, color: Colors.text },
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  userInfo:     { flex: 1 },
  userName:     { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  userMeta:     { fontSize: FontSize.xs, color: Colors.textSecondary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText:   { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  sentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.success + '22',
  },
  sentText:     { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold },
  empty:        { alignItems: 'center', paddingTop: 40 },
  emptyText:    { color: Colors.textSecondary, fontSize: FontSize.md },
  hint:         { alignItems: 'center', paddingTop: 60, gap: 12 },
  hintText:     { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
});
