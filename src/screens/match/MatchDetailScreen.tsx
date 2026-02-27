import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useMatch } from '../../hooks/useMatch';
import AdBanner from '../../components/AdBanner';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'MatchDetail'>;

type Tab = 'scorecard' | 'timeline' | 'info';

export default function MatchDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { matchId } = route.params;
  const { match, timeline, fetchMatch, fetchTimeline, isLoading } = useMatch();
  const [activeTab, setActiveTab] = useState<Tab>('scorecard');

  useEffect(() => { fetchMatch(matchId); }, [matchId]);

  const loadTimeline = () => {
    if (activeTab === 'timeline') fetchTimeline(matchId);
  };

  useEffect(() => { loadTimeline(); }, [activeTab]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'scorecard', label: t('matchDetail.scorecard') },
    { key: 'timeline',  label: t('matchDetail.ballByBall') },
    { key: 'info',      label: t('matchDetail.info') },
  ];

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t('matchDetail.title')} onBack={() => navigation.goBack()} />
      <AdBanner placement="match_detail_top" />

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchMatch(matchId)} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Scorecard Tab */}
        {activeTab === 'scorecard' && match && (
          <>
            {match.innings.map((innings, idx) => {
              const battingTeamName = innings.battingTeam === 'team_a' ? match.teamA.name : match.teamB.name;
              const bowlingTeamName = innings.battingTeam === 'team_a' ? match.teamB.name : match.teamA.name;

              // Build fall of wickets from batting stats
              const dismissed = innings.battingStats
                .filter((b) => b.isOut)
                .map((b, wi) => ({
                  wicket:        wi + 1,
                  playerName:    b.playerName,
                  dismissalType: b.dismissalType,
                }));

              return (
                <View key={idx} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t('matchDetail.innings', { n: idx + 1, team: battingTeamName })}
                  </Text>
                  <Text style={styles.totalScore}>
                    {innings.totalRuns}/{innings.totalWickets} ({innings.totalOvers} ov)
                  </Text>

                  {/* Batting Table */}
                  <BattingTable stats={innings.battingStats} />

                  {/* Extras */}
                  <View style={styles.extrasRow}>
                    <Text style={styles.extrasLabel}>{t('matchDetail.extras')}</Text>
                    <Text style={styles.extrasValue}>{innings.extras.total}</Text>
                    <Text style={styles.extrasMeta}>
                      (W:{innings.extras.wides} NB:{innings.extras.noBalls} B:{innings.extras.byes} LB:{innings.extras.legByes})
                    </Text>
                  </View>

                  {/* Fall of Wickets */}
                  {dismissed.length > 0 && (
                    <View style={styles.fowWrap}>
                      <Text style={styles.fowTitle}>{t('matchDetail.fallOfWickets')}</Text>
                      <View style={styles.fowRow}>
                        {dismissed.map((d) => (
                          <View key={d.wicket} style={styles.fowItem}>
                            <Text style={styles.fowWicket}>{d.wicket}W</Text>
                            <Text style={styles.fowName} numberOfLines={1}>{d.playerName}</Text>
                            {d.dismissalType && (
                              <Text style={styles.fowDismissal}>
                                {d.dismissalType.replace(/_/g, ' ')}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Bowling Table */}
                  <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
                    {t('scoring.bowlingTab')} — {bowlingTeamName}
                  </Text>
                  <BowlingTable stats={innings.bowlingStats} />
                </View>
              );
            })}
          </>
        )}

        {/* Ball-by-Ball Tab */}
        {activeTab === 'timeline' && (
          <View style={styles.section}>
            {timeline.map((ev) => (
              <View key={ev._id} style={styles.ballRow}>
                <Text style={styles.ballOver}>{ev.over}.{ev.ball}</Text>
                <View style={[styles.ballOutcome, ev.isWicket && styles.ballOutcomeWicket]}>
                  <Text style={styles.ballOutcomeText}>
                    {ev.isWicket ? 'W' : ev.outcome === 'wide' ? 'Wd' : ev.outcome === 'no_ball' ? 'NB' : String(ev.runs)}
                  </Text>
                </View>
                <Text style={styles.ballCommentary} numberOfLines={2}>
                  {ev.striker.name} {t('matchDetail.to')} {ev.bowler.name}
                  {ev.commentary ? ` — ${ev.commentary}` : ''}
                </Text>
              </View>
            ))}
            {timeline.length === 0 && (
              <Text style={styles.emptyText}>{t('matchDetail.noBallData')}</Text>
            )}
          </View>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && match && (
          <View style={styles.section}>
            <InfoCard label={t('matchDetail.format')}  value={match.matchFormat} />
            <InfoCard label={t('matchDetail.overs')}   value={`${match.totalOvers}`} />
            <InfoCard label={t('matchDetail.venue')}   value={match.venue ?? t('matchDetail.notSpecified')} />
            <InfoCard label={t('matchDetail.date')}    value={new Date(match.matchDate).toLocaleDateString()} />
            <InfoCard label={t('matchDetail.status')}  value={match.status} />
            {match.toss && (
              <>
                <InfoCard label={t('matchDetail.tossWon')}  value={match.toss.wonBy === 'team_a' ? match.teamA.name : match.teamB.name} />
                <InfoCard label={t('matchDetail.decision')} value={match.toss.decision} />
              </>
            )}
          </View>
        )}

        <AdBanner placement="match_detail_bottom" />
      </ScrollView>
    </View>
  );
}

function BattingTable({ stats }: { stats: any[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <Text style={[styles.cell, styles.cellWide, styles.headerCell]}>{t('scoring.batting')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('scoring.runs')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('scoring.balls')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('scoring.fours')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('scoring.sixes')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('scoring.strikeRate')}</Text>
      </View>
      {stats.map((b) => (
        <View key={b.playerId} style={styles.tableRow}>
          <Text style={[styles.cell, styles.cellWide]} numberOfLines={1}>{b.playerName} {b.isOut ? `(${b.dismissalType?.replace(/_/g, ' ') ?? 'out'})` : '*'}</Text>
          <Text style={styles.cell}>{b.runs}</Text>
          <Text style={styles.cell}>{b.balls}</Text>
          <Text style={styles.cell}>{b.fours}</Text>
          <Text style={styles.cell}>{b.sixes}</Text>
          <Text style={styles.cell}>{b.strikeRate.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );
}

function BowlingTable({ stats }: { stats: any[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <Text style={[styles.cell, styles.cellWide, styles.headerCell]}>{t('scoring.bowlingTab')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('matchDetail.colOvers')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('scoring.runs')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('matchDetail.colWickets')}</Text>
        <Text style={[styles.cell, styles.headerCell]}>{t('matchDetail.colEcon')}</Text>
      </View>
      {stats.map((b) => (
        <View key={b.playerId} style={styles.tableRow}>
          <Text style={[styles.cell, styles.cellWide]} numberOfLines={1}>{b.playerName}</Text>
          <Text style={styles.cell}>{b.overs}</Text>
          <Text style={styles.cell}>{b.runs}</Text>
          <Text style={styles.cell}>{b.wickets}</Text>
          <Text style={styles.cell}>{b.economy.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.background },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive:      { borderBottomColor: Colors.primary },
  tabText:        { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive:  { color: Colors.primary, fontWeight: FontWeight.semibold },
  section:        { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  totalScore:     { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  table: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  tableRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.cardBorder + '66' },
  tableHeaderRow: { backgroundColor: Colors.cardBorder + '44' },
  cell:           { flex: 1, paddingVertical: 8, paddingHorizontal: 4, fontSize: FontSize.xs, color: Colors.text, textAlign: 'center' },
  cellWide:       { flex: 3, textAlign: 'left', paddingLeft: 8 },
  headerCell:     { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  extrasRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  extrasLabel:    { fontSize: FontSize.sm, color: Colors.textSecondary, width: 60 },
  extrasValue:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  extrasMeta:     { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },

  // Fall of Wickets
  fowWrap:        { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  fowTitle:       { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fowRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fowItem: {
    backgroundColor: Colors.cardBorder + '44',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  fowWicket:      { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.error },
  fowName:        { fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.medium, marginTop: 2, maxWidth: 80 },
  fowDismissal:   { fontSize: 10, color: Colors.textMuted, textTransform: 'capitalize', marginTop: 1 },

  ballRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder + '55',
    gap: 10,
  },
  ballOver:         { fontSize: FontSize.xs, color: Colors.textMuted, width: 28, textAlign: 'center' },
  ballOutcome: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballOutcomeWicket:{ backgroundColor: Colors.error },
  ballOutcomeText:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.text },
  ballCommentary:   { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  emptyText:        { color: Colors.textMuted, textAlign: 'center', padding: 40 },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoLabel:        { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue:        { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium, textTransform: 'capitalize' },
});
