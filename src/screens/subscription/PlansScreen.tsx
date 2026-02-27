import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useSubscription } from '../../hooks/useSubscription';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { SubscriptionPlan } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'Plans'>;

const PLAN_COLORS: Record<string, string> = {
  free: Colors.textMuted,
  basic: Colors.info,
  pro: Colors.accent,
  enterprise: Colors.success,
};

// Feature labels are resolved in the component using t()
const FEATURE_KEYS: { key: string; labelKey: string; format: (v: any) => string }[] = [
  { key: 'maxRooms',         labelKey: 'plans.matchesPerMonth', format: (v) => v === -1 ? 'Unlimited' : String(v) },
  { key: 'canUseTools',      labelKey: 'plans.cricketTools',    format: (v) => v ? '✓' : '✗' },
  { key: 'adsEnabled',       labelKey: 'plans.adsShown',        format: (v) => v ? 'Yes' : 'No' },
  { key: 'canManageAcademy', labelKey: 'plans.academy',         format: (v) => v ? '✓' : '✗' },
  { key: 'analyticsAccess',  labelKey: 'plans.analytics',       format: (v) => v ? '✓' : '✗' },
  { key: 'canUploadLogo',    labelKey: 'plans.uploadLogo',      format: (v) => v ? '✓' : '✗' },
];

export default function PlansScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { plans, subscription, fetchPlans, fetchMySubscription, isLoading } = useSubscription();

  useEffect(() => {
    fetchPlans();
    fetchMySubscription();
  }, []);

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t('plans.title')} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchPlans} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {subscription && (
          <View style={styles.currentPlanBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.currentPlanText}>
              {t('plans.currentPlanBanner', { plan: subscription.planSlug.toUpperCase() })}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('plans.title')}</Text>

        {plans.map((plan) => {
          const isActive = subscription?.planSlug === plan.slug;
          const color = PLAN_COLORS[plan.slug] ?? Colors.text;
          return (
            <PlanCard
              key={plan._id}
              plan={plan}
              isActive={isActive}
              color={color}
              onSelect={() => navigation.navigate('PlanDetail', { planId: plan._id })}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function PlanCard({ plan, isActive, color, onSelect }: {
  plan: SubscriptionPlan; isActive: boolean; color: string; onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.planCard, isActive && { borderColor: color }]}>
      <View style={styles.planHeader}>
        <View>
          <Text style={[styles.planName, { color }]}>{plan.name}</Text>
          <Text style={styles.planDesc}>{plan.description}</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>
            {plan.price.monthly === 0 ? t('plans.free') : `₹${plan.price.monthly}`}
          </Text>
          {plan.price.monthly > 0 && <Text style={styles.pricePer}>/mo</Text>}
        </View>
      </View>

      <View style={styles.featureList}>
        {FEATURE_KEYS.map((f) => {
          const val = (plan.features as any)[f.key];
          const formatted = f.format(val);
          return (
            <View key={f.key} style={styles.featureRow}>
              <Text style={styles.featureLabel}>{t(f.labelKey)}</Text>
              <Text style={[
                styles.featureVal,
                formatted === '✓' || (f.key === 'adsEnabled' && formatted === 'No') ? { color: Colors.success } :
                formatted === '✗' || (f.key === 'adsEnabled' && formatted === 'Yes') ? { color: Colors.textMuted } :
                { color: Colors.text },
              ]}>
                {formatted}
              </Text>
            </View>
          );
        })}
      </View>

      {isActive ? (
        <View style={[styles.selectBtn, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.selectBtnText, { color }]}>{t('plans.currentPlan')}</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={onSelect} style={[styles.selectBtn, { backgroundColor: color }]} activeOpacity={0.85}>
          <Text style={styles.selectBtnText}>
            {plan.price.monthly === 0 ? t('plans.freePlan') : t('plans.selectPlan', { plan: plan.name })}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:               { flex: 1, backgroundColor: Colors.background },
  container:          { padding: Spacing.lg, gap: Spacing.lg },
  currentPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '22',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  currentPlanText:    { fontSize: FontSize.sm, color: Colors.text },
  currentPlanSlug:    { fontWeight: FontWeight.bold, color: Colors.success },
  sectionTitle:       { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  planHeader:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  planName:           { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  planDesc:           { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  priceBlock:         { alignItems: 'flex-end' },
  price:              { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  pricePer:           { fontSize: FontSize.xs, color: Colors.textSecondary },
  featureList:        { gap: 8 },
  featureRow:         { flexDirection: 'row', alignItems: 'center' },
  featureLabel:       { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  featureVal:         { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  selectBtn: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectBtnText:      { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
