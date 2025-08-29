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

interface MessagesPageProps {
  onLogoClick?: () => void
}

interface Chat {
  id: string
  participant: {
    name: string
    avatar?: string
  }
  lastMessage: string
  timestamp: string
  unreadCount: number
}

export function MessagesPage({ onLogoClick }: MessagesPageProps) {
  const { artistId } = useParams()
  const { user } = useAuth()
  const { conversations, loading, error, deleteConversation, markConversationAsRead } = useMessages()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [newChatArtist, setNewChatArtist] = useState<{id: string, name: string, avatar?: string} | null>(null)
  
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
  let selectedChat = chats.find(chat => chat.id === selectedChatId)
  
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

  const handleChatDelete = async (chatId: string) => {
    try {
      // Find the conversation to get participant ID
      const conversation = conversations.find(conv => conv.id === chatId)
      if (conversation) {
        await deleteConversation(conversation.participant.user_id)
        
        // If the deleted chat was selected, clear selection
        if (selectedChatId === chatId) {
          setSelectedChatId(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="messages-page">
        <SearchBar onLogoClick={onLogoClick} />
        <div className="messages-container">
          <div className="messages-content">
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
            onChatDelete={handleChatDelete}
          />
          
          {/* Chat Conversation Area */}
          <ChatConversation 
            chat={selectedChat}
            isVisible={selectedChatId !== null}
          />
        </div>
      </div>
    </div>
  )
}