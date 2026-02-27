import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useTools }  from '../../hooks/useTools';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader   from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'ToolDetail'>;

// Mapping toolId → form fields
const TOOL_FORMS: Record<string, { fields: { key: string; label: string; placeholder: string; numeric?: boolean }[] }> = {
  crr:                 { fields: [{ key: 'runs', label: 'Runs', placeholder: '0', numeric: true }, { key: 'overs', label: 'Overs', placeholder: '0', numeric: true }] },
  rrr:                 { fields: [{ key: 'target', label: 'Target', placeholder: '0', numeric: true }, { key: 'runsScored', label: 'Runs Scored', placeholder: '0', numeric: true }, { key: 'oversCompleted', label: 'Overs Completed', placeholder: '0', numeric: true }, { key: 'totalOvers', label: 'Total Overs', placeholder: '20', numeric: true }] },
  batting_average:     { fields: [{ key: 'totalRuns', label: 'Total Runs', placeholder: '0', numeric: true }, { key: 'innings', label: 'Innings', placeholder: '0', numeric: true }, { key: 'notOuts', label: 'Not Outs', placeholder: '0', numeric: true }] },
  strike_rate:         { fields: [{ key: 'runs', label: 'Runs', placeholder: '0', numeric: true }, { key: 'ballsFaced', label: 'Balls Faced', placeholder: '0', numeric: true }] },
  bowling_average:     { fields: [{ key: 'runsConceded', label: 'Runs Conceded', placeholder: '0', numeric: true }, { key: 'wickets', label: 'Wickets', placeholder: '0', numeric: true }] },
  economy:             { fields: [{ key: 'runsConceded', label: 'Runs Conceded', placeholder: '0', numeric: true }, { key: 'oversBowled', label: 'Overs Bowled', placeholder: '0', numeric: true }] },
  bowling_strike_rate: { fields: [{ key: 'ballsBowled', label: 'Balls Bowled', placeholder: '0', numeric: true }, { key: 'wickets', label: 'Wickets', placeholder: '0', numeric: true }] },
  nrr:                 { fields: [{ key: 'runsScored', label: 'Runs Scored', placeholder: '0', numeric: true }, { key: 'oversFaced', label: 'Overs Faced', placeholder: '0', numeric: true }, { key: 'runsConceded', label: 'Runs Conceded', placeholder: '0', numeric: true }, { key: 'oversBowled', label: 'Overs Bowled', placeholder: '0', numeric: true }] },
  dls:                 { fields: [{ key: 'team1Score', label: 'Team 1 Score', placeholder: '0', numeric: true }, { key: 'team1Overs', label: 'Team 1 Overs', placeholder: '0', numeric: true }, { key: 'team2OversAllowed', label: 'Team 2 Overs Allowed', placeholder: '0', numeric: true }, { key: 'wicketsLost', label: 'Wickets Lost', placeholder: '0', numeric: true }] },
  project_score:       { fields: [{ key: 'currentRuns', label: 'Current Runs', placeholder: '0', numeric: true }, { key: 'currentOvers', label: 'Current Overs', placeholder: '0', numeric: true }, { key: 'totalOvers', label: 'Total Overs', placeholder: '20', numeric: true }] },
  partnership:         { fields: [{ key: 'runs', label: 'Partnership Runs', placeholder: '0', numeric: true }, { key: 'balls', label: 'Balls', placeholder: '0', numeric: true }] },
  win_probability:     { fields: [{ key: 'target', label: 'Target', placeholder: '0', numeric: true }, { key: 'currentRuns', label: 'Current Runs', placeholder: '0', numeric: true }, { key: 'wicketsLost', label: 'Wickets Lost', placeholder: '0', numeric: true }, { key: 'oversCompleted', label: 'Overs Completed', placeholder: '0', numeric: true }, { key: 'totalOvers', label: 'Total Overs', placeholder: '20', numeric: true }] },
};

