/**
 * Utilities for handling message functionality
 */

/**
 * Generate a consistent conversation ID between two users
 * Always puts the smaller user ID first for consistency
 * Uses __ as separator to avoid conflicts with UUID hyphens
 */
export const generateConversationId = (currentUserId: string, otherUserId: string): string => {
  const ids = [currentUserId, otherUserId].sort()
  return `${ids[0]}__${ids[1]}`
}

/**
 * Extract participant ID from a conversation ID
 */
export const getParticipantIdFromConversation = (conversationId: string, currentUserId: string): string | null => {
  const [userId1, userId2] = conversationId.split('__')
  return userId1 === currentUserId ? userId2 : userId1
}