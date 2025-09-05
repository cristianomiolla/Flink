import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './MessagesPage.css'
import { SearchBar } from './SearchBar'
import { ChatList } from './ChatList'
import { ChatConversation } from './ChatConversation'
import { Avatar } from './Avatar'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../hooks/useAuth'
import { generateConversationId } from '../lib/messageUtils'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'
import { ConfirmationOverlay } from './ConfirmationOverlay'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

// Hook to detect if we're on mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}


interface Chat {
  id: string
  participant: {
    name: string
    avatar?: string | null
  }
  lastMessage: string
  timestamp: string
  unreadCount: number
}

export function MessagesPage() {
  const { artistId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  
  const handleLogoClick = () => navigate('/')
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)

  // Same timestamp formatting as desktop ChatList
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 48) {
      return 'Ieri'
    } else {
      return date.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const handleAuthRequired = useCallback(() => {
    setShowAuthOverlay(true)
  }, [])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  const { conversations, loading, error, deleteConversation, markConversationAsRead, sendMessage, fetchConversationMessages } = useMessages()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [newChatArtist, setNewChatArtist] = useState<{id: string, name: string, avatar?: string} | null>(null)
  const [chatToDelete, setChatToDelete] = useState<{id: string, participantName: string} | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [conversationMessages, setConversationMessages] = useState<Array<{
    id: string
    content: string
    timestamp: string
    isFromCurrentUser: boolean
  }>>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const mobileMessagesListRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom of mobile messages list
  const scrollToBottom = useCallback(() => {
    if (mobileMessagesListRef.current) {
      const element = mobileMessagesListRef.current
      
      // Try scrolling to the bottom anchor element
      const bottomAnchor = element.querySelector('#messages-bottom')
      if (bottomAnchor) {
        bottomAnchor.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' })
        
        // Add extra scroll to compensate for mobile padding
        setTimeout(() => {
          element.scrollTop = element.scrollTop + 80
        }, 10)
      } else {
        // Force maximum scroll
        element.scrollTop = element.scrollHeight
      }
    }
  }, [])
  
  // Convert Supabase conversations to Chat format for existing components
  const chats: Chat[] = conversations.map(conv => ({
    id: conv.id,
    participant: {
      name: conv.participant.name,
      avatar: conv.participant.avatar
    },
    lastMessage: conv.lastMessage,
    timestamp: conv.timestamp,
    unreadCount: conv.unreadCount
  }))

  // Function to fetch artist profile data
  const fetchArtistProfile = useCallback(async (artistUserId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .eq('user_id', artistUserId)
        .single()
      
      if (error) {
        console.error('Error fetching artist profile:', error)
        return
      }
      
      const artist = {
        id: artistUserId,
        name: profile?.full_name || profile?.username || 'Unknown Artist',
        avatar: profile?.avatar_url
      }
      
      if (user) {
        const conversationId = generateConversationId(user.id, artistUserId)
        setSelectedChatId(conversationId)
        setNewChatArtist(artist)
      }
    } catch (error) {
      console.error('Error fetching artist profile:', error)
    }
  }, [user])

  // Handle new conversation when artistId is in URL
  useEffect(() => {
    if (artistId && user) {
      // Generate the conversation ID
      const conversationId = generateConversationId(user.id, artistId)
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => conv.id === conversationId)
      
      if (existingConversation) {
        // Select existing conversation
        setSelectedChatId(conversationId)
        setNewChatArtist(null)
      } else {
        // Fetch artist profile for new conversation
        fetchArtistProfile(artistId)
      }
    }
  }, [artistId, user, conversations, fetchArtistProfile])

  // Update newChatArtist state when conversations change
  useEffect(() => {
    if (selectedChatId && newChatArtist) {
      // Check if the virtual chat now exists in the real conversations
      const existingConversation = conversations.find(conv => conv.id === selectedChatId)
      if (existingConversation) {
        // The virtual chat became real, clear newChatArtist
        setNewChatArtist(null)
      }
    }
  }, [conversations, selectedChatId, newChatArtist])

  // Load messages for mobile conversation view
  useEffect(() => {
    if (!isMobile || !artistId || !user || !fetchConversationMessages) {
      return
    }

    const loadConversationMessages = async (showLoading = true) => {
      if (showLoading) setLoadingMessages(true)
      try {
        const messages = await fetchConversationMessages(artistId)
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          isFromCurrentUser: msg.sender_id === user.id
        }))
        
        // Only update if messages have actually changed
        setConversationMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(formattedMessages)) {
            // Schedule scroll to bottom after state update
            requestAnimationFrame(() => {
              setTimeout(() => scrollToBottom(), 50)
            })
            return formattedMessages
          }
          return prevMessages
        })
      } catch (error) {
        console.error('Error loading conversation messages:', error)
        setConversationMessages([])
      } finally {
        if (showLoading) setLoadingMessages(false)
      }
    }

    // Load initial messages
    loadConversationMessages(true)
    
    // Scroll to bottom when conversation first loads
    requestAnimationFrame(() => {
      setTimeout(() => scrollToBottom(), 100)
    })

    // Set up polling for new messages every 3 seconds (without loading spinner)
    const interval = setInterval(() => {
      loadConversationMessages(false)
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [isMobile, artistId, user?.id, scrollToBottom]) // Rimossa fetchConversationMessages dalle dipendenze

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  

  // Determine the selected chat - existing or new
  let selectedChat = selectedChatId ? chats.find(chat => chat.id === selectedChatId) : null
  
  // Handle deleted chat cleanup with useEffect to avoid direct state mutation during render
  useEffect(() => {
    // If selectedChatId exists but no chat found AND no new chat artist, the chat was probably deleted
    if (selectedChatId && !selectedChat && !newChatArtist) {
      setSelectedChatId(null)
    }
  }, [selectedChatId, selectedChat, newChatArtist])
  
  // If no existing chat found but we have a new chat artist, create a virtual chat
  if (!selectedChat && newChatArtist && selectedChatId) {
    selectedChat = {
      id: selectedChatId,
      participant: {
        name: newChatArtist.name,
        avatar: newChatArtist.avatar
      },
      lastMessage: '',
      timestamp: new Date().toISOString(),
      unreadCount: 0
    }
  }

  const handleChatSelect = (chatId: string) => {
    // Find conversation first
    const conversation = conversations.find(conv => conv.id === chatId)
    
    // Mark conversation as read when selected (both mobile and desktop)
    if (conversation && conversation.unreadCount > 0) {
      markConversationAsRead(conversation.participant.user_id)
    }

    // On mobile, navigate to the conversation page instead of selecting locally
    if (isMobile) {
      if (conversation) {
        navigate(`/messages/${conversation.participant.user_id}`)
        return
      }
    }

    setSelectedChatId(chatId)
  }

  const handleRequestDeleteChat = (chat: { id: string; participant: { name: string } }) => {
    // Prevent event propagation to avoid immediate cancellation
    setTimeout(() => {
      setChatToDelete({
        id: chat.id,
        participantName: chat.participant.name
      })
    }, 0)
  }

  const handleConfirmDelete = async () => {
    if (chatToDelete) {
      try {
        // Find the conversation to get participant ID
        const conversation = conversations.find(conv => conv.id === chatToDelete.id)
        if (conversation) {
          // If the deleted chat was selected, clear selection FIRST
          if (selectedChatId === chatToDelete.id) {
            setSelectedChatId(null)
            setNewChatArtist(null)
          }
          
          await deleteConversation(conversation.participant.user_id)
        }
      } catch (err) {
        console.error('Failed to delete conversation:', err)
      }
    }
    setChatToDelete(null)
  }

  const handleCancelDelete = () => {
    setChatToDelete(null)
  }

  // Mobile message handling functions
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    let participantId: string
    if (selectedChat) {
      // Extract participant ID from chat ID
      const [userId1, userId2] = selectedChat.id.split('__')
      participantId = userId1 === user.id ? userId2 : userId1
    } else if (artistId) {
      // Direct conversation with artist
      participantId = artistId
    } else {
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately

    try {
      const success = await sendMessage(participantId, messageContent)
      
      if (success) {
        if (isMobile && fetchConversationMessages) {
          // Wait a moment for the message to be saved in the database
          setTimeout(async () => {
            try {
              const messages = await fetchConversationMessages(participantId)
              const formattedMessages = messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                timestamp: msg.created_at,
                isFromCurrentUser: msg.sender_id === user.id
              }))
              
              // Always update after sending a message
              setConversationMessages(formattedMessages)
              // Ensure scroll to bottom after sending message
              requestAnimationFrame(() => {
                setTimeout(() => scrollToBottom(), 50)
              })
            } catch (error) {
              console.error('Error reloading messages:', error)
            }
          }, 100)
        }
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


  // Show unauthenticated state
  if (!user) {
    return (
      <div className="messages-page">
        <SearchBar onLogoClick={handleLogoClick} hideOnMobile={true} />
        <div className="container">
          <div className="empty-state">
              <div className="empty-content">
                <div className="empty-icon">💬</div>
                <h2 className="empty-title">Accedi per visualizzare i messaggi</h2>
                <p className="empty-description">Effettua il login per vedere le tue conversazioni e iniziare a chattare con gli artisti.</p>
                <button 
                  className="action-btn" 
                  onClick={handleAuthRequired}
                  style={{ marginTop: '1.5rem' }}
                >
                  Accedi
                </button>
              </div>
            </div>
        </div>
        
        {/* Auth Overlay - must be included in unauthenticated state */}
        {showAuthOverlay && (
          <Suspense fallback={<div />}>
            <AuthOverlay
              isOpen={showAuthOverlay}
              onClose={() => setShowAuthOverlay(false)}
            />
          </Suspense>
        )}
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="messages-page">
        <SearchBar onLogoClick={handleLogoClick} hideOnMobile={true} />
        <div className="messages-loading">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="messages-page">
        <SearchBar onLogoClick={handleLogoClick} hideOnMobile={true} />
        <div className="messages-layout">
          <div className="error-message">
            <h3>Errore caricamento messaggi</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Mobile Layout
  if (isMobile) {
    // If we have artistId in URL, show conversation view
    if (artistId && selectedChat) {
      return (
        <div className="messages-page mobile conversation">
          <div className="mobile-conversation-container">
            {/* Fixed Conversation Header */}
            <div className="conversation-header">
              <button className="back-to-messages" onClick={() => navigate('/messages')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>
              <div className="conversation-participant">
                <Avatar
                  src={selectedChat.participant.avatar}
                  name={selectedChat.participant.name}
                  alt={`Avatar di ${selectedChat.participant.name}`}
                  size="sm"
                  variant="default"
                />
                <span className="participant-name">{selectedChat.participant.name}</span>
              </div>
              <button 
                className="action-btn delete-chat-action"
                onClick={() => handleRequestDeleteChat({ id: selectedChat.id, participant: { name: selectedChat.participant.name } })}
                title="Elimina conversazione"
                aria-label="Elimina conversazione"
              >
                <span className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </span>
                <span className="action-text">Elimina</span>
              </button>
            </div>

            {/* Scrollable Messages List */}
            <div className="messages-list" ref={mobileMessagesListRef}>
              {loadingMessages ? (
                <div className="loading-messages">
                  <p>Caricamento messaggi...</p>
                </div>
              ) : conversationMessages.length === 0 ? (
                  <div className="empty-messages">
                    <p>Nessun messaggio ancora. Inizia la conversazione!</p>
                  </div>
                ) : (
                  <>
                    {conversationMessages.map((message) => (
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
                    ))}
                    {/* Invisible element at the bottom for scrolling */}
                    <div id="messages-bottom" style={{ height: '1px', minHeight: '1px' }} />
                  </>
                )}
            </div>

            {/* Fixed Message Input */}
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
                  className="send-message-btn"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  aria-label="Invia messaggio"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Overlay */}
          <ConfirmationOverlay
            isOpen={chatToDelete !== null}
            title="Elimina Conversazione"
            message={chatToDelete ? `Vuoi davvero eliminare la conversazione con ${chatToDelete.participantName}? Questa azione non può essere annullata.` : ''}
            confirmText="Elimina"
            cancelText="Annulla"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />

          {/* Auth Overlay */}
          {showAuthOverlay && (
            <Suspense fallback={<div />}>
              <AuthOverlay
                isOpen={showAuthOverlay}
                onClose={() => setShowAuthOverlay(false)}
              />
            </Suspense>
          )}
        </div>
      )
    }

    // Default mobile chat list view
    return (
      <div className="messages-page mobile">
        <div className="mobile-messages-container">
          {/* Fixed Header */}
          <div className="chat-list-header">
            <h1 className="chat-list-title">Messaggi</h1>
          </div>
          
          {/* Scrollable Chat List */}
          <div className="chat-list-items">
            {chats.length === 0 ? (
              <div className="empty-state">
                <div className="empty-content">
                  <div className="empty-icon">💬</div>
                  <h3 className="empty-title">Nessun messaggio</h3>
                  <p className="empty-description">Non hai ancora conversazioni attive.</p>
                </div>
              </div>
            ) : (
              chats.map(chat => (
                <div
                  key={chat.id}
                  className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
                  onClick={() => handleChatSelect(chat.id)}
                >
                  <div className="chat-avatar">
                    <Avatar
                      src={chat.participant.avatar}
                      name={chat.participant.name}
                      alt={`Avatar di ${chat.participant.name}`}
                      size="sm"
                      variant="default"
                    />
                  </div>
                  
                  <div className="chat-content">
                    <div className="chat-header">
                      <h3 className="chat-participant-name">
                        {chat.participant.name}
                      </h3>
                      <div className="chat-header-actions">
                        <span className="chat-timestamp">
                          {formatTimestamp(chat.timestamp)}
                        </span>
                        <button
                          className="chat-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRequestDeleteChat({ id: chat.id, participant: { name: chat.participant.name } })
                          }}
                          title="Elimina conversazione"
                          aria-label="Elimina conversazione"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="chat-preview">
                      <p className="chat-last-message">
                        {chat.lastMessage || 'Inizia una conversazione'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="chat-unread-count">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        <ConfirmationOverlay
          isOpen={chatToDelete !== null}
          title="Elimina Conversazione"
          message={chatToDelete ? `Vuoi davvero eliminare la conversazione con ${chatToDelete.participantName}? Questa azione non può essere annullata.` : ''}
          confirmText="Elimina"
          cancelText="Annulla"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        {/* Auth Overlay */}
        {showAuthOverlay && (
          <Suspense fallback={<div />}>
            <AuthOverlay
              isOpen={showAuthOverlay}
              onClose={() => setShowAuthOverlay(false)}
            />
          </Suspense>
        )}
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className="messages-page">
      <SearchBar onLogoClick={handleLogoClick} hideOnMobile={true} />
      
      
      <div className="messages-layout">
        {/* Chat List Sidebar */}
        <div className="chat-list-section">
          <ChatList 
            chats={chats}
            selectedChatId={selectedChatId}
            onChatSelect={handleChatSelect}
            onRequestDeleteChat={handleRequestDeleteChat}
          />
        </div>
        
        {/* Chat Conversation Area */}
        <div className="chat-conversation-section">
          {selectedChat ? (
            <ChatConversation 
              chat={selectedChat}
              onRequestDeleteChat={handleRequestDeleteChat}
              sendMessage={sendMessage}
              fetchConversationMessages={fetchConversationMessages}
            />
          ) : (
            <div className="chat-conversation empty">
              <div className="empty-conversation">
                <div className="empty-conversation-icon">💬</div>
                <h3 className="empty-conversation-title">Seleziona una conversazione</h3>
                <p className="empty-conversation-text">
                  Scegli una chat dalla lista per iniziare a messaggiare
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      <ConfirmationOverlay
        isOpen={chatToDelete !== null}
        title="Elimina Conversazione"
        message={chatToDelete ? `Vuoi davvero eliminare la conversazione con ${chatToDelete.participantName}? Questa azione non può essere annullata.` : ''}
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Auth Overlay */}
      {showAuthOverlay && (
        <Suspense fallback={<div />}>
          <AuthOverlay
            isOpen={showAuthOverlay}
            onClose={() => setShowAuthOverlay(false)}
          />
        </Suspense>
      )}
    </div>
  )
}