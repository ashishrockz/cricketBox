import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../theme';

interface Props {
  title: string;
  headers: string[];
  rows: string[][];
  /** Index of the "name" column that should be left-aligned and wider. Default: 0 */
  nameColumnIndex?: number;
}

export default function ScorecardTable({
  title,
  headers,
  rows,
  nameColumnIndex = 0,
}: Props) {
  return (
    <View style={styles.table}>
      <Text style={styles.tableTitle}>{title}</Text>
      <View style={[styles.row, styles.headerRow]}>
        {headers.map((h, i) => (
          <Text
            key={i}
            style={[
              styles.cell,
              i === nameColumnIndex && styles.cellWide,
              styles.headerCell,
            ]}
          >
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((cell, ci) => (
            <Text
              key={ci}
              style={[styles.cell, ci === nameColumnIndex && styles.cellWide]}
              numberOfLines={1}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  tableTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder + '88',
  },
  headerRow: { backgroundColor: Colors.cardBorder + '44' },
  cell: {
    flex: 1,
    padding: 8,
    fontSize: FontSize.xs,
    color: Colors.text,
    textAlign: 'center',
  },
  cellWide: { flex: 3, textAlign: 'left' },
  headerCell: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
});
