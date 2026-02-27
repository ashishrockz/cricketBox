import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useMatch }   from '../../hooks/useMatch';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader   from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { PlayerTeam, TossDecision } from '../../types';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'Toss'>;

export default function TossScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { matchId, roomId, teamAName, teamBName } = route.params;
  const { recordToss, isLoading } = useMatch();

  const [winner,      setWinner]      = useState<PlayerTeam | null>(null);
  const [decision,    setDecision]    = useState<TossDecision | null>(null);
  const [isFlipping,  setIsFlipping]  = useState(false);

  // Coin flip animation
  const coinAnim  = useRef(new Animated.Value(1)).current;
  const coinScale = useRef(new Animated.Value(1)).current;

  // Auto-flip once on mount to draw attention
  useEffect(() => {
    flipCoin();
  }, []);

  const flipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    // Scale up slightly then run the flip (scaleX oscillation)
    Animated.sequence([
      Animated.timing(coinScale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(coinAnim, { toValue: 0.05, duration: 160, useNativeDriver: true }),
          Animated.timing(coinAnim, { toValue: 1,    duration: 160, useNativeDriver: true }),
        ]),
        { iterations: 5 },
      ),
    ]).start(() => {
      Animated.timing(coinScale, { toValue: 1, duration: 120, useNativeDriver: true }).start(() =>
        setIsFlipping(false),
      );
    });
  };

  const handleConfirm = async () => {
    if (!winner || !decision) {
      Alert.alert(t('common.error'), t('toss.errorSelectWinner'));
      return;
    }
    const res = await recordToss(matchId, { wonBy: winner, decision });
    if (res.success) {
      navigation.replace('Scoring', { matchId, roomId });
    } else {
      Alert.alert(t('common.error'), (res as any).error?.message ?? t('toss.errorRecordFailed'));
    }
  };

  return (
    <View style={styles.flex}>
      <LoadingOverlay visible={isLoading} message={t('toss.recording')} />
      <ScreenHeader title={t('toss.title')} onBack={() => navigation.goBack()} />

      <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
        {/* Animated coin */}
        <View style={styles.coinSection}>
          <TouchableOpacity onPress={flipCoin} activeOpacity={0.8} disabled={isFlipping}>
            <Animated.View
              style={[
                styles.coin,
                { transform: [{ scaleX: coinAnim }, { scale: coinScale }] },
              ]}
            >
              <Text style={styles.coinEmoji}>🪙</Text>
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.coinTitle}>{t('toss.whoWon')}</Text>
          <Text style={styles.coinHint}>{t('toss.tapCoin')}</Text>
        </View>

        {/* Team Winner Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('toss.tossWinner')}</Text>
          <View style={styles.teamRow}>
            <TeamButton
              label={teamAName}
              active={winner === 'team_a'}
              onPress={() => setWinner('team_a')}
              color={Colors.info}
            />
            <TeamButton
              label={teamBName}
              active={winner === 'team_b'}
              onPress={() => setWinner('team_b')}
              color={Colors.accent}
            />
          </View>
        </View>

        {/* Decision */}
        {winner && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('toss.chose', { team: winner === 'team_a' ? teamAName : teamBName })}
            </Text>
            <View style={styles.decisionRow}>
              <DecisionButton
                label={t('toss.bat')}
                emoji="🏏"
                active={decision === 'bat'}
                onPress={() => setDecision('bat')}
              />
              <DecisionButton
                label={t('toss.bowl')}
                emoji="🎳"
                active={decision === 'bowl'}
                onPress={() => setDecision('bowl')}
              />
            </View>
          </View>
        )}

        {/* Summary */}
        {winner && decision && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {t('toss.summary', {
                team: winner === 'team_a' ? teamAName : teamBName,
                decision,
              })}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={handleConfirm}
          style={[styles.primaryBtn, (!winner || !decision) && styles.primaryBtnDisabled]}
          disabled={!winner || !decision}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t('toss.startMatch')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TeamButton({ label, active, onPress, color }: {
  label: string; active: boolean; onPress: () => void; color: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.teamBtn, active && { borderColor: color, backgroundColor: color + '22' }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.teamBtnText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DecisionButton({ label, emoji, active, onPress }: {
  label: string; emoji: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.decisionBtn, active && styles.decisionBtnActive]}
      activeOpacity={0.8}
    >
      <Text style={styles.decisionEmoji}>{emoji}</Text>
      <Text style={[styles.decisionLabel, active && styles.decisionLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex:               { flex: 1, backgroundColor: Colors.background },
  container:          { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  coinSection:        { alignItems: 'center', paddingVertical: 20, gap: 10 },
  coin: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinEmoji:           { fontSize: 52 },
  coinTitle:           { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  coinHint:            { fontSize: FontSize.xs, color: Colors.textMuted },
  section:             { gap: Spacing.md },
  sectionLabel:        { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  teamRow:             { flexDirection: 'row', gap: Spacing.md },
  teamBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  teamBtnText:         { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  decisionRow:         { flexDirection: 'row', gap: Spacing.md },
  decisionBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'center',
    gap: 8,
  },
  decisionBtnActive:   { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  decisionEmoji:       { fontSize: 36 },
  decisionLabel:       { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  decisionLabelActive: { color: Colors.primaryLight },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  summaryText:         { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  summaryBold:         { color: Colors.text, fontWeight: FontWeight.bold },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnDisabled:  { opacity: 0.4 },
  primaryBtnText:      { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
