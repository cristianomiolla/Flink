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

      // First, get user's deleted conversations
      const { data: deletedConversations, error: deletedError } = await supabase
        .from('user_conversation_deletions')
        .select('participant_id')
        .eq('user_id', user.id)

      if (deletedError && deletedError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching deleted conversations:', deletedError)
      }

      const deletedParticipantIds = new Set(
        deletedConversations?.map(d => d.participant_id) || []
      )

      // Get all messages for current user
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (messagesError) {
        console.error('Supabase query error:', messagesError)
        throw messagesError
      }

      const typedMessages = messagesData as Message[]

      if (typedMessages.length === 0) {
        setConversations([])
        setMessages([])
        return
      }

      // Filter out messages from deleted conversations
      const filteredMessages = typedMessages.filter(message => {
        const participantId = message.sender_id === user.id ? message.receiver_id : message.sender_id
        return !deletedParticipantIds.has(participantId)
      })

      if (filteredMessages.length === 0) {
        setConversations([])
        setMessages([])
        return
      }

      // Collect unique participant IDs to fetch their profiles (including current user)
      const participantIds = new Set<string>()
      participantIds.add(user.id) // Add current user
      filteredMessages.forEach(message => {
        participantIds.add(message.sender_id)
        participantIds.add(message.receiver_id)
      })

      // Fetch profile data for all participants
      const profilesMap = new Map<string, { user_id: string; full_name: string; username: string; avatar_url: string | null }>()
      if (participantIds.size > 0) {
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, avatar_url')
            .in('user_id', Array.from(participantIds))
          
          if (!profilesError && profilesData) {
            profilesData.forEach(profile => {
              profilesMap.set(profile.user_id, profile)
            })
          }
        } catch (err) {
          console.warn('Could not fetch profile data, using fallback names:', err)
        }
      }

      // Create conversation structure with profile data
      const conversationMap = new Map<string, ConversationThread>()
      
      filteredMessages.forEach(message => {
        // Determine the other participant (not current user)
        const isFromCurrentUser = message.sender_id === user.id
        const otherParticipantId = isFromCurrentUser ? message.receiver_id : message.sender_id

        // Use consistent conversation ID generation (alphabetical order)
        const participants = [user.id, otherParticipantId].sort()
        const conversationKey = `${participants[0]}__${participants[1]}`

        // Check if this conversation thread already exists
        if (!conversationMap.has(conversationKey)) {
          // Count unread messages for this conversation
          const unreadCount = filteredMessages.filter(m => 
            m.sender_id === otherParticipantId && 
            m.receiver_id === user.id && 
            !m.is_read
          ).length

          // Get profile data for the participant
          const participantProfile = profilesMap.get(otherParticipantId)
          const participantName = participantProfile?.full_name || 
                                 participantProfile?.username || 
                                 `User ${otherParticipantId.slice(0, 8)}`

          conversationMap.set(conversationKey, {
            id: conversationKey,
            participant: {
              user_id: otherParticipantId,
              name: participantName,
              username: participantProfile?.username || '',
              avatar: participantProfile?.avatar_url || null
            },
            lastMessage: message.content,
            timestamp: message.created_at,
            unreadCount,
            isFromCurrentUser
          })
        }
      })

      const newConversations = Array.from(conversationMap.values())
      setConversations(newConversations)
      // Convert to MessageWithProfiles format with actual profile data
      const messagesWithProfiles = filteredMessages.map(message => {
        const senderProfile = profilesMap.get(message.sender_id)
        const receiverProfile = profilesMap.get(message.receiver_id)
        
        return {
          id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          created_at: message.created_at,
          is_read: message.is_read,
          deleted_at: null,
          sender: {
            user_id: message.sender_id,
            full_name: senderProfile?.full_name || senderProfile?.username || `User ${message.sender_id.slice(0, 8)}`,
            username: senderProfile?.username || '',
            avatar_url: senderProfile?.avatar_url || null
          },
          receiver: {
            user_id: message.receiver_id,
            full_name: receiverProfile?.full_name || receiverProfile?.username || `User ${message.receiver_id.slice(0, 8)}`,
            username: receiverProfile?.username || '',
            avatar_url: receiverProfile?.avatar_url || null
          }
        }
      })
      setMessages(messagesWithProfiles)
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
      // First, check if this conversation has been deleted by the user
      const { data: deletedConversations, error: deletedError } = await supabase
        .from('user_conversation_deletions')
        .select('participant_id')
        .eq('user_id', user.id)
        .eq('participant_id', participantId)

      if (deletedError && deletedError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking deleted conversations:', deletedError)
      }

      // If conversation was deleted by this user, return empty array
      if (deletedConversations && deletedConversations.length > 0) {
        return []
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user?.id})`)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (messagesError) {
        throw messagesError
      }

      const typedMessages = messagesData as Message[]

      if (typedMessages.length === 0) {
        return []
      }

      // Fetch profile data for participants in this conversation
      const participantIds = [user.id, participantId]
      const profilesMap = new Map<string, { user_id: string; full_name: string; username: string; avatar_url: string | null }>()
      
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', participantIds)

        if (!profilesError && profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.user_id, profile)
          })
        }
      } catch (err) {
        console.warn('Could not fetch profile data for conversation, using fallback names:', err)
      }

      // Convert to MessageWithProfiles format with actual profile data
      const messagesWithProfiles = typedMessages.map(message => {
        const senderProfile = profilesMap.get(message.sender_id)
        const receiverProfile = profilesMap.get(message.receiver_id)
        
        return {
          id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          created_at: message.created_at,
          is_read: message.is_read,
          deleted_at: null,
          sender: {
            user_id: message.sender_id,
            full_name: senderProfile?.full_name || senderProfile?.username || `User ${message.sender_id.slice(0, 8)}`,
            username: senderProfile?.username || '',
            avatar_url: senderProfile?.avatar_url || null
          },
          receiver: {
            user_id: message.receiver_id,
            full_name: receiverProfile?.full_name || receiverProfile?.username || `User ${message.receiver_id.slice(0, 8)}`,
            username: receiverProfile?.username || '',
            avatar_url: receiverProfile?.avatar_url || null
          }
        }
      })

      return messagesWithProfiles
    } catch (err) {
      console.error('Error fetching conversation messages:', err)
      return []
    }
  }, [user])

  // Update conversation locally after sending a message (avoid full refresh)
  const updateConversationAfterSend = useCallback(async (receiverId: string, content: string) => {
    if (!user) return

    try {
      // Check if conversation already exists
      const participants = [user.id, receiverId].sort()
      const conversationKey = `${participants[0]}__${participants[1]}`
      const existingConv = conversations.find(conv => conv.id === conversationKey)

      if (existingConv) {
        // Update existing conversation
        setConversations(prev => prev.map(conv => 
          conv.id === conversationKey 
            ? { 
                ...conv, 
                lastMessage: content,
                timestamp: new Date().toISOString(),
                isFromCurrentUser: true
              }
            : conv
        ))
      } else {
        // Try to fetch profile for the receiver to create new conversation
        let participantProfile = null
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, avatar_url')
            .eq('user_id', receiverId)
            .single()

          if (!profileError && profileData) {
            participantProfile = profileData
          }
        } catch (err) {
          console.warn('Could not fetch receiver profile:', err)
        }

        // Create new conversation
        const newConversation: ConversationThread = {
          id: conversationKey,
          participant: {
            user_id: receiverId,
            name: participantProfile?.full_name || 
                  participantProfile?.username || 
                  `User ${receiverId.slice(0, 8)}`,
            username: participantProfile?.username || '',
            avatar: participantProfile?.avatar_url || null
          },
          lastMessage: content,
          timestamp: new Date().toISOString(),
          unreadCount: 0,
          isFromCurrentUser: true
        }

        setConversations(prev => [newConversation, ...prev])
      }
    } catch (err) {
      console.error('Error updating conversation locally:', err)
    }
  }, [user, conversations])

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

      if (error) {
        throw error
      }

      // Instead of full refresh, just add/update the conversation locally
      await updateConversationAfterSend(receiverId, content.trim())
      return true
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      return false
    }
  }, [user, updateConversationAfterSend])

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

  // Soft delete a conversation (user-specific)
  const deleteConversation = async (participantId: string): Promise<void> => {
    if (!user) return

    try {
      // Insert or update user_conversation_deletions record
      const { error } = await supabase
        .from('user_conversation_deletions')
        .upsert({
          user_id: user.id,
          participant_id: participantId,
          deleted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,participant_id'
        })

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