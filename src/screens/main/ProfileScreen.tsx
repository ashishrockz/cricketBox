import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert,
  Modal, FlatList, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, TabParamList } from '../../navigation/types';
import { useAuthContext }  from '../../context/AuthContext';
import { useUser }         from '../../hooks/useUser';
import { useSubscription } from '../../hooks/useSubscription';
import AdBanner from '../../components/AdBanner';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage } from '../../i18n';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<MainStackParamList>
>;

const PLAN_COLORS: Record<string, string> = {
  free: Colors.textMuted,
  basic: Colors.info,
  pro: Colors.accent,
  enterprise: Colors.success,
};

export default function ProfileScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthContext();
  const { stats, fetchStats }       = useUser();
  const { fetchMySubscription }     = useSubscription();
  const [langModal, setLangModal]   = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchStats(user._id);
      fetchMySubscription();
    }
  }, [user?._id]);

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const planSlug = user?.subscriptionPlan ?? 'free';
  const planColor = PLAN_COLORS[planSlug];

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const menuItems = [
    { icon: 'create-outline',       label: t('profile.editProfile'),    onPress: () => navigation.navigate('EditProfile') },
    { icon: 'card-outline',         label: t('profile.mySubscription'), onPress: () => navigation.navigate('Plans') },
    { icon: 'business-outline',     label: t('profile.myAcademy'),      onPress: () => navigation.navigate('Enterprise') },
    { icon: 'people-outline',       label: t('profile.friends'),        onPress: () => navigation.navigate('Friends') },
    { icon: 'lock-closed-outline',  label: t('profile.changePassword'), onPress: () => navigation.navigate('ChangePassword') },
    { icon: 'language-outline',     label: t('profile.language'),       onPress: () => setLangModal(true), badge: currentLang.nativeLabel },
  ];

  return (
    <>
    <Modal visible={langModal} transparent animationType="fade" onRequestClose={() => setLangModal(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setLangModal(false)}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.langRow, item.code === i18n.language && styles.langRowActive]}
                onPress={() => { changeLanguage(item.code); setLangModal(false); }}
                activeOpacity={0.7}
              >
                <Text style={styles.langNative}>{item.nativeLabel}</Text>
                <Text style={styles.langLabel}>{item.label}</Text>
                {item.code === i18n.language && (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} style={styles.langCheck} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Pressable>
    </Modal>

    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatarWrap}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {(user?.fullName ?? user?.username ?? 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.fullName ?? user?.username}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <View style={[styles.planPill, { backgroundColor: planColor + '22' }]}>
          <Text style={[styles.planText, { color: planColor }]}>
            {planSlug.toUpperCase()} {t('profile.plan')}
          </Text>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <StatBox label={t('profile.stats.matches')} value={stats.batting.matches} />
          <StatBox label={t('profile.stats.runs')}    value={stats.batting.runs} />
          <StatBox label={t('profile.stats.hs')}      value={stats.batting.highScore} />
          <StatBox label={t('profile.stats.wickets')} value={stats.bowling.wickets} />
        </View>
      )}

      <AdBanner placement="profile_banner" />

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} onPress={item.onPress} style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.badge && <Text style={styles.menuBadge}>{item.badge}</Text>}
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={handleLogout} style={[styles.menuItem, styles.logoutItem]} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: Colors.error + '22' }]}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          </View>
          <Text style={[styles.menuLabel, { color: Colors.error }]}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:             { flex: 1, backgroundColor: Colors.background },
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 8,
  },
  avatarWrap:       {},
  avatar:           { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder:{ backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:     { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.white },
  name:             { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  username:         { fontSize: FontSize.sm, color: Colors.textSecondary },
  planPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  planText:         { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRightWidth: 1,
    borderRightColor: Colors.cardBorder,
  },
  statValue:        { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.accent },
  statLabel:        { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  menu: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel:        { flex: 1, fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  logoutItem:       { borderBottomWidth: 0 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  langRowActive: { backgroundColor: Colors.primary + '11' },
  langNative:   { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  langLabel:    { fontSize: FontSize.sm, color: Colors.textSecondary },
  langCheck:    { marginLeft: Spacing.sm },
  menuBadge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
});
