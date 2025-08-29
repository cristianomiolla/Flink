import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
  deleted_at: string | null
}

export interface MessageWithProfiles {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
  deleted_at: string | null
  sender: {
    user_id: string
    full_name: string
    username: string
    avatar_url: string | null
  }
  receiver: {
    user_id: string
    full_name: string
    username: string
    avatar_url: string | null
  }
}

export interface ConversationThread {
  id: string
  participant: {
    user_id: string
    name: string
    username: string
    avatar: string | null
  }
  lastMessage: string
  timestamp: string
  unreadCount: number
  isFromCurrentUser: boolean
}

export function useMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationThread[]>([])
  const [messages, setMessages] = useState<MessageWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch conversation threads for current user
  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Get all messages where user is sender or receiver
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read,
          deleted_at,
          sender:profiles!messages_sender_id_fkey(
            user_id,
            full_name,
            username,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey(
            user_id,
            full_name,
            username,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (messagesError) {
        throw messagesError
      }

      const typedMessages = messagesData as unknown as MessageWithProfiles[]

      // Group messages into conversation threads
      const conversationMap = new Map<string, ConversationThread>()
      
      typedMessages.forEach(message => {
        // Determine the other participant (not current user)
        const isFromCurrentUser = message.sender_id === user.id
        const otherParticipant = isFromCurrentUser ? message.receiver : message.sender
        const conversationKey = isFromCurrentUser 
          ? `${user.id}-${message.receiver_id}`
          : `${message.sender_id}-${user.id}`

        // Check if this conversation thread already exists
        if (!conversationMap.has(conversationKey)) {
          // Count unread messages for this conversation
          const unreadCount = typedMessages.filter(m => 
            m.sender_id === otherParticipant.user_id && 
            m.receiver_id === user.id && 
            !m.is_read
          ).length

          conversationMap.set(conversationKey, {
            id: conversationKey,
            participant: {
              user_id: otherParticipant.user_id,
              name: otherParticipant.full_name || otherParticipant.username || 'Unknown User',
              username: otherParticipant.username || '',
              avatar: otherParticipant.avatar_url
            },
            lastMessage: message.content,
            timestamp: message.created_at,
            unreadCount,
            isFromCurrentUser
          })
        }
      })

      setConversations(Array.from(conversationMap.values()))
      setMessages(typedMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch messages for a specific conversation
  const fetchConversationMessages = useCallback(async (participantId: string): Promise<MessageWithProfiles[]> => {
    if (!user) return []

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read,
          deleted_at,
          sender:profiles!messages_sender_id_fkey(
            user_id,
            full_name,
            username,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey(
            user_id,
            full_name,
            username,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user?.id})`)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (messagesError) {
        throw messagesError
      }

      return messagesData as unknown as MessageWithProfiles[]
    } catch (err) {
      console.error('Error fetching conversation messages:', err)
      return []
    }
  }, [user?.id])

  // Send a new message
  const sendMessage = useCallback(async (receiverId: string, content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim()
        }])
        .select()

      if (error) {
        throw error
      }

      // Refresh conversations after sending
      await fetchConversations()
      return true
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      return false
    }
  }, [user, fetchConversations])

  // Mark messages as read
  const markConversationAsRead = async (senderId: string): Promise<void> => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) {
        throw error
      }

      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.participant.user_id === senderId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ))
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }

  // Soft delete a conversation
  const deleteConversation = async (participantId: string): Promise<void> => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)

      if (error) {
        throw error
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.participant.user_id !== participantId))
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
    }
  }

  // Get unread message count
  const getUnreadCount = (): number => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0)
  }

  useEffect(() => {
    fetchConversations()
  }, [user])

  return {
    conversations,
    messages,
    loading,
    error,
    sendMessage,
    fetchConversationMessages,
    markConversationAsRead,
    deleteConversation,
    getUnreadCount,
    refreshConversations: fetchConversations
  }
}