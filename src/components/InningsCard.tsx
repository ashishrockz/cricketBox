import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../theme';
import type { LiveInnings } from '../types';

interface Props {
  innings: LiveInnings;
  teamAName: string;
  teamBName: string;
  label: string;
  isActive?: boolean;
}

export default function InningsCard({
  innings,
  teamAName,
  teamBName,
  label,
  isActive = false,
}: Props) {
  const battingName =
    innings.battingTeam === 'team_a' ? teamAName : teamBName;

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {isActive && <Text style={styles.liveBadge}>LIVE</Text>}
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.teamName}>{battingName}</Text>
        <Text style={styles.score}>
          {innings.totalRuns}/{innings.totalWickets}
          <Text style={styles.overs}> ({innings.overs} ov)</Text>
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>CRR: {innings.runRate}</Text>
        {innings.target != null && (
          <Text style={styles.metaText}>Target: {innings.target}</Text>
        )}
        <Text style={styles.metaText}>
          Extras: {innings.extras?.total ?? 0}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardActive: { borderColor: Colors.success },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  liveBadge: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.bold,
    backgroundColor: Colors.success + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
  },
  teamName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  score: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  overs: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.regular,
  },
  meta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
