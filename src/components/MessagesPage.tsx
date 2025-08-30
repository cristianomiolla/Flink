import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './MessagesPage.css'
import { SearchBar } from './SearchBar'
import { ChatList } from './ChatList'
import { ChatConversation } from './ChatConversation'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../hooks/useAuth'
import { generateConversationId } from '../lib/messageUtils'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'
import { ConfirmationOverlay } from './ConfirmationOverlay'

interface MessagesPageProps {
  onLogoClick?: () => void
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

export function MessagesPage({ onLogoClick }: MessagesPageProps) {
  const { artistId } = useParams()
  const { user } = useAuth()
  const { conversations, loading, error, deleteConversation, markConversationAsRead, sendMessage, fetchConversationMessages } = useMessages()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [newChatArtist, setNewChatArtist] = useState<{id: string, name: string, avatar?: string} | null>(null)
  const [chatToDelete, setChatToDelete] = useState<{id: string, participantName: string} | null>(null)
  
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
  }, [artistId, user, conversations])

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
  
  // Function to fetch artist profile data
  const fetchArtistProfile = async (artistUserId: string) => {
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
  }

  // Determine the selected chat - existing or new
  let selectedChat = selectedChatId ? chats.find(chat => chat.id === selectedChatId) : null
  
  // If selectedChatId exists but no chat found AND no new chat artist, the chat was probably deleted
  if (selectedChatId && !selectedChat && !newChatArtist) {
    setSelectedChatId(null)
    return // Re-render with null selectedChatId
  }
  
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
    setSelectedChatId(chatId)
    
    // Mark conversation as read when selected
    const conversation = conversations.find(conv => conv.id === chatId)
    if (conversation && conversation.unreadCount > 0) {
      markConversationAsRead(conversation.participant.user_id)
    }
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

  // Show loading state
  if (loading) {
    return (
      <div className="messages-page">
        <SearchBar onLogoClick={onLogoClick} />
        <div className="messages-container">
          <div className="messages-loading">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="messages-page">
        <SearchBar onLogoClick={onLogoClick} />
        <div className="messages-container">
          <div className="messages-content">
            <div className="error-message">
              <h3>Errore caricamento messaggi</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-page">
      <SearchBar onLogoClick={onLogoClick} />
      
      <div className="messages-container">
        <div className="messages-content">
          {/* Chat List Sidebar */}
          <ChatList 
            chats={chats}
            selectedChatId={selectedChatId}
            onChatSelect={handleChatSelect}
            onRequestDeleteChat={handleRequestDeleteChat}
          />
          
          {/* Chat Conversation Area */}
          <ChatConversation 
            chat={selectedChat}
            isVisible={selectedChatId !== null}
            onRequestDeleteChat={handleRequestDeleteChat}
            sendMessage={sendMessage}
            fetchConversationMessages={fetchConversationMessages}
          />
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
    </div>
  )
}