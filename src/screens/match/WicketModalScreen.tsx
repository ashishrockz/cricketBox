import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useScoring } from '../../hooks/useScoring';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { DismissalType } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'WicketModal'>;

type DismissalDef = { labelKey: string; value: DismissalType };

const DISMISSALS: DismissalDef[] = [
  { labelKey: 'wicket.dismissals.bowled',            value: 'bowled' },
  { labelKey: 'wicket.dismissals.caught',            value: 'caught' },
  { labelKey: 'wicket.dismissals.lbw',               value: 'lbw' },
  { labelKey: 'wicket.dismissals.runOut',            value: 'run_out' },
  { labelKey: 'wicket.dismissals.stumped',           value: 'stumped' },
  { labelKey: 'wicket.dismissals.hitWicket',         value: 'hit_wicket' },
  { labelKey: 'wicket.dismissals.caughtAndBowled',   value: 'caught_and_bowled' },
  { labelKey: 'wicket.dismissals.retiredHurt',       value: 'retired_hurt' },
  { labelKey: 'wicket.dismissals.obstructingField',  value: 'obstructing_the_field' },
];

// Dismissals that require a fielder selection
const FIELDER_DISMISSALS: DismissalType[] = ['caught', 'run_out', 'stumped'];

export default function WicketModalScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    matchId, strikerId, strikerName, nonStrikerId, nonStrikerName,
    bowlerId, bowlerName, fieldingTeamPlayers,
  } = route.params;
  const { recordBall, isLoading } = useScoring();

  const [dismissalType, setDismissalType] = useState<DismissalType>('bowled');
  const [dismissed,     setDismissed]     = useState<'striker' | 'nonStriker'>('striker');
  const [runs,          setRuns]          = useState(0);
  const [fielderId,     setFielderId]     = useState<string | null>(null);
  const [fielderName,   setFielderName]   = useState<string | null>(null);

  const needsFielder = FIELDER_DISMISSALS.includes(dismissalType);

  const handleSelectDismissal = (value: DismissalType) => {
    setDismissalType(value);
    // Reset fielder when switching to a non-fielder dismissal
    if (!FIELDER_DISMISSALS.includes(value)) {
      setFielderId(null);
      setFielderName(null);
    }
  };

  const handleConfirm = async () => {
    if (needsFielder && !fielderId) {
      Alert.alert(t('wicket.selectFielder'), t('wicket.selectFielderMsg'));
      return;
    }
    const dismissedId = dismissed === 'striker' ? strikerId : nonStrikerId;
    const res = await recordBall({
      matchId,
      outcome: 'wicket',
      runs,
      strikerId,
      nonStrikerId,
      bowlerId,
      isWicket: true,
      dismissalType,
      dismissedPlayerId: dismissedId,
      fielderId: fielderId ?? undefined,
    });
    if (res.success) {
      navigation.goBack();
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? 'Failed to record wicket');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <LoadingOverlay visible={isLoading} />

      {/* Handle bar */}
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={styles.title}>{t('wicket.title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Dismissed batsman */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('wicket.whoGotOut')}</Text>
          <View style={styles.batsmanRow}>
            <TouchableOpacity
              onPress={() => setDismissed('striker')}
              style={[styles.batsmanBtn, dismissed === 'striker' && styles.batsmanBtnActive]}
            >
              <Text style={[styles.batsmanBtnText, dismissed === 'striker' && styles.batsmanBtnTextActive]}>
                {strikerName}
              </Text>
              <Text style={styles.batsmanBtnSub}>{t('scoring.onStrike')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDismissed('nonStriker')}
              style={[styles.batsmanBtn, dismissed === 'nonStriker' && styles.batsmanBtnActive]}
            >
              <Text style={[styles.batsmanBtnText, dismissed === 'nonStriker' && styles.batsmanBtnTextActive]}>
                {nonStrikerName}
              </Text>
              <Text style={styles.batsmanBtnSub}>{t('scoring.nonStriker')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dismissal type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('wicket.howOut')}</Text>
          <View style={styles.dismissalGrid}>
            {DISMISSALS.map((d) => (
              <TouchableOpacity
                key={d.value}
                onPress={() => handleSelectDismissal(d.value)}
                style={[styles.dismissalBtn, dismissalType === d.value && styles.dismissalBtnActive]}
              >
                <Text style={[styles.dismissalText, dismissalType === d.value && styles.dismissalTextActive]}>
                  {t(d.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fielder selector — shown for caught / run-out / stumped */}
        {needsFielder && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {dismissalType === 'caught'  ? t('wicket.caughtBy') :
               dismissalType === 'stumped' ? t('wicket.stumpedBy') : t('wicket.runOutBy')}
            </Text>
            {/* Bowler shortcut (always available for caught/stumped) */}
            {dismissalType !== 'run_out' && (
              <TouchableOpacity
                onPress={() => { setFielderId(bowlerId); setFielderName(bowlerName); }}
                style={[
                  styles.fielderBtn,
                  fielderId === bowlerId && styles.fielderBtnActive,
                ]}
              >
                <Ionicons
                  name="radio-button-on-outline"
                  size={14}
                  color={fielderId === bowlerId ? Colors.white : Colors.accent}
                />
                <Text style={[styles.fielderBtnText, fielderId === bowlerId && styles.fielderBtnTextActive]}>
                  {bowlerName}
                </Text>
              </TouchableOpacity>
            )}
            {/* Remaining fielding team players */}
            {fieldingTeamPlayers
              .filter((p) => p.id !== bowlerId)
              .map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { setFielderId(p.id); setFielderName(p.name); }}
                  style={[
                    styles.fielderBtn,
                    fielderId === p.id && styles.fielderBtnActive,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={fielderId === p.id ? Colors.white : Colors.textMuted}
                  />
                  <Text style={[styles.fielderBtnText, fielderId === p.id && styles.fielderBtnTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            {fielderName && (
              <Text style={styles.fielderSelected}>
                {t('wicket.selected')}: <Text style={{ color: Colors.text, fontWeight: FontWeight.semibold }}>{fielderName}</Text>
              </Text>
            )}
          </View>
        )}

        {/* Runs on the ball */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('wicket.runsScored')}</Text>
          <View style={styles.runsRow}>
            {[0, 1, 2, 3].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRuns(r)}
                style={[styles.runBtn, runs === r && styles.runBtnActive]}
              >
                <Text style={[styles.runBtnText, runs === r && styles.runBtnTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleConfirm}
          style={[styles.confirmBtn, isLoading && { opacity: 0.6 }]}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <Ionicons name="skull-outline" size={18} color={Colors.white} />
          <Text style={styles.confirmBtnText}>{t('wicket.recordWicket')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title:              { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  content:            { padding: Spacing.xl, gap: Spacing.xl },
  section:            { gap: Spacing.md },
  sectionLabel:       { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  batsmanRow:         { flexDirection: 'row', gap: Spacing.md },
  batsmanBtn: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'center',
    gap: 4,
  },
  batsmanBtnActive:     { borderColor: Colors.error, backgroundColor: Colors.error + '22' },
  batsmanBtnText:       { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'center' },
  batsmanBtnTextActive: { color: Colors.error },
  batsmanBtnSub:        { fontSize: FontSize.xs, color: Colors.textMuted },
  dismissalGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dismissalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  dismissalBtnActive:   { borderColor: Colors.error, backgroundColor: Colors.error },
  dismissalText:        { fontSize: FontSize.sm, color: Colors.textSecondary },
  dismissalTextActive:  { color: Colors.white, fontWeight: FontWeight.semibold },
  fielderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  fielderBtnActive:     { borderColor: Colors.primary, backgroundColor: Colors.primary },
  fielderBtnText:       { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  fielderBtnTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },
  fielderSelected:      { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  runsRow:              { flexDirection: 'row', gap: 12 },
  runBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnActive:         { backgroundColor: Colors.primary, borderColor: Colors.primary },
  runBtnText:           { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  runBtnTextActive:     { color: Colors.white },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  confirmBtn: {
    backgroundColor: Colors.error,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
