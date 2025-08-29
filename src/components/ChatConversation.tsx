import { useState, useEffect } from 'react'
import './ChatConversation.css'
import { Avatar } from './Avatar'
import { ActionButton } from './ActionButton'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../hooks/useAuth'

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
      avatar?: string
    }
    lastMessage: string
    timestamp: string
    unreadCount: number
  } | null
  isVisible: boolean
}

export function ChatConversation({ chat, isVisible }: ChatConversationProps) {
  const { user } = useAuth()
  const { fetchConversationMessages, sendMessage } = useMessages()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  // Extract participant ID from chat ID (format: "userId1__userId2")
  const getParticipantId = (chatId: string): string | null => {
    if (!user) return null
    const [userId1, userId2] = chatId.split('__')
    return userId1 === user.id ? userId2 : userId1
  }

  // Fetch conversation messages when chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chat || !user) {
        setMessages([])
        return
      }

      const participantId = getParticipantId(chat.id)
      if (!participantId) return

      setLoading(true)
      try {
        const conversationMessages = await fetchConversationMessages(participantId)
        
        // Convert to local Message format
        const formattedMessages: Message[] = conversationMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          isFromCurrentUser: msg.sender_id === user.id
        }))
        
        setMessages(formattedMessages)
      } catch (error) {
        console.error('Error loading conversation messages:', error)
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [chat?.id, user?.id, fetchConversationMessages])

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || !user) return

    const participantId = getParticipantId(chat.id)
    if (!participantId) return

    try {
      const success = await sendMessage(participantId, newMessage.trim())
      if (success) {
        setNewMessage('')
        
        // Add the new message to local state immediately for better UX
        const newMsg: Message = {
          id: Date.now().toString(), // Temporary ID
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
          isFromCurrentUser: true
        }
        setMessages(prev => [...prev, newMsg])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isVisible || !chat) {
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
      <div className="conversation-header">
        <div className="conversation-participant">
          <Avatar
            src={chat.participant.avatar}
            name={chat.participant.name}
            alt={`Avatar di ${chat.participant.name}`}
            size="sm"
            variant="default"
          />
          <h2 className="participant-name">{chat.participant.name}</h2>
        </div>
        <div className="conversation-actions">
          <button className="header-icon-btn" title="Info conversazione">
            <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        <div className="messages-list">
          {loading ? (
            <div className="loading-messages">
              <p>Caricamento messaggi...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-messages">
              <p>Nessun messaggio ancora. Inizia la conversazione!</p>
            </div>
          ) : (
            messages.map((message) => (
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
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
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
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            title="Invia messaggio"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}