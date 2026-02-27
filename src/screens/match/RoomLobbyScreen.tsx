import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { useRooms } from '../../hooks/useRooms';
import { useSocket } from '../../hooks/useSocket';
import { getTokens } from '../../api/apiClient';
import socketService, { SOCKET_EVENTS } from '../../api/socketService';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScreenHeader from '../../components/ScreenHeader';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../theme';
import type { Player, PlayerTeam } from '../../types';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<MainStackParamList, 'RoomLobby'>;

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────

interface BottomSheetProps {
  visible: boolean;
  teamName: string;
  players: Player[];
  onAddPlayer: () => void;
  onClose: () => void;
}

function TeamBottomSheet({
  visible,
  teamName,
  players,
  onAddPlayer,
  onClose,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />

      <Animated.View
        style={[
          styles.sheetContainer,
          { paddingBottom: insets.bottom + 8, transform: [{ translateY }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{teamName}</Text>
          <Text style={styles.sheetSubtitle}>
            {t('roomLobby.playersAdded', { count: players.length })}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Player list */}
        <ScrollView
          style={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
        >
          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={36}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>{t('roomLobby.noPlayers')}</Text>
            </View>
          ) : (
            players.map((p, idx) => (
              <View
                key={p._id}
                style={[
                  styles.sheetPlayerRow,
                  idx === players.length - 1 && styles.sheetPlayerRowLast,
                ]}
              >
                <View style={styles.sheetPlayerIndex}>
                  <Text style={styles.sheetPlayerIndexText}>{idx + 1}</Text>
                </View>
                <View style={styles.sheetPlayerInfo}>
                  <Text style={styles.sheetPlayerName}>{p.name}</Text>
                  <Text style={styles.sheetPlayerRole}>
                    {p.playingRole.replace(/_/g, ' ')}
                  </Text>
                </View>
                <View style={styles.sheetBadges}>
                  {p.isCaptain && (
                    <View style={styles.sheetBadge}>
                      <Text style={styles.sheetBadgeText}>C</Text>
                    </View>
                  )}
                  {p.isWicketKeeper && (
                    <View style={[styles.sheetBadge, styles.sheetBadgeWK]}>
                      <Text style={styles.sheetBadgeText}>WK</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Player button */}
        <TouchableOpacity
          onPress={onAddPlayer}
          style={styles.sheetAddBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={18} color={Colors.white} />
          <Text style={styles.sheetAddBtnText}>{t('roomLobby.add')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function RoomLobbyScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { roomId } = route.params;
  const { room, fetchRoomById, isLoading } = useRooms();

  // Bottom sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetTeam, setSheetTeam] = useState<PlayerTeam>('team_a');

  // ── Socket setup ──────────────────────────────────────────────────────────
  const mountedRef = useRef(true);
  const [socketToken, setSocketToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    getTokens().then(({ accessToken }) => {
      if (mountedRef.current && accessToken) {
        setSocketToken(accessToken);
      }
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { isConnected, joinRoom, leaveRoom } = useSocket({
    token: socketToken,
    autoConnect: true,
  });

  // Join the socket room and attach refresh listeners
  useEffect(() => {
    if (!isConnected) return;

    joinRoom({ roomId });

    const handleRoomUpdate = () => {
      if (mountedRef.current) fetchRoomById(roomId);
    };

    socketService.on(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdate);
    socketService.on(SOCKET_EVENTS.ROOM_USER_JOINED, handleRoomUpdate);
    socketService.on(SOCKET_EVENTS.ROOM_USER_LEFT, handleRoomUpdate);

    return () => {
      leaveRoom({ roomId });
      socketService.off(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdate);
      socketService.off(SOCKET_EVENTS.ROOM_USER_JOINED, handleRoomUpdate);
      socketService.off(SOCKET_EVENTS.ROOM_USER_LEFT, handleRoomUpdate);
    };
  }, [isConnected, roomId, joinRoom, leaveRoom, fetchRoomById]);

  // Initial fetch
  useEffect(() => {
    fetchRoomById(roomId);
  }, [roomId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!room) return;
    await Share.share({
      message: t('roomLobby.shareMessage', { code: room.roomCode, name: room.name }),
    });
  };

  const handleOpenSheet = (team: PlayerTeam) => {
    setSheetTeam(team);
    setSheetVisible(true);
  };

  const handleSheetAddPlayer = () => {
    setSheetVisible(false);
    navigation.navigate('AddPlayers', { roomId, team: sheetTeam });
  };

  // room.match may be a populated Match object or a plain string ID
  const matchId: string | undefined =
    room?.match == null
      ? undefined
      : typeof room.match === 'string'
      ? room.match
      : room.match._id;

  const matchObj = typeof room?.match === 'object' ? room.match : null;

  const handleStartToss = () => {
    if (!matchId) return;
    navigation.navigate('Toss', {
      matchId,
      roomId,
      teamAName: room!.teamAName,
      teamBName: room!.teamBName,
    });
  };

  // Players come from the populated match object returned by fetch-by-ID
  const teamAPlayers: Player[] =
    matchObj?.teamA?.players ?? room?.teamA?.players ?? [];
  const teamBPlayers: Player[] =
    matchObj?.teamB?.players ?? room?.teamB?.players ?? [];

  const sheetPlayers = sheetTeam === 'team_a' ? teamAPlayers : teamBPlayers;
  const sheetTeamName =
    sheetTeam === 'team_a'
      ? room?.teamAName ?? t('roomLobby.teamA')
      : room?.teamBName ?? t('roomLobby.teamB');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <LoadingOverlay visible={isLoading && !room} />

      <ScreenHeader
        title={room?.name ?? t('roomLobby.title')}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => fetchRoomById(roomId)}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Room Code Card */}
        {room && (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>{t('roomLobby.roomCode')}</Text>
            <Text style={styles.codeValue}>{room.roomCode}</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Ionicons
                name="share-social-outline"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.shareText}>{t('roomLobby.share')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Socket status indicator */}
        <View style={styles.socketRow}>
          <View
            style={[
              styles.socketDot,
              {
                backgroundColor: isConnected
                  ? Colors.success
                  : Colors.textMuted,
              },
            ]}
          />
          <Text style={styles.socketLabel}>
            {isConnected ? t('roomLobby.liveUpdates') : t('roomLobby.connecting')}
          </Text>
        </View>

        {/* Match Info */}
        {room && (
          <View style={styles.infoCard}>
            <InfoRow label={t('roomLobby.format')}  value={room.matchFormat} />
            <InfoRow label={t('roomLobby.overs')}   value={`${room.totalOvers}`} />
            <InfoRow label={t('roomLobby.status')}  value={room.status} highlight />
            <InfoRow label={t('roomLobby.members')} value={`${room.members.length}`} />
          </View>
        )}

        {/* Teams */}
        <TeamSection
          title={room?.teamAName ?? t('roomLobby.teamA')}
          players={teamAPlayers}
          onAddPlayers={() => handleOpenSheet('team_a')}
          color={Colors.info}
          addLabel={t('roomLobby.add')}
        />
        <TeamSection
          title={room?.teamBName ?? t('roomLobby.teamB')}
          players={teamBPlayers}
          onAddPlayers={() => handleOpenSheet('team_b')}
          color={Colors.accent}
          addLabel={t('roomLobby.add')}
        />

        {/* CTA */}
        {room?.status === 'ready' || room?.status === 'waiting' ? (
          <TouchableOpacity
            onPress={handleStartToss}
            style={styles.tossBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.tossBtnText}>🪙 {t('roomLobby.startToss')}</Text>
          </TouchableOpacity>
        ) : room?.status === 'live' && matchId ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Scoring', { matchId, roomId })}
            style={styles.tossBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.tossBtnText}>🏏 {t('roomLobby.goToScoring')}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Bottom Sheet */}
      <TeamBottomSheet
        visible={sheetVisible}
        teamName={sheetTeamName}
        players={sheetPlayers}
        onAddPlayer={handleSheetAddPlayer}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          highlight && {
            color: Colors.success,
            fontWeight: FontWeight.semibold,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function TeamSection({
  title,
  players,
  onAddPlayers,
  color,
  addLabel,
}: {
  title: string;
  players: Player[];
  onAddPlayers: () => void;
  color: string;
  addLabel: string;
}) {
  return (
    <View style={styles.teamSection}>
      <View style={styles.teamHeader}>
        <View style={[styles.teamDot, { backgroundColor: color }]} />
        <Text style={styles.teamTitle}>{title}</Text>
        <Text style={styles.playerCount}>{players.length}/11</Text>
        <TouchableOpacity onPress={onAddPlayers} style={styles.addBtn}>
          <Ionicons
            name="person-add-outline"
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.addBtnText}>{addLabel}</Text>
        </TouchableOpacity>
      </View>
      {players.map(p => (
        <View key={p._id} style={styles.playerRow}>
          <Text style={styles.playerName}>{p.name}</Text>
          <View style={styles.playerMeta}>
            {p.isCaptain && <Text style={styles.badge}>C</Text>}
            {p.isWicketKeeper && <Text style={styles.badge}>WK</Text>}
            <Text style={styles.playerRole}>
              {p.playingRole.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.lg },

  // Room code
  codeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  codeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  codeValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: 4,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  shareText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // Socket indicator
  socketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: -4,
  },
  socketDot: { width: 7, height: 7, borderRadius: 4 },
  socketLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Info card
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, color: Colors.text },

  // Team section
  teamSection: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 8,
  },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  teamTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  playerCount: { fontSize: FontSize.sm, color: Colors.textMuted },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  playerName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  playerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    backgroundColor: Colors.accent + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  playerRole: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },

  // Toss / Scoring button
  tossBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tossBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },

  // ── Bottom Sheet ────────────────────────────────────────────────────────
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 12,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.cardBorder,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 8,
  },
  sheetTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  sheetSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  sheetCloseBtn: { padding: 4 },
  sheetScroll: { maxHeight: 320 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: 10,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  sheetPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 12,
  },
  sheetPlayerRowLast: { borderBottomWidth: 0 },
  sheetPlayerIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPlayerIndexText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  sheetPlayerInfo: { flex: 1 },
  sheetPlayerName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  sheetPlayerRole: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  sheetBadges: { flexDirection: 'row', gap: 4 },
  sheetBadge: {
    backgroundColor: Colors.accent + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sheetBadgeWK: { backgroundColor: Colors.info + '22' },
  sheetBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  sheetAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: 14,
  },
  sheetAddBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