export default function ToolDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { toolId, toolName, toolDescription } = route.params;
  const { result, isLoading,
    calcCRR, calcRRR, calcBattingAverage, calcStrikeRate,
    calcBowlingAverage, calcEconomy, calcBowlingStrikeRate,
    calcNRR, calcDLS, projectScore, calcPartnership, estimateWinProbability,
  } = useTools();

  const formConfig = TOOL_FORMS[toolId];
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const setInput = (key: string, val: string) => setInputs((prev) => ({ ...prev, [key]: val }));

  const getNum = (key: string) => parseFloat(inputs[key] ?? '0') || 0;

  const handleCalculate = async () => {
    switch (toolId) {
      case 'crr':                 return calcCRR({ runs: getNum('runs'), overs: getNum('overs') });
      case 'rrr':                 return calcRRR({ target: getNum('target'), runsScored: getNum('runsScored'), oversCompleted: getNum('oversCompleted'), totalOvers: getNum('totalOvers') });
      case 'batting_average':     return calcBattingAverage({ totalRuns: getNum('totalRuns'), innings: getNum('innings'), notOuts: getNum('notOuts') });
      case 'strike_rate':         return calcStrikeRate({ runs: getNum('runs'), ballsFaced: getNum('ballsFaced') });
      case 'bowling_average':     return calcBowlingAverage({ runsConceded: getNum('runsConceded'), wickets: getNum('wickets') });
      case 'economy':             return calcEconomy({ runsConceded: getNum('runsConceded'), oversBowled: getNum('oversBowled') });
      case 'bowling_strike_rate': return calcBowlingStrikeRate({ ballsBowled: getNum('ballsBowled'), wickets: getNum('wickets') });
      case 'nrr':                 return calcNRR({ runsScored: getNum('runsScored'), oversFaced: getNum('oversFaced'), runsConceded: getNum('runsConceded'), oversBowled: getNum('oversBowled') });
      case 'dls':                 return calcDLS({ team1Score: getNum('team1Score'), team1Overs: getNum('team1Overs'), team2OversAllowed: getNum('team2OversAllowed'), wicketsLost: getNum('wicketsLost') });
      case 'project_score':       return projectScore({ currentRuns: getNum('currentRuns'), currentOvers: getNum('currentOvers'), totalOvers: getNum('totalOvers') });
      case 'partnership':         return calcPartnership({ runs: getNum('runs'), balls: getNum('balls') });
      case 'win_probability':     return estimateWinProbability({ target: getNum('target'), currentRuns: getNum('currentRuns'), wicketsLost: getNum('wicketsLost'), oversCompleted: getNum('oversCompleted'), totalOvers: getNum('totalOvers') });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LoadingOverlay visible={isLoading} />
      <ScreenHeader title={toolName} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.desc}>{toolDescription}</Text>

        {/* Inputs */}
        {formConfig?.fields.map((f) => (
          <View key={f.key} style={styles.field}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              value={inputs[f.key] ?? ''}
              onChangeText={(v) => setInput(f.key, v)}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.textMuted}
              keyboardType={f.numeric ? 'decimal-pad' : 'default'}
            />
          </View>
        ))}

        <TouchableOpacity onPress={handleCalculate} style={styles.calcBtn} activeOpacity={0.85}>
          <Text style={styles.calcBtnText}>{t('tools.calculate')}</Text>
        </TouchableOpacity>

        {/* Result */}
        {result != null && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{t('tools.result')}</Text>
            {Object.entries(result as Record<string, unknown>).map(([key, val]) => (
              <View key={key} style={styles.resultRow}>
                <Text style={styles.resultKey}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                <Text style={styles.resultVal}>{typeof val === 'number' ? val.toFixed(2) : String(val)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: Colors.background },
  container:    { padding: Spacing.xl, gap: Spacing.lg },
  desc:         { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  field:        { gap: 6 },
  label:        { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  calcBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  calcBtnText:  { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 12,
  },
  resultTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    paddingBottom: 8,
  },
  resultKey:    { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  resultVal:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.accent },
});
