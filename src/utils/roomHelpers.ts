import type { Room, Match, User } from '../types';

/** Resolve room.match — may be a populated Match object or a plain ID string */
export function resolveMatchId(match: string | Match | undefined): string | null {
  if (!match) return null;
  return typeof match === 'string' ? match : match._id;
}

/**
 * Returns true if userId is the room creator or any registered member.
 * Participants should see ScoringScreen on live matches; spectators see LiveViewer.
 */
export function isRoomParticipant(room: Room, userId: string | undefined): boolean {
  if (!userId) return false;
  const creatorId =
    typeof room.creator === 'string' ? room.creator : (room.creator as User)._id;
  if (creatorId === userId) return true;
  return room.members.some((m) => {
    const mId = typeof m.user === 'string' ? m.user : (m.user as User)._id;
    return mId === userId;
  });
}
