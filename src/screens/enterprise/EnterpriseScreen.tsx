import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useEnterprise } from '../../hooks/useEnterprise';
import { useAuthContext } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'Enterprise'>;

export default function EnterpriseScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { enterprise, fetchMyEnterprise, isLoading } = useEnterprise();
  const { user } = useAuthContext();

  useEffect(() => { fetchMyEnterprise(); }, []);

  const canCreate = user?.subscriptionPlan === 'enterprise';

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t('enterprise.title')} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMyEnterprise} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {enterprise ? (
          <>
            {/* Academy Header */}
            <View style={styles.academyCard}>
              <View style={styles.academyLogo}>
                <Text style={styles.academyLogoText}>
                  {enterprise.name[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.academyInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.academyName}>{enterprise.name}</Text>
                  {enterprise.isVerified && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.info} />
                  )}
                </View>
                <Text style={styles.academyType}>{enterprise.type.replace(/_/g, ' ')}</Text>
                <Text style={styles.memberCount}>{enterprise.members.length} {t('enterprise.members')}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatBox label={t('enterprise.members')} value={enterprise.members.length} />
              <StatBox label={t('enterprise.status')}  value={enterprise.isSuspended ? t('enterprise.suspended') : t('enterprise.active')} />
              <StatBox label={t('enterprise.public')}  value={enterprise.settings.isPublic ? t('enterprise.yes') : t('enterprise.noLabel')} />
            </View>

            {/* Actions */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Members', { enterpriseId: enterprise._id })}
              style={styles.actionBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionBtnText}>{t('enterprise.manageMembers')}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Contact Info */}
            {enterprise.contact && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>{t('createEnterprise.contact')}</Text>
                {enterprise.contact.email && <InfoRow label={t('createEnterprise.email')} value={enterprise.contact.email} />}
                {enterprise.contact.phone && <InfoRow label={t('createEnterprise.phone')} value={enterprise.contact.phone} />}
                {enterprise.contact.website && <InfoRow label={t('createEnterprise.website')} value={enterprise.contact.website} />}
              </View>
            )}
          </>
        ) : !isLoading ? (
          /* No Enterprise */
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏫</Text>
            <Text style={styles.emptyTitle}>{t('enterprise.noAcademy')}</Text>
            <Text style={styles.emptyDesc}>{t('enterprise.noAcademyDesc')}</Text>
            {canCreate ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateEnterprise')}
                style={styles.createBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.createBtnText}>{t('enterprise.createAcademy')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.upgradeNote}>{t('enterprise.upgradePlan')}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Plans')}
                  style={styles.upgradeBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.upgradeBtnText}>{t('enterprise.upgradePlan')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: Colors.background },
  container:    { padding: Spacing.lg, gap: Spacing.lg },
  academyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  academyLogo: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  academyLogoText:  { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.white },
  academyInfo:      { flex: 1, gap: 4 },
  nameRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  academyName:      { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  academyType:      { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  memberCount:      { fontSize: FontSize.xs, color: Colors.textMuted },
  statsRow: {
    flexDirection: 'row',
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
  actionBtn: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionBtnText:    { flex: 1, fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  infoCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoLabel:        { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue:        { fontSize: FontSize.sm, color: Colors.text },
  emptyState:       { alignItems: 'center', paddingTop: 40, gap: 12, paddingHorizontal: 20 },
  emptyEmoji:       { fontSize: 60 },
  emptyTitle:       { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  emptyDesc:        { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  createBtnText:    { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  upgradeNote:      { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8 },
  upgradeBtn: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  upgradeBtnText:   { color: Colors.accent, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
