import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useMatch } from '../../hooks/useMatch';
import { useMatchSocket } from '../../hooks/useSocket';
import { getTokens } from '../../api/apiClient';
import socketService from '../../api/socketService';
import AdBanner from '../../components/AdBanner';
import ScreenHeader from '../../components/ScreenHeader';
import InningsCard from '../../components/InningsCard';
import ScorecardTable from '../../components/ScorecardTable';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { MatchReactionPayload, RoomUserPayload } from '../../api/socketService';
import type { PlayerTeam } from '../../types';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'LiveViewer'>;

const REACTIONS: { emoji: string; type: MatchReactionPayload['reaction'] }[] = [
  { emoji: '6️⃣', type: 'six' },
  { emoji: '4️⃣', type: 'four' },
  { emoji: '🎳', type: 'wicket' },
  { emoji: '😱', type: 'appeal' },
  { emoji: '👏', type: 'cheer' },
  { emoji: '🙌', type: 'clap' },
];

// ─── Floating emoji that animates upward when a reaction fires ────────────────
function FloatingEmoji({ emoji, onDone }: { emoji: string; onDone: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => onDone());
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -120] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.Text
      style={[styles.floatingEmoji, { transform: [{ translateY }], opacity }]}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LiveViewerScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { matchId } = route.params;

  const { liveScore, startPolling, stopPolling, fetchLiveScore } = useMatch({
    autoPollingMs: 20000,
  });

  const [socketToken,    setSocketToken]    = useState<string | undefined>();
  const [spectatorCount, setSpectatorCount] = useState(1);
  const [floatingItems,  setFloatingItems]  = useState<{ id: number; emoji: string }[]>([]);
  const floatingIdRef = useRef(0);

  useEffect(() => {
    getTokens().then(({ accessToken }) => {
      if (accessToken) setSocketToken(accessToken);
    });
  }, []);

  const refresh = useCallback(() => {
    fetchLiveScore(matchId);
  }, [fetchLiveScore, matchId]);

  // Spectator presence handlers
  const onRoomUserJoined = useCallback((_payload: RoomUserPayload) => {
    setSpectatorCount((c) => c + 1);
  }, []);

  const onRoomUserLeft = useCallback((_payload: RoomUserPayload) => {
    setSpectatorCount((c) => Math.max(1, c - 1));
  }, []);

  const { isConnected } = useMatchSocket({
    token:             socketToken,
    matchId,
    onBallUpdate:      refresh,
    onWicketFallen:    refresh,
    onOverComplete:    refresh,
    onInningsComplete: refresh,
    onMatchComplete:   refresh,
    onRoomUserJoined,
    onRoomUserLeft,
  });

  useEffect(() => {
    if (isConnected) {
      stopPolling();
    } else {
      startPolling(matchId);
    }
    return () => stopPolling();
  }, [isConnected, matchId]);

  const sendReaction = useCallback((type: MatchReactionPayload['reaction']) => {
    socketService.sendReaction(matchId, type);
    // Show floating emoji
    const id = ++floatingIdRef.current;
    const emoji = REACTIONS.find((r) => r.type === type)?.emoji ?? '👏';
    setFloatingItems((prev) => [...prev, { id, emoji }]);
  }, [matchId]);

  const removeFloating = useCallback((id: number) => {
    setFloatingItems((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isCompleted = liveScore?.status === 'completed';
  const hasResult =
    isCompleted &&
    liveScore?.result &&
    (liveScore.result.winner !== null || liveScore.result.summary !== null);

  const teamName = (team: PlayerTeam | null) => {
    if (!team || !liveScore) return '';
    return team === 'team_a' ? liveScore.teamA.name : liveScore.teamB.name;
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={t('liveViewer.title')}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.headerRight}>
            {!isCompleted && (
              <View style={styles.liveBadge}>
                <View style={[styles.liveDot, isConnected && styles.liveDotConnected]} />
                <Text style={styles.liveText}>{t('liveViewer.live')}</Text>
              </View>
            )}
            {spectatorCount > 1 && (
              <View style={styles.spectatorBadge}>
                <Text style={styles.spectatorText}>👁 {spectatorCount}</Text>
              </View>
            )}
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => fetchLiveScore(matchId)}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <AdBanner placement="live_score_banner" />

        {liveScore ? (
          <>
            {/* Teams header */}
            <View style={styles.teamsHeader}>
              <Text style={styles.teamName}>{liveScore.teamA.name}</Text>
              <Text style={styles.vsText}>vs</Text>
              <Text style={styles.teamName}>{liveScore.teamB.name}</Text>
            </View>

            {/* Match meta */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{liveScore.format}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{liveScore.totalOvers} overs</Text>
              {liveScore.toss && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>
                    {teamName(liveScore.toss.wonBy)} won toss,{' '}
                    {liveScore.toss.decision === 'bat' ? 'batting' : 'bowling'}
                  </Text>
                </>
              )}
            </View>

            {/* Innings cards */}
            {(liveScore.allInnings ?? [liveScore.currentInnings]).map((innings) => (
              <InningsCard
                key={innings.inningsNumber}
                innings={innings}
                teamAName={liveScore.teamA.name}
                teamBName={liveScore.teamB.name}
                label={`${innings.inningsNumber === 1 ? '1st' : '2nd'} Innings`}
                isActive={
                  !isCompleted &&
                  innings.inningsNumber === liveScore.currentInnings.inningsNumber
                }
              />
            ))}

            {/* Result */}
            {hasResult && (
              <View style={styles.resultCard}>
                <Text style={styles.resultEmoji}>🏆</Text>
                <Text style={styles.resultText}>
                  {liveScore.result.summary ??
                    (liveScore.result.winner
                      ? `${teamName(liveScore.result.winner)} won${liveScore.result.winMargin ? ` by ${liveScore.result.winMargin}` : ''}`
                      : t('liveViewer.matchComplete'))}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.replace('MatchResult', { matchId })}
                  style={styles.scorecardBtn}
                >
                  <Text style={styles.scorecardBtnText}>{t('liveViewer.viewScorecard')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Current innings batting */}
            {liveScore.currentInnings.battingStats.length > 0 && (
              <ScorecardTable
                title={`${t('scoring.batting')} — ${teamName(liveScore.currentInnings.battingTeam)}`}
                headers={[t('scoring.batting'), 'R', 'B', '4s', '6s', 'SR']}
                rows={liveScore.currentInnings.battingStats.map((b) => {
                  const ballsFaced = b.balls ?? b.ballsFaced ?? 0;
                  const sr         = b.strikeRate ?? b.sr;
                  return [
                    b.playerName,
                    String(b.runs ?? 0),
                    String(ballsFaced),
                    String(b.fours ?? 0),
                    String(b.sixes ?? 0),
                    typeof sr === 'number' ? sr.toFixed(1) : '0.0',
                  ];
                })}
              />
            )}

            {/* Current innings bowling */}
            {liveScore.currentInnings.bowlingStats.length > 0 && (
              <ScorecardTable
                title={`${t('scoring.bowlingTab')} — ${teamName(liveScore.currentInnings.bowlingTeam)}`}
                headers={[t('scoring.bowlingTab'), 'O', 'M', 'R', 'W', 'Econ']}
                rows={liveScore.currentInnings.bowlingStats.map((b) => {
                  const runs = b.runs ?? b.runsConceded ?? 0;
                  const econ = b.economy ?? b.economyRate;
                  return [
                    b.playerName,
                    String(b.overs),
                    String(b.maidens ?? 0),
                    String(runs),
                    String(b.wickets ?? 0),
                    typeof econ === 'number' ? econ.toFixed(2) : '0.00',
                  ];
                })}
              />
            )}
          </>
        ) : (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>{t('liveViewer.fetching')}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Floating reaction emojis ─────────────────────────── */}
      {floatingItems.map((item) => (
        <View key={item.id} style={styles.floatingContainer} pointerEvents="none">
          <FloatingEmoji emoji={item.emoji} onDone={() => removeFloating(item.id)} />
        </View>
      ))}

      {/* ── Reactions bar ────────────────────────────────────── */}
      {!isCompleted && (
        <View style={[styles.reactionsBar, { paddingBottom: insets.bottom + 8 }]}>
          {REACTIONS.map((r) => (
            <TouchableOpacity
              key={r.type}
              onPress={() => sendReaction(r.type)}
              style={styles.reactionBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.background },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textMuted },
  liveDotConnected: { backgroundColor: Colors.success },
  liveText:         { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold },
  spectatorBadge:   { backgroundColor: Colors.card, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  spectatorText:    { fontSize: FontSize.xs, color: Colors.textSecondary },
  teamsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  teamName:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, flex: 1, textAlign: 'center' },
  vsText:     { fontSize: FontSize.sm, color: Colors.textMuted },
  metaRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  metaText:   { fontSize: FontSize.xs, color: Colors.textMuted },
  metaDot:    { fontSize: FontSize.xs, color: Colors.textMuted },
  resultCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.success + '22',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success,
    gap: 10,
  },
  resultEmoji:      { fontSize: 40 },
  resultText:       { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  scorecardBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  scorecardBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  loading:          { padding: 60, alignItems: 'center' },
  loadingText:      { color: Colors.textSecondary },

  // Reactions bar
  reactionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.surface + 'EE',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 10,
    paddingHorizontal: Spacing.lg,
  },
  reactionBtn:   { padding: 8, borderRadius: Radius.full, backgroundColor: Colors.card },
  reactionEmoji: { fontSize: 22 },

  // Floating emojis
  floatingContainer: {
    position: 'absolute',
    bottom: 70,
    right: Spacing.xl,
    alignItems: 'center',
  },
  floatingEmoji: { fontSize: 28 },
});
