import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useMatch } from '../../hooks/useMatch';
import AdBanner from '../../components/AdBanner';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'MatchResult'>;

// ─── Confetti piece ────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#F5A623', '#006B3C', '#58A6FF', '#F85149', '#3FB950', '#FFFFFF'];

function ConfettiPiece({
  startX, startDelay, color, rotation,
}: {
  startX: number;
  startDelay: number;
  color: string;
  rotation: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000 + Math.random() * 800,
      delay: startDelay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 900] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
  const rotate     = anim.interpolate({ inputRange: [0, 1], outputRange: [`${rotation}deg`, `${rotation + 360}deg`] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: 8,
        height: 12,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ translateY }, { rotate }],
        opacity,
      }}
    />
  );
}

// Generate 30 confetti pieces with pseudo-random positions
const CONFETTI_PIECES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  startX: (i * 37 + 11) % 360,
  startDelay: (i * 67) % 600,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotation: (i * 53) % 180,
}));

// ─────────────────────────────────────────────────────────────────────────────

export default function MatchResultScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { matchId } = route.params;
  const { match, fetchMatch } = useMatch();

  useEffect(() => { fetchMatch(matchId); }, [matchId]);

  const result  = match?.result;
  const innings1 = match?.innings[0];
  const innings2 = match?.innings[1];

  const handleShare = async () => {
    if (!match || !result) return;
    const text = result.isDraw
      ? t('matchResult.drawn') + ` — ${match.teamA.name} vs ${match.teamB.name}`
      : t('matchResult.wonBy', { winner: result.winnerName, margin: result.winBy ?? '' }) +
        `\n${match.teamA.name} vs ${match.teamB.name}`;
    await Share.share({ message: text });
  };

  return (
    <View style={styles.flex}>
      {/* Confetti layer — sits above banner, behind content */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {CONFETTI_PIECES.map((p) => (
          <ConfettiPiece key={p.id} {...p} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy Banner */}
        <View style={[styles.banner, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.bannerEmoji}>🏆</Text>
          {result && (
            <>
              <Text style={styles.winnerText}>
                {result.isDraw
                  ? t('matchResult.drawn')
                  : result.isTie
                  ? t('matchResult.tied')
                  : result.winnerName}
              </Text>
              {result.winBy && !result.isDraw && !result.isTie && (
                <Text style={styles.winMargin}>
                  {t('matchResult.wonBy', { winner: result.winnerName, margin: result.winBy })}
                </Text>
              )}
            </>
          )}
        </View>

        <AdBanner placement="post_match_popup" />

        {/* Scorecard */}
        {innings1 && match && (
          <ScorecardCard
            innings={innings1}
            teamAName={match.teamA.name}
            teamBName={match.teamB.name}
            label={t('matchResult.inningsLabel', { n: 1 })}
          />
        )}
        {innings2 && match && (
          <ScorecardCard
            innings={innings2}
            teamAName={match.teamA.name}
            teamBName={match.teamB.name}
            label={t('matchResult.inningsLabel', { n: 2 })}
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MatchDetail', { matchId })}
            style={styles.secondaryBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>{t('matchResult.fullScorecard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.85}>
            <Text style={styles.shareBtnText}>{t('matchResult.shareResult')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Tabs', { screen: 'Home' } as any)}
            style={styles.homeBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.homeBtnText}>{t('matchResult.backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ScorecardCard({ innings, teamAName, teamBName, label }: any) {
  const { t } = useTranslation();
  const battingName = innings.battingTeam === 'team_a' ? teamAName : teamBName;
  return (
    <View style={styles.scorecardCard}>
      <Text style={styles.scorecardLabel}>{label} — {battingName}</Text>
      <Text style={styles.scorecardScore}>
        {innings.totalRuns}/{innings.totalWickets}
        <Text style={styles.scorecardOvers}> ({innings.totalOvers} ov)</Text>
      </Text>

      {/* Top batsmen */}
      <View style={styles.statsGrid}>
        {innings.battingStats.slice(0, 5).map((b: any) => (
          <View key={b.playerId} style={styles.statsRow}>
            <Text style={styles.statsName} numberOfLines={1}>{b.playerName}</Text>
            <Text style={styles.statsStat}>{b.runs}({b.balls})</Text>
            {b.isOut && <Text style={styles.outText}>†</Text>}
          </View>
        ))}
      </View>

      {/* Top bowlers */}
      <Text style={styles.bowlingTitle}>{t('scoring.bowlingTab')}</Text>
      <View style={styles.statsGrid}>
        {innings.bowlingStats.slice(0, 3).map((b: any) => (
          <View key={b.playerId} style={styles.statsRow}>
            <Text style={styles.statsName} numberOfLines={1}>{b.playerName}</Text>
            <Text style={styles.statsStat}>{b.wickets}/{b.runs} ({b.overs}ov)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:             { flex: 1, backgroundColor: Colors.background },
  banner: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: 12,
  },
  bannerEmoji:      { fontSize: 64 },
  winnerText:       { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white, textAlign: 'center' },
  winMargin:        { fontSize: FontSize.md, color: Colors.white + 'BB', textAlign: 'center' },
  scorecardCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  scorecardLabel:   { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  scorecardScore:   { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  scorecardOvers:   { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.regular },
  statsGrid:        { gap: 4 },
  statsRow:         { flexDirection: 'row', alignItems: 'center' },
  statsName:        { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  statsStat:        { fontSize: FontSize.sm, color: Colors.textSecondary, marginRight: 6 },
  outText:          { fontSize: FontSize.xs, color: Colors.error },
  bowlingTitle:     { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, marginTop: 4 },
  actions: {
    margin: Spacing.lg,
    gap: Spacing.md,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.primaryLight, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  shareBtn: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnText:     { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  homeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText:      { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
});
