import { useState, useEffect, useCallback, useRef } from 'react'
import './ChatConversation.css'
import { Avatar } from './Avatar'
import { useAuth } from '../hooks/useAuth'
import { type Message as DatabaseMessage } from '../hooks/useMessages'
import { ActionButton, DeleteIcon, SendIcon } from './ActionButton'
import { BookingRequestCard } from './BookingRequestCard'
import { BookingProgressTracker } from './BookingProgressTracker'
import { useBookingStatus } from '../hooks/useBookingStatus'
import { supabase } from '../lib/supabase'

// Helper function to parse booking request message
const parseBookingRequestMessage = (content: string) => {
  try {
    const parsed = JSON.parse(content)
    if (parsed.type === 'booking_request' && parsed.booking_data) {
      return {
        booking_id: parsed.booking_id,
        booking_data: parsed.booking_data
      }
    }
  } catch {
    return null
  }
  return null
}

// PinnedActionButton component
interface PinnedActionButtonProps {
  participantId: string | null
  participantName: string
  onOpenArtistAppointment?: (participantId: string, participantName: string) => void
}

function PinnedActionButton({ participantId, participantName, onOpenBookingRequest, onOpenArtistAppointment }: PinnedActionButtonProps & { onOpenBookingRequest?: (participantId?: string) => void; onOpenArtistAppointment?: (participantId: string, participantName: string) => void }) {
  const { user, profile } = useAuth()
  
  if (!user || !profile || !participantId) return null

  const isArtist = profile.profile_type === 'artist'
  const buttonText = isArtist ? '📅 FISSA APPUNTAMENTO' : '📝 INVIA UNA RICHIESTA'

  const handleClick = () => {
    
    if (isArtist) {
      // Artist wants to set an appointment
      if (onOpenArtistAppointment) {
        onOpenArtistAppointment(participantId, participantName)
      }
      return
    }
    
    if (onOpenBookingRequest) {
      onOpenBookingRequest(participantId)
    } else {
      // Placeholder for now - will implement booking logic later
    }
  }

  return (
    <button className="pinned-action-btn" onClick={handleClick}>
      {buttonText}
    </button>
  )
}

interface Message {
  id: string
  content: string
  timestamp: string
  isFromCurrentUser: boolean
}

interface ChatConversationProps {
  chat?: {
    id: string
    participant: {
      name: string
      avatar?: string | null
    }
    lastMessage: string
    timestamp: string
    unreadCount: number
  } | null
  onRequestDeleteChat?: (chat: { id: string; participant: { name: string } }) => void
  sendMessage?: (receiverId: string, content: string) => Promise<boolean>
  fetchConversationMessages?: (participantId: string) => Promise<DatabaseMessage[]>
  hideHeaderAndInput?: boolean
  isModalOpen?: boolean
  onOpenBookingRequest?: (participantId?: string) => void
  onOpenArtistAppointment?: (participantId: string, participantName: string) => void
  onBookingRequestSent?: () => void
  onBookingStatusRefresh?: (refreshFn: () => Promise<void>) => void
}

