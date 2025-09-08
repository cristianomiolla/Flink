/**
 * Shared date formatting utilities
 * Consolidates duplicate timestamp formatting functions across components
 */

/**
 * Format timestamp for chat list display
 * Shows relative time (e.g., "2m fa", "1h fa") or date for older messages
 */
export const formatChatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSeconds < 60) {
    return 'ora'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m fa`
  } else if (diffInHours < 24) {
    return `${diffInHours}h fa`
  } else if (diffInDays === 1) {
    return 'ieri'
  } else if (diffInDays < 7) {
    return `${diffInDays} giorni fa`
  } else {
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
  }
}

/**
 * Format timestamp for individual message display
 * Shows time in HH:mm format
 */
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('it-IT', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Format timestamp for message grouping
 * Returns date string for grouping messages by day
 */
export const formatMessageDate = (timestamp: string): string => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Oggi'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ieri'
  } else {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    })
  }
}