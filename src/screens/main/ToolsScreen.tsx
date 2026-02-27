import React, { useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, TabParamList } from '../../navigation/types';
import { useTools } from '../../hooks/useTools';
import { useAuthContext } from '../../context/AuthContext';
import AdBanner from '../../components/AdBanner';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { ToolInfo } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Tools'>,
  NativeStackScreenProps<MainStackParamList>
>;

const TOOL_ICONS: Record<string, string> = {
  crr: '📈', rrr: '🎯', batting_average: '🏏', strike_rate: '⚡',
  bowling_average: '🎳', economy: '💰', bowling_strike_rate: '🎱',
  nrr: '🔢', dls: '🌧️', project_score: '🔮', partnership: '🤝', win_probability: '🏆',
};

export default function ToolsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { tools, fetchTools, isLoading } = useTools();
  const { user } = useAuthContext();

  useEffect(() => { fetchTools(); }, []);

  const canUseTools = user?.subscriptionPlan !== 'free';

  const handleTool = (tool: ToolInfo) => {
    if (!tool.hasAccess) {
      navigation.navigate('Plans');
      return;
    }
    navigation.navigate('ToolDetail', {
      toolId: tool.id,
      toolName: tool.name,
      toolDescription: tool.description,
    });
  };

  const renderTool = ({ item }: { item: ToolInfo }) => (
    <TouchableOpacity
      style={[styles.toolCard, !item.hasAccess && styles.toolCardLocked]}
      onPress={() => handleTool(item)}
      activeOpacity={0.8}
    >
      <Text style={styles.toolIcon}>{TOOL_ICONS[item.id] ?? '🔧'}</Text>
      <Text style={styles.toolName}>{item.name}</Text>
      <Text style={styles.toolDesc} numberOfLines={2}>{item.description}</Text>
      {!item.hasAccess && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tools.title')}</Text>
        {!canUseTools && (
          <TouchableOpacity onPress={() => navigation.navigate('Plans')} style={styles.upgradePill}>
            <Text style={styles.upgradeText}>{t('tools.upgradeToUnlock')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <AdBanner placement="tools_banner" />

      <FlatList
        data={tools}
        keyExtractor={(tool) => tool.id}
        renderItem={renderTool}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTools} tintColor={Colors.accent} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔧</Text>
              <Text style={styles.emptyText}>{t('tools.loading')}</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title:         { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  upgradePill: {
    marginTop: 6,
    backgroundColor: Colors.accent + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  upgradeText:   { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.semibold },
  row:           { gap: Spacing.md, marginBottom: Spacing.md },
  toolCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: 'relative',
    minHeight: 110,
  },
  toolCardLocked:{ opacity: 0.6 },
  toolIcon:      { fontSize: 28 },
  toolName:      { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  toolDesc:      { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  lockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.cardBorder,
    borderRadius: Radius.full,
    padding: 4,
  },
  empty:         { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon:     { fontSize: 48 },
  emptyText:     { fontSize: FontSize.md, color: Colors.textSecondary },
});
