import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useSubscription } from '../../hooks/useSubscription';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'PlanDetail'>;

export default function PlanDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { planId } = route.params;
  const { plans } = useSubscription();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const plan = plans.find((p) => p._id === planId);

  if (!plan) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Plan Detail" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Plan not found</Text>
        </View>
      </View>
    );
  }

  const price = billing === 'monthly' ? plan.price.monthly : plan.price.annual;
  const annualSaving = plan.price.monthly > 0
    ? Math.round(((plan.price.monthly * 12 - plan.price.annual) / (plan.price.monthly * 12)) * 100)
    : 0;

  const handleSubscribe = () => {
    if (plan.price.monthly === 0) {
      Alert.alert(t('planDetail.currentFreePlan'), 'You are already on the free plan!');
      return;
    }
    // In a real app, this would launch Razorpay/Stripe payment
    Alert.alert(
      t('planDetail.subscribeTo', { plan: plan.name }),
      `Subscribe to ${plan.name} for ₹${price}/${billing === 'monthly' ? 'month' : 'year'}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('planDetail.subscribeTo', { plan: plan.name }), onPress: () => {
          Alert.alert('Coming Soon', 'Payment gateway integration coming soon!');
        }},
      ],
    );
  };

  const features = [
    { icon: 'baseball-outline',   label: `${plan.features.maxRooms === -1 ? 'Unlimited' : plan.features.maxRooms} matches/month` },
    { icon: 'calculator-outline', label: `Cricket Tools: ${plan.features.canUseTools ? 'Included' : 'Not included'}` },
    { icon: 'megaphone-outline',  label: `Ads: ${plan.features.adsEnabled ? 'Shown' : 'Ad-free experience'}` },
    { icon: 'business-outline',   label: `Academy: ${plan.features.canManageAcademy ? 'Included' : 'Not included'}` },
    { icon: 'analytics-outline',  label: `Analytics: ${plan.features.analyticsAccess ? 'Included' : 'Not included'}` },
    { icon: 'image-outline',      label: `Logo upload: ${plan.features.canUploadLogo ? 'Yes' : 'No'}` },
    { icon: 'headset-outline',    label: `Priority support: ${plan.features.prioritySupport ? 'Yes' : 'No'}` },
  ];

  return (
    <View style={styles.flex}>
      <ScreenHeader title={plan.name} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Price Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroPrice}>
            {price === 0 ? t('plans.free') : `₹${price}`}
          </Text>
          {price > 0 && (
            <Text style={styles.heroPer}>
              /{billing === 'monthly' ? t('planDetail.monthly') : t('planDetail.annual', { percent: annualSaving })}
            </Text>
          )}
          <Text style={styles.heroDesc}>{plan.description}</Text>
        </View>

        {/* Billing Toggle */}
        {plan.price.monthly > 0 && (
          <View style={styles.billingToggle}>
            <TouchableOpacity
              onPress={() => setBilling('monthly')}
              style={[styles.billingBtn, billing === 'monthly' && styles.billingBtnActive]}
            >
              <Text style={[styles.billingBtnText, billing === 'monthly' && styles.billingBtnTextActive]}>
                {t('planDetail.monthly')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBilling('annual')}
              style={[styles.billingBtn, billing === 'annual' && styles.billingBtnActive]}
            >
              <Text style={[styles.billingBtnText, billing === 'annual' && styles.billingBtnTextActive]}>
                {t('planDetail.annual', { percent: annualSaving })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What's included</Text>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Subscribe Button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSubscribe} style={styles.subscribeBtn} activeOpacity={0.85}>
            <Text style={styles.subscribeBtnText}>
              {plan.price.monthly === 0 ? t('planDetail.currentFreePlan') : t('planDetail.subscribeTo', { plan: plan.name })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:               { flex: 1, backgroundColor: Colors.background },
  empty:              { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:          { color: Colors.textSecondary },
  hero: {
    backgroundColor: Colors.primary,
    paddingVertical: 36,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  heroPrice:          { fontSize: 48, fontWeight: FontWeight.extrabold, color: Colors.white },
  heroPer:            { fontSize: FontSize.lg, color: Colors.white + 'BB' },
  heroDesc:           { fontSize: FontSize.md, color: Colors.white + 'CC', textAlign: 'center' },
  billingToggle: {
    flexDirection: 'row',
    margin: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  billingBtn:         { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center' },
  billingBtnActive:   { backgroundColor: Colors.primary },
  billingBtnText:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  billingBtnTextActive:{ color: Colors.white, fontWeight: FontWeight.semibold },
  featuresCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  featuresTitle:      { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  featureRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel:       { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  footer:             { margin: Spacing.lg },
  subscribeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeBtnText:   { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
