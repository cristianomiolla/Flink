import { useState, useEffect } from 'react'
import './ChatConversation.css'
import './HeaderIcons.css'
import { Avatar } from './Avatar'
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
      avatar?: string | null
    }
    lastMessage: string
    timestamp: string
    unreadCount: number
  } | null
  isVisible: boolean
  onRequestDeleteChat?: (chat: { id: string; participant: { name: string } }) => void
  sendMessage?: (receiverId: string, content: string) => Promise<boolean>
  fetchConversationMessages?: (participantId: string) => Promise<Message[]>
}

export function ChatConversation({ chat, isVisible, onRequestDeleteChat, sendMessage: propSendMessage, fetchConversationMessages: propFetchConversationMessages }: ChatConversationProps) {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  // Extract participant ID from chat ID (format: "userId1__userId2")
  const getParticipantId = (chatId: string): string | null => {
    if (!user) return null
    const [userId1, userId2] = chatId.split('__')
    return userId1 === user.id ? userId2 : userId1
  }

  // Reset messages when chat becomes null or changes
  useEffect(() => {
    if (!chat) {
      setMessages([])
      setNewMessage('')
      setLoading(false)
      return
    }

    const loadMessages = async () => {
      const participantId = getParticipantId(chat.id)
      if (!participantId || !propFetchConversationMessages) return

      setLoading(true)
      try {
        const conversationMessages = await propFetchConversationMessages(participantId)
        
        // Convert to local Message format
        const formattedMessages: Message[] = conversationMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          isFromCurrentUser: msg.sender_id === user?.id
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
  }, [chat?.id, user?.id, propFetchConversationMessages])

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

    try {
      // Add the new message to local state immediately for better UX
      const tempMessage: Message = {
        id: Date.now().toString(), // Temporary ID
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isFromCurrentUser: true
      }
      setMessages(prev => [...prev, tempMessage])
      setNewMessage('')

      const success = await propSendMessage(participantId, newMessage.trim())
      
      if (!success) {
        // If send failed, remove the temporary message
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
        setNewMessage(newMessage.trim()) // Restore message
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temporary message on error
      setMessages(prev => prev.filter(m => m.id === Date.now().toString()))
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
          <button 
            className="header-icon-btn delete-chat-btn" 
            title="Elimina conversazione"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleDeleteChat()
            }}
          >
            <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
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
            className={`header-icon-btn send-button ${!newMessage.trim() ? 'disabled' : ''}`}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            title="Invia messaggio"
          >
            <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}