import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useEnterprise } from '../../hooks/useEnterprise';
import { useUser }       from '../../hooks/useUser';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader   from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { EnterpriseMember, EnterpriseRole, User } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'Members'>;

// 'owner' excluded — the API doesn't allow assigning owner role via updateMemberRole
type AssignableRole = Exclude<EnterpriseRole, 'owner'>;
const ASSIGNABLE_ROLES: AssignableRole[] = ['admin', 'coach', 'player', 'support_staff', 'viewer'];

export default function MembersScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { enterpriseId } = route.params;
  const { enterprise, fetchEnterprise, addMember, removeMember, updateMemberRole, isLoading } = useEnterprise();
  const { searchResults, searchUsers, isLoading: searching } = useUser();

  const [searchQuery, setSearchQuery]   = useState('');
  const [showSearch,  setShowSearch]    = useState(false);

  useEffect(() => { fetchEnterprise(enterpriseId); }, [enterpriseId]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length >= 2) await searchUsers({ q });
  };

  const handleAddMember = async (userId: string, role: EnterpriseRole = 'player') => {
    const res = await addMember(enterpriseId, { userId, role });
    if (res.success) {
      setShowSearch(false);
      setSearchQuery('');
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to add member');
    }
  };

  const handleRemoveMember = (userId: string) => {
    Alert.alert(t('members.removeMember'), t('members.removeMemberConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('members.remove'), style: 'destructive', onPress: async () => {
        const res = await removeMember(enterpriseId, userId);
        if (!res.success) Alert.alert(t('common.error'), (res as any).error?.message);
      }},
    ]);
  };

  const handleRoleChange = (userId: string, newRole: AssignableRole) => {
    Alert.alert(t('members.changeRole'), t('members.changeRoleConfirm', { role: newRole }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('members.update'), onPress: async () => {
        const res = await updateMemberRole(enterpriseId, userId, newRole);
        if (!res.success) Alert.alert(t('common.error'), (res as any).error?.message);
      }},
    ]);
  };

  const members = enterprise?.members ?? [];

  const renderMember = ({ item }: { item: EnterpriseMember }) => {
    const user = item.user as User;
    const userId = typeof item.user === 'string' ? item.user : (item.user as User)._id;

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {(user.fullName ?? user.username ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{user.fullName ?? user.username ?? userId}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{item.role}</Text>
          </View>
        </View>
        <View style={styles.memberActions}>
          {item.role !== 'owner' && (
            <TouchableOpacity
              onPress={() => {
                const currentIdx = ASSIGNABLE_ROLES.indexOf(item.role as AssignableRole);
                const nextRole = ASSIGNABLE_ROLES[(currentIdx + 1) % ASSIGNABLE_ROLES.length];
                handleRoleChange(userId, nextRole);
              }}
              style={styles.iconBtn}
            >
              <Ionicons name="create-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          {item.role !== 'owner' && (
            <TouchableOpacity onPress={() => handleRemoveMember(userId)} style={styles.iconBtn}>
              <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.flex}>
      <LoadingOverlay visible={isLoading && !enterprise} />
      <ScreenHeader
        title={t('members.title', { count: members.length })}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => setShowSearch((v) => !v)}>
            <Ionicons name="person-add-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Search User to Add */}
      {showSearch && (
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder={t('members.searchPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
          {searchResults.map((u) => (
            <TouchableOpacity
              key={u._id}
              onPress={() => handleAddMember(u._id)}
              style={styles.searchResult}
            >
              <Text style={styles.searchResultName}>{u.fullName ?? u.username}</Text>
              <Text style={styles.searchResultMeta}>@{u.username}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={members}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMember}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchEnterprise(enterpriseId)} tintColor={Colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('members.noMembers')}</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex:               { flex: 1, backgroundColor: Colors.background },
  searchSection: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: 4,
  },
  searchInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: 4,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  searchResultName:   { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  searchResultMeta:   { fontSize: FontSize.xs, color: Colors.textSecondary },
  memberCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  memberInfo:         { flex: 1, gap: 4 },
  memberName:         { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rolePillText:       { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.medium, textTransform: 'capitalize' },
  memberActions:      { flexDirection: 'row', gap: 4 },
  iconBtn:            { padding: 6 },
  empty:              { alignItems: 'center', paddingTop: 60 },
  emptyText:          { color: Colors.textSecondary },
});