export function ChatConversation({ chat, onRequestDeleteChat, sendMessage: propSendMessage, fetchConversationMessages: propFetchConversationMessages, hideHeaderAndInput = false, onOpenBookingRequest, onOpenArtistAppointment, onBookingStatusRefresh }: ChatConversationProps) {
  const { user, profile } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const messagesListRef = useRef<HTMLDivElement>(null)

  // Extract participant ID from chat ID (format: "userId1__userId2")
  const getParticipantId = useCallback((chatId: string): string | null => {
    if (!user) return null
    const [userId1, userId2] = chatId.split('__')
    return userId1 === user.id ? userId2 : userId1
  }, [user])

  // Get participant ID for booking status
  const participantId = chat ? getParticipantId(chat.id) : null
  const { bookingData, showProgressTracker, showPinnedAction, refreshBookingStatus } = useBookingStatus(participantId)

  // Pass refresh function to parent component
  useEffect(() => {
    if (onBookingStatusRefresh) {
      onBookingStatusRefresh(refreshBookingStatus)
    }
  }, [refreshBookingStatus, onBookingStatusRefresh])


  // Scroll to bottom of messages list
  const scrollToBottom = useCallback(() => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight
    }
  }, [])


  // Reset messages when chat becomes null or changes
  useEffect(() => {
    if (!chat) {
      setMessages([])
      setNewMessage('')
      setLoading(false)
      return
    }

    // Local function to get participant ID
    const getLocalParticipantId = (chatId: string): string | null => {
      if (!user) return null
      const [userId1, userId2] = chatId.split('__')
      return userId1 === user.id ? userId2 : userId1
    }

    // Local function to scroll to bottom
    const localScrollToBottom = () => {
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight
      }
    }

    // Local function to load messages
    const localLoadMessages = async (showLoading = true) => {
      if (!chat || !propFetchConversationMessages) return

      const participantId = getLocalParticipantId(chat.id)
      if (!participantId) return

      if (showLoading) setLoading(true)
      try {
        const conversationMessages = await propFetchConversationMessages(participantId)

        // Convert to local Message format
        const formattedMessages: Message[] = conversationMessages.map((msg: DatabaseMessage) => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          isFromCurrentUser: msg.sender_id === user?.id
        }))

        // Only update if messages have actually changed
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(formattedMessages)) {
            // Schedule scroll to bottom after state update
            setTimeout(() => localScrollToBottom(), 100)
            return formattedMessages
          }
          return prevMessages
        })
      } catch (error) {
        console.error('Error loading conversation messages:', error)
        setMessages([])
      } finally {
        if (showLoading) setLoading(false)
      }
    }

    // Load initial messages
    localLoadMessages(true)

    // Scroll to bottom when conversation first loads
    setTimeout(() => localScrollToBottom(), 200)

    // Setup real-time subscription for this specific conversation
    const participantId = getLocalParticipantId(chat.id)
    if (!user || !participantId) return

    const channel = supabase
      .channel('global-messages')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const messageData = payload.payload

        if (!messageData) return

        // Check if message is relevant to this conversation
        const isRelevant = (messageData.sender_id === user.id && messageData.receiver_id === participantId) ||
                          (messageData.sender_id === participantId && messageData.receiver_id === user.id)

        if (!isRelevant) return

        // Convert to local Message format
        const formattedMessage: Message = {
          id: messageData.id,
          content: messageData.content,
          timestamp: messageData.created_at,
          isFromCurrentUser: messageData.sender_id === user.id
        }

        // Add message to the current conversation
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === formattedMessage.id)) {
            return prev
          }

          const newMessages = [...prev, formattedMessage]
          // Schedule scroll to bottom after state update
          setTimeout(() => localScrollToBottom(), 100)
          return newMessages
        })
      })
      .subscribe()

    // Cleanup subscription when chat changes
    return () => {
      supabase.removeChannel(channel)
    }
  }, [chat?.id, user?.id])


  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || !user || !propSendMessage) return

    const participantId = getParticipantId(chat.id)
    if (!participantId) return

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately

    try {
      const success = await propSendMessage(participantId, messageContent)
      
      if (success) {
        // Add message to local state immediately for instant feedback
        const newMessage: Message = {
          id: `temp_${Date.now()}`, // Temporary ID
          content: messageContent,
          timestamp: new Date().toISOString(),
          isFromCurrentUser: true
        }
        
        setMessages(prev => [...prev, newMessage])
        
        // Ensure scroll to bottom after sending message
        setTimeout(() => scrollToBottom(), 50)
      } else {
        // If send failed, restore the message to input
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore message to input on error
      setNewMessage(messageContent)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteChat = () => {
    if (chat && onRequestDeleteChat) {
      onRequestDeleteChat({
        id: chat.id,
        participant: { name: chat.participant.name }
      })
    }
  }

  const handleOpenArtistAppointment = (participantId: string, participantName: string) => {
    if (onOpenArtistAppointment) {
      onOpenArtistAppointment(participantId, participantName)
    }
  }

  if (!chat) {
    return (
      <div className="chat-conversation empty">
        <div className="empty-conversation">
          <div className="empty-conversation-icon">💬</div>
          <h3 className="empty-conversation-title">Seleziona una conversazione</h3>
          <p className="empty-conversation-text">
            Scegli una chat dalla lista per iniziare a messaggiare
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-conversation">
      {/* Chat Header */}
      {!hideHeaderAndInput && (
        <div className="conversation-header">
          <div className="conversation-participant">
            <Avatar
              src={chat.participant.avatar}
              name={chat.participant.name}
              alt={`Avatar di ${chat.participant.name}`}
              size="sm"
              variant="default"
            />
            <h2 className="participant-name">{chat.participant.name || 'Nome non disponibile'}</h2>
          </div>
          <div className="conversation-actions">
            <ActionButton
              icon={<DeleteIcon />}
              text="Elimina"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleDeleteChat()
              }}
              className="delete-chat-action"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        <div className="messages-list" ref={messagesListRef}>
          {/* Conditional rendering: Pinned Action Button OR Progress Tracker */}
          {chat && showPinnedAction && (
            <div className="pinned-action-container">
              <PinnedActionButton 
                participantId={getParticipantId(chat.id)}
                participantName={chat.participant.name}
                onOpenBookingRequest={onOpenBookingRequest}
                onOpenArtistAppointment={handleOpenArtistAppointment}
              />
            </div>
          )}
          
          {chat && showProgressTracker && bookingData && profile && (
            <BookingProgressTracker
              status={bookingData.status}
              userType={profile.profile_type}
            />
          )}

          {loading ? (
            <div className="loading-messages">
              <p>Caricamento messaggi...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-messages">
              <p>Nessun messaggio ancora. Inizia la conversazione!</p>
            </div>
          ) : (
            messages.map((message) => {
              const bookingData = parseBookingRequestMessage(message.content)
              
              if (bookingData) {
                // Render BookingRequestCard for booking request messages
                return (
                  <BookingRequestCard
                    key={message.id}
                    bookingData={{
                      ...bookingData.booking_data,
                      created_at: message.timestamp
                    }}
                    bookingId={bookingData.booking_id}
                    isFromCurrentUser={message.isFromCurrentUser}
                    timestamp={message.timestamp}
                  />
                )
              } else {
                // Render normal message
                return (
                  <div
                    key={message.id}
                    className={`message ${message.isFromCurrentUser ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">
                      <p className="message-content">{message.content}</p>
                      <span className="message-time">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              }
            })
          )}
        </div>
      </div>

      {/* Message Input */}
      {!hideHeaderAndInput && (
        <div className="message-input-container">
          <div className="message-input-wrapper">
            <textarea
              className="message-input"
              placeholder="Scrivi un messaggio..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />
            <ActionButton
              icon={<SendIcon />}
              text="Invia"
              variant="secondary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="send-message-action"
            />
          </div>
        </div>
      )}

    </div>
  )
}