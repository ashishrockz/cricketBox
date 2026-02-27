import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useMatch } from '../../hooks/useMatch';
import { useScoring } from '../../hooks/useScoring';
import { useMatchSocket } from '../../hooks/useSocket';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader from '../../components/ScreenHeader';
import ScorecardTable from '../../components/ScorecardTable';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { DeliveryOutcome, Match, Player } from '../../types';
import type {
  BallUpdatePayload,
  UndoBallPayload,
  InningsCompletePayload,
} from '../../api/socketService';
import { getTokens } from '../../api/apiClient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'Scoring'>;

// Ball label colour helper
type BallType = 'normal' | 'four' | 'six' | 'wide' | 'no_ball' | 'wicket' | 'dot';
function ballColor(type: BallType): string {
  switch (type) {
    case 'four':    return Colors.info;
    case 'six':     return Colors.success;
    case 'wicket':  return Colors.error;
    case 'wide':
    case 'no_ball': return Colors.accent;
    default:        return Colors.cardBorder;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ScoringScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { matchId, roomId } = route.params;

  const { match, fetchMatch, startMatch, endInnings, isLoading: matchLoading } = useMatch();
  const { innings, recordBall, undoLast, applySocketUpdate, isLoading: scoringLoading } = useScoring();

  const [strikerId,      setStrikerId]      = useState('');
  const [strikerName,    setStrikerName]    = useState('');
  const [nonStrikerId,   setNonStrikerId]   = useState('');
  const [nonStrikerName, setNonStrikerName] = useState('');
  const [bowlerId,       setBowlerId]       = useState('');
  const [bowlerName,     setBowlerName]     = useState('');
  const [showPlayers,    setShowPlayers]    = useState(false);
  const [selectFor,      setSelectFor]      = useState<'striker' | 'nonStriker' | 'bowler'>('striker');
  const [commentary,     setCommentary]     = useState('');

  // Tracks the balls of the current over for the "This Over" display
  interface OverBall { label: string; type: BallType }
  const [overBalls, setOverBalls] = useState<OverBall[]>([]);

  // Socket auth token
  const [socketToken, setSocketToken] = useState<string | undefined>();
  useEffect(() => {
    getTokens().then(({ accessToken }) => {
      if (accessToken) setSocketToken(accessToken);
    });
  }, []);

  // Ref to always have the latest match in socket callbacks (avoids stale closures)
  const matchRef = useRef<Match | null>(null);
  useEffect(() => { matchRef.current = match; }, [match]);

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      await fetchMatch(matchId);
      await startMatch(matchId);
    };
    init();
  }, [matchId]);

  // ── Derived display values ─────────────────────────────────────────────────

  const inningsDisplay = innings ?? match?.innings[match.currentInnings - 1];

  const currentOver = inningsDisplay
    ? `${inningsDisplay.totalOvers}.${inningsDisplay.totalBalls % 6}`
    : '0.0';

  const totalBallsBowled = inningsDisplay
    ? inningsDisplay.totalOvers * 6 + (inningsDisplay.totalBalls % 6)
    : 0;

  const crr = totalBallsBowled > 0 && inningsDisplay
    ? (inningsDisplay.totalRuns / (totalBallsBowled / 6)).toFixed(2)
    : '0.00';

  const target = (match?.innings?.length ?? 0) > 1
    ? match!.innings[0].totalRuns + 1
    : null;

  const runsNeeded = target != null
    ? target - (inningsDisplay?.totalRuns ?? 0)
    : null;

  const totalMatchBalls = (match?.totalOvers ?? 0) * 6;
  const ballsRemaining  = totalMatchBalls > 0
    ? totalMatchBalls - totalBallsBowled
    : null;

  const battingTeam =
    inningsDisplay?.battingTeam === 'team_a' ? match?.teamA : match?.teamB;

  const strikerStats = inningsDisplay?.battingStats?.find(
    (b) => (b.player ?? b.playerId) === strikerId,
  );
  const bowlerStats  = inningsDisplay?.bowlingStats?.find(
    (b) => (b.player ?? b.playerId) === bowlerId,
  );

  // ── Player name resolver (stable — uses ref to avoid stale closures) ────────

  const findPlayerName = useCallback((playerId: string | null): string => {
    if (!playerId) return '';
    const m = matchRef.current;
    if (!m) return '';
    return [
      ...(m.teamA?.players ?? []),
      ...(m.teamB?.players ?? []),
    ].find((p) => p._id === playerId)?.name ?? '';
  }, []); // matchRef is a ref — always current, no deps needed

  // ── Socket handlers ─────────────────────────────────────────────────────────

  const onBallUpdate = useCallback((payload: BallUpdatePayload) => {
    applySocketUpdate(payload.innings);
    const { nextBatsmen, overJustCompleted } = payload;
    if (nextBatsmen.striker != null) {
      setStrikerId(nextBatsmen.striker);
      setStrikerName(findPlayerName(nextBatsmen.striker));
    }
    if (nextBatsmen.nonStriker != null) {
      setNonStrikerId(nextBatsmen.nonStriker);
      setNonStrikerName(findPlayerName(nextBatsmen.nonStriker));
    }
    if (overJustCompleted) {
      setOverBalls([]);
      setBowlerId(''); setBowlerName('');
      setSelectFor('bowler');
      setShowPlayers(true);
    }
  }, [applySocketUpdate, findPlayerName]);

  const onUndoBall = useCallback((payload: UndoBallPayload) => {
    applySocketUpdate(payload.innings);
    const { nextBatsmen } = payload;
    if (nextBatsmen.striker != null) {
      setStrikerId(nextBatsmen.striker);
      setStrikerName(findPlayerName(nextBatsmen.striker));
    }
    if (nextBatsmen.nonStriker != null) {
      setNonStrikerId(nextBatsmen.nonStriker);
      setNonStrikerName(findPlayerName(nextBatsmen.nonStriker));
    }
  }, [applySocketUpdate, findPlayerName]);

  const onInningsComplete = useCallback((payload: InningsCompletePayload) => {
    const details = `${payload.totalRuns}/${payload.totalWickets} in ${payload.overs} overs`;
    const msg     = payload.target ? `${details}\nTarget: ${payload.target}` : details;
    Alert.alert(t('scoring.endInnings'), msg, [{
      text: t('common.ok'),
      onPress: async () => {
        await fetchMatch(matchId);
        setStrikerId('');    setStrikerName('');
        setNonStrikerId(''); setNonStrikerName('');
        setBowlerId('');     setBowlerName('');
        setOverBalls([]);
        setCommentary('');
      },
    }]);
  }, [fetchMatch, matchId, t]);

  const onMatchComplete = useCallback(() => {
    navigation.replace('MatchResult', { matchId });
  }, [navigation, matchId]);

  useMatchSocket({
    token: socketToken,
    matchId,
    roomId,
    onBallUpdate,
    onUndoBall,
    onInningsComplete,
    onMatchComplete,
  });

  // ── Delivery handler ────────────────────────────────────────────────────────

  const ensurePlayers = (defaultSelect: 'striker' | 'nonStriker' | 'bowler') => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      setSelectFor(defaultSelect);
      setShowPlayers(true);
      return false;
    }
    return true;
  };

  const handleDelivery = async (
    outcome: DeliveryOutcome,
    runs: number,
    extraRuns?: number,
  ) => {
    if (!ensurePlayers('striker')) return;

    const res = await recordBall({
      matchId, outcome, runs,
      extraRuns,
      strikerId, nonStrikerId, bowlerId,
      commentary: commentary.trim() || undefined,
    });

    if (!res.success) {
      Alert.alert(
        t('common.error'),
        (res as any).error?.message ?? 'Failed to record ball',
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.ok'), onPress: () => handleDelivery(outcome, runs, extraRuns) },
        ],
      );
      return;
    }

    // Clear commentary after each delivery
    setCommentary('');

    const updatedInnings = (res.result as any)?.innings;

    // Build ball label for "This Over" display
    const isLegal = outcome !== 'wide' && outcome !== 'no_ball';
    const ballType: BallType =
      outcome === 'wide'    ? 'wide'
      : outcome === 'no_ball' ? 'no_ball'
      : runs === 4            ? 'four'
      : runs === 6            ? 'six'
      : runs === 0            ? 'dot'
      : 'normal';
    const ballLabel =
      outcome === 'wide'    ? 'WD'
      : outcome === 'no_ball' ? 'NB'
      : String(runs);

    // Optimistic striker rotation
    const batRan  = isLegal && ['normal', 'bye', 'leg_bye'].includes(outcome);
    const oddRuns = batRan && runs % 2 === 1;

    let newSId  = strikerId,    newSName  = strikerName;
    let newNSId = nonStrikerId, newNSName = nonStrikerName;

    if (oddRuns) {
      [newSId, newNSId]     = [nonStrikerId, strikerId];
      [newSName, newNSName] = [nonStrikerName, strikerName];
    }

    const overJustEnded =
      isLegal &&
      updatedInnings?.totalBalls != null &&
      updatedInnings.totalBalls % 6 === 0 &&
      updatedInnings.totalBalls > 0;

    if (overJustEnded) {
      [newSId, newNSId]     = [newNSId, newSId];
      [newSName, newNSName] = [newNSName, newSName];
    }

    setStrikerId(newSId);    setStrikerName(newSName);
    setNonStrikerId(newNSId); setNonStrikerName(newNSName);

    if (overJustEnded) {
      setOverBalls([]);
      setBowlerId(''); setBowlerName('');
      setSelectFor('bowler');
      setShowPlayers(true);
    } else {
      setOverBalls(prev => [...prev, { label: ballLabel, type: ballType }]);
    }
  };

  const handleWicket = () => {
    if (!ensurePlayers('striker')) return;
    if (!match) return;

    const inningsIdx          = (match.currentInnings ?? 1) - 1;
    const battingTeamSide     = match.innings[inningsIdx]?.battingTeam;
    const fieldingTeamPlayers = (battingTeamSide === 'team_a' ? match.teamB : match.teamA)
      .players
      .map((p: Player) => ({ id: p._id, name: p.name }));

    navigation.navigate('WicketModal', {
      matchId,
      strikerId, strikerName,
      nonStrikerId, nonStrikerName,
      bowlerId, bowlerName,
      fieldingTeamPlayers,
    });
  };

  const handleUndo = () => {
    Alert.alert(t('scoring.undo'), 'Revert the previous delivery?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('scoring.undo'), style: 'destructive',
        onPress: async () => {
          await undoLast(matchId);
          setOverBalls(prev => prev.slice(0, -1));
        },
      },
    ]);
  };

  const handleEndInnings = () => {
    Alert.alert(t('scoring.endInnings'), 'End the current innings?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('scoring.endInnings'), style: 'destructive',
        onPress: async () => {
          const res = await endInnings(matchId);
          if (res.success) {
            if ((res.result as any)?.status === 'completed') {
              navigation.replace('MatchResult', { matchId });
            } else {
              await fetchMatch(matchId);
              setStrikerId('');    setStrikerName('');
              setNonStrikerId(''); setNonStrikerName('');
              setBowlerId('');     setBowlerName('');
              setOverBalls([]);
              setCommentary('');
            }
          }
        },
      },
    ]);
  };

  // ── Player selector overlay ──────────────────────────────────────────────────

  if (showPlayers && match) {
    return (
      <PlayerSelector
        match={match}
        selectFor={selectFor}
        onSelect={(id, name) => {
          if (selectFor === 'striker')    { setStrikerId(id);    setStrikerName(name); }
          if (selectFor === 'nonStriker') { setNonStrikerId(id); setNonStrikerName(name); }
          if (selectFor === 'bowler')     { setBowlerId(id);     setBowlerName(name); }
          setShowPlayers(false);
        }}
        onClose={() => setShowPlayers(false)}
      />
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <LoadingOverlay visible={matchLoading || scoringLoading} />

      <ScreenHeader
        title={`${battingTeam?.name ?? 'Scoring'}`}
        onBack={() =>
          Alert.alert('Leave?', 'Go back to lobby?', [
            { text: t('common.cancel') },
            { text: 'Leave', onPress: () => navigation.navigate('RoomLobby', { roomId }) },
          ])
        }
        right={
          <TouchableOpacity onPress={handleEndInnings} style={styles.endBtn}>
            <Text style={styles.endBtnText}>{t('scoring.endInnings')}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Score Header ────────────────────────────────────── */}
        <View style={styles.scoreHeader}>
          <View style={styles.scorePrimary}>
            <Text style={styles.scoreRuns}>
              {inningsDisplay?.totalRuns ?? 0}
              <Text style={styles.scoreWickets}>/{inningsDisplay?.totalWickets ?? 0}</Text>
            </Text>
            <Text style={styles.scoreOvers}>({currentOver} ov)</Text>
          </View>
          <View style={styles.scoreMeta}>
            <ScorePill label="CRR" value={crr} />
            {target != null      && <ScorePill label="Target" value={String(target)} />}
            {runsNeeded != null  && <ScorePill label="Need" value={String(runsNeeded)} highlight />}
            {ballsRemaining != null && runsNeeded != null && (
              <ScorePill label="Balls" value={String(ballsRemaining)} />
            )}
          </View>
        </View>

        {/* ── On-Field Players ────────────────────────────────── */}
        <View style={styles.fieldCard}>
          <TouchableOpacity
            style={[styles.fieldRow, styles.fieldRowStriker]}
            onPress={() => { setSelectFor('striker'); setShowPlayers(true); }}
            activeOpacity={0.8}
          >
            <View style={styles.fieldIcon}><Text style={styles.strikerStar}>★</Text></View>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldName}>{strikerName || t('scoring.selectStriker')}</Text>
              {strikerStats && (
                <Text style={styles.fieldStat}>
                  {strikerStats.runs ?? 0}
                  <Text style={styles.fieldStatMuted}>
                    ({strikerStats.balls ?? strikerStats.ballsFaced ?? 0})
                  </Text>
                  {'  '}4s: {strikerStats.fours ?? 0}{'  '}6s: {strikerStats.sixes ?? 0}
                </Text>
              )}
            </View>
            <Text style={styles.fieldTag}>{t('scoring.onStrike').toUpperCase()}</Text>
          </TouchableOpacity>

          <View style={styles.fieldDivider} />

          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => { setSelectFor('nonStriker'); setShowPlayers(true); }}
            activeOpacity={0.8}
          >
            <View style={styles.fieldIcon}>
              <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
            </View>
            <View style={styles.fieldInfo}>
              <Text style={[styles.fieldName, styles.fieldNameMuted]}>
                {nonStrikerName || t('scoring.selectNonStriker')}
              </Text>
            </View>
            <Text style={styles.fieldTagMuted}>{t('scoring.nonStriker').toUpperCase()}</Text>
          </TouchableOpacity>

          <View style={styles.fieldDivider} />

          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => { setSelectFor('bowler'); setShowPlayers(true); }}
            activeOpacity={0.8}
          >
            <View style={styles.fieldIcon}>
              <Ionicons name="radio-button-on-outline" size={16} color={Colors.accent} />
            </View>
            <View style={styles.fieldInfo}>
              <Text style={[styles.fieldName, { color: Colors.accent }]}>
                {bowlerName || t('scoring.selectBowler')}
              </Text>
              {bowlerStats && (
                <Text style={styles.fieldStat}>
                  {bowlerStats.overs}ov{'  '}{bowlerStats.wickets ?? 0}W{'  '}
                  {bowlerStats.runs ?? bowlerStats.runsConceded ?? 0}R
                </Text>
              )}
            </View>
            <Text style={styles.fieldTagMuted}>{t('scoring.bowling').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── This Over ───────────────────────────────────────── */}
        <View style={styles.thisOverRow}>
          <Text style={styles.thisOverLabel}>{t('scoring.thisOver')}</Text>
          <View style={styles.thisOverBalls}>
            {overBalls.map((b, i) => (
              <View
                key={i}
                style={[styles.ballDot, {
                  backgroundColor: ballColor(b.type) + '33',
                  borderColor:     ballColor(b.type),
                }]}
              >
                <Text style={[styles.ballDotText, { color: ballColor(b.type) }]}>
                  {b.label}
                </Text>
              </View>
            ))}
            {overBalls.length === 0 && <Text style={styles.thisOverEmpty}>—</Text>}
          </View>
        </View>

        {/* ── Commentary Input ─────────────────────────────────── */}
        <View style={styles.commentaryRow}>
          <Ionicons name="mic-outline" size={14} color={Colors.textMuted} style={{ marginTop: 2 }} />
          <TextInput
            style={styles.commentaryInput}
            value={commentary}
            onChangeText={setCommentary}
            placeholder={t('scoring.commentary')}
            placeholderTextColor={Colors.textMuted}
            returnKeyType="done"
            maxLength={200}
          />
          {commentary.length > 0 && (
            <TouchableOpacity
              onPress={() => setCommentary('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Run Buttons ─────────────────────────────────────── */}
        <View style={styles.runSection}>
          <View style={styles.runRow}>
            {([0, 1, 2, 3, 4, 6] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => handleDelivery('normal', r)}
                style={[
                  styles.runBtn,
                  r === 4 && styles.runBtnFour,
                  r === 6 && styles.runBtnSix,
                  scoringLoading && styles.btnDisabled,
                ]}
                activeOpacity={0.7}
                disabled={scoringLoading}
              >
                <Text style={[
                  styles.runBtnText,
                  r === 4 && { color: Colors.info },
                  r === 6 && { color: Colors.success },
                ]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.extrasRow}>
            {([
              { labelKey: 'scoring.wide',   outcome: 'wide'    as DeliveryOutcome, extraRuns: 1 },
              { labelKey: 'scoring.noBall', outcome: 'no_ball' as DeliveryOutcome, extraRuns: 1 },
              { labelKey: 'scoring.bye',    outcome: 'bye'     as DeliveryOutcome },
              { labelKey: 'scoring.legBye', outcome: 'leg_bye' as DeliveryOutcome },
            ]).map((e) => (
              <TouchableOpacity
                key={e.outcome}
                onPress={() => handleDelivery(e.outcome, 0, e.extraRuns)}
                style={[styles.extraBtn, scoringLoading && styles.btnDisabled]}
                activeOpacity={0.75}
                disabled={scoringLoading}
              >
                <Text style={styles.extraBtnText}>{t(e.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleWicket}
              style={[styles.wicketBtn, scoringLoading && styles.btnDisabled]}
              activeOpacity={0.85}
              disabled={scoringLoading}
            >
              <Ionicons name="skull-outline" size={20} color={Colors.white} />
              <Text style={styles.wicketBtnText}>{t('scoring.wicket').toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUndo}
              style={[styles.undoBtn, scoringLoading && styles.btnDisabled]}
              activeOpacity={0.85}
              disabled={scoringLoading}
            >
              <Ionicons name="arrow-undo-outline" size={18} color={Colors.text} />
              <Text style={styles.undoBtnText}>{t('scoring.undo')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Mini Scorecard ──────────────────────────────────── */}
        {inningsDisplay?.battingStats && inningsDisplay.battingStats.length > 0 && (
          <ScorecardTable
            title={t('scoring.batting')}
            headers={[t('scoring.batting'), t('scoring.runs'), t('scoring.balls'), t('scoring.fours'), t('scoring.sixes'), t('scoring.strikeRate')]}
            rows={inningsDisplay.battingStats.map((b) => {
              const balls = b.balls ?? b.ballsFaced ?? 0;
              const sr    = b.strikeRate ?? b.sr;
              return [
                b.playerName + (
                  (b.player ?? b.playerId) === strikerId   ? ' *' :
                  (b.player ?? b.playerId) === nonStrikerId ? ' †' : ''
                ),
                String(b.runs ?? 0),
                String(balls),
                String(b.fours ?? 0),
                String(b.sixes ?? 0),
                typeof sr === 'number' ? sr.toFixed(1) : '-',
              ];
            })}
          />
        )}

        {inningsDisplay?.bowlingStats && inningsDisplay.bowlingStats.length > 0 && (
          <ScorecardTable
            title={t('scoring.bowlingTab')}
            headers={[t('scoring.bowlingTab'), 'O', 'M', t('scoring.runs'), t('scoring.wicket'), 'Econ']}
            rows={inningsDisplay.bowlingStats.map((b) => {
              const runs = b.runs ?? b.runsConceded ?? 0;
              const econ = b.economy ?? b.economyRate;
              return [
                b.playerName,
                String(b.overs),
                String(b.maidens ?? 0),
                String(runs),
                String(b.wickets ?? 0),
                typeof econ === 'number' ? econ.toFixed(2) : '-',
              ];
            })}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScorePill
// ─────────────────────────────────────────────────────────────────────────────

function ScorePill({ label, value, highlight }: {
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={[scorePillStyles.pill, highlight && scorePillStyles.pillHighlight]}>
      <Text style={scorePillStyles.label}>{label}</Text>
      <Text style={[scorePillStyles.value, highlight && scorePillStyles.valueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const scorePillStyles = StyleSheet.create({
  pill:           { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.12)' },
  pillHighlight:  { backgroundColor: Colors.accent + '33' },
  label:          { fontSize: 9, color: Colors.white + 'AA', fontWeight: FontWeight.medium, textTransform: 'uppercase' },
  value:          { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.bold },
  valueHighlight: { color: Colors.accent },
});

// ─────────────────────────────────────────────────────────────────────────────
// PlayerSelector sheet
// ─────────────────────────────────────────────────────────────────────────────

function PlayerSelector({ match, selectFor, onSelect, onClose }: {
  match: NonNullable<ReturnType<typeof useMatch>['match']>;
  selectFor: 'striker' | 'nonStriker' | 'bowler';
  onSelect: (id: string, name: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const inningsIdx = match.currentInnings - 1;
  const batting    = match.innings[inningsIdx]?.battingTeam === 'team_a' ? match.teamA : match.teamB;
  const bowling    = match.innings[inningsIdx]?.battingTeam === 'team_a' ? match.teamB : match.teamA;
  const players: Player[] = selectFor === 'bowler' ? bowling.players : batting.players;

  const title =
    selectFor === 'striker'    ? t('scoring.selectStriker') :
    selectFor === 'nonStriker' ? t('scoring.selectNonStriker') :
    t('scoring.selectBowler');

  return (
    <View style={selectorStyles.overlay}>
      <View style={selectorStyles.sheet}>
        <View style={selectorStyles.header}>
          <Text style={selectorStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {players.map((p: Player) => (
            <TouchableOpacity
              key={p._id}
              onPress={() => onSelect(p._id, p.name)}
              style={selectorStyles.item}
              activeOpacity={0.7}
            >
              <View style={selectorStyles.itemLeft}>
                <Text style={selectorStyles.itemName}>{p.name}</Text>
                <Text style={selectorStyles.itemRole}>
                  {p.playingRole.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={selectorStyles.badges}>
                {p.isCaptain      && <Text style={selectorStyles.badge}>C</Text>}
                {p.isWicketKeeper && <Text style={selectorStyles.badge}>WK</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet:    { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '72%' },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  title:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  item:     { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  itemLeft: { flex: 1 },
  itemName: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  itemRole: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'capitalize', marginTop: 2 },
  badges:   { flexDirection: 'row', gap: 4 },
  badge:    { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.accent, backgroundColor: Colors.accent + '22', borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  endBtn:     { backgroundColor: Colors.error + '22', borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  endBtnText: { fontSize: FontSize.xs, color: Colors.error, fontWeight: FontWeight.bold },

  scoreHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: 10,
    alignItems: 'center',
  },
  scorePrimary:  { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreRuns:     { fontSize: 52, fontWeight: FontWeight.extrabold, color: Colors.white, lineHeight: 60 },
  scoreWickets:  { fontSize: FontSize.xxl, fontWeight: FontWeight.semibold, color: Colors.white + 'BB' },
  scoreOvers:    { fontSize: FontSize.lg, color: Colors.white + 'AA' },
  scoreMeta:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },

  fieldCard:       { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  fieldRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: 10 },
  fieldRowStriker: { backgroundColor: Colors.success + '10' },
  fieldIcon:       { width: 28, alignItems: 'center' },
  strikerStar:     { fontSize: 18, color: Colors.success },
  fieldInfo:       { flex: 1 },
  fieldName:       { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  fieldNameMuted:  { color: Colors.textSecondary, fontWeight: FontWeight.medium },
  fieldStat:       { fontSize: FontSize.xs, color: Colors.success, marginTop: 2, fontWeight: FontWeight.medium },
  fieldStatMuted:  { color: Colors.textMuted },
  fieldTag:        { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.success, letterSpacing: 0.5 },
  fieldTagMuted:   { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 0.5 },
  fieldDivider:    { height: 1, backgroundColor: Colors.cardBorder, marginLeft: Spacing.lg },

  thisOverRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: Spacing.lg, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  thisOverLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium, width: 56 },
  thisOverBalls: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  thisOverEmpty: { fontSize: FontSize.sm, color: Colors.textMuted },
  ballDot:       { minWidth: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  ballDotText:   { fontSize: 11, fontWeight: FontWeight.bold },

  commentaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  commentaryInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.text,
  },

  runSection: { padding: Spacing.lg, gap: Spacing.md },
  runRow:     { flexDirection: 'row', gap: 8 },
  runBtn:     { flex: 1, height: 58, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  runBtnFour: { backgroundColor: Colors.info + '18', borderColor: Colors.info },
  runBtnSix:  { backgroundColor: Colors.success + '18', borderColor: Colors.success },
  runBtnText: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  btnDisabled:{ opacity: 0.45 },

  extrasRow:     { flexDirection: 'row', gap: 8 },
  extraBtn:      { flex: 1, paddingVertical: 11, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center' },
  extraBtnText:  { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },

  actionRow:     { flexDirection: 'row', gap: 10 },
  wicketBtn:     { flex: 2, paddingVertical: 16, backgroundColor: Colors.error, borderRadius: Radius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  wicketBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.extrabold, letterSpacing: 1 },
  undoBtn:       { flex: 1, paddingVertical: 16, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  undoBtnText:   { color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});
