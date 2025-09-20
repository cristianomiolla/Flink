import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './MessagesPage.css'
import './Dropdown.css'
import './FormOverlay.css'
import './ImageUpload.css'
import { SearchBar } from './SearchBar'
import { ChatList } from './ChatList'
import { ChatConversation } from './ChatConversation'
import { Avatar } from './Avatar'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../hooks/useAuth'
import { generateConversationId } from '../lib/messageUtils'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'
import { ConfirmationModal } from './ConfirmationModal'
import { AppointmentCard } from './AppointmentCard'
import { BookingProgressTracker } from './BookingProgressTracker'
import { useBookingStatus } from '../hooks/useBookingStatus'
import { ArtistAppointmentForm } from './ArtistAppointmentForm'
import { createScrollToBottom } from '../utils/scrollUtils'
import { useIsMobile } from '../hooks/useIsMobile'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

// PinnedActionButton component for mobile
interface PinnedActionButtonProps {
  participantId: string | null
  participantName: string
  onOpenArtistAppointment?: (participantId: string, participantName: string) => void
}

function PinnedActionButton({ participantId, participantName, onOpenBookingRequest, onOpenArtistAppointment }: PinnedActionButtonProps & { onOpenBookingRequest?: (participantId?: string) => void; onOpenArtistAppointment?: (participantId: string, participantName: string) => void }) {
  const { user, profile } = useAuth()
  
  if (!user || !profile || !participantId) return null

  const isArtist = profile.profile_type === 'artist'

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
    }
  }

  const icon = isArtist ? '📅' : '📝'
  const text = isArtist ? 'FISSA APPUNTAMENTO' : 'INVIA UNA RICHIESTA'

  return (
    <button className="pinned-action-btn" onClick={handleClick}>
      <span className="progress-icon">{icon}</span>
      <span className="progress-text">{text}</span>
    </button>
  )
}


// Helper function to parse booking request message
const parseBookingRequestMessage = (content: string) => {
  try {
    const parsed = JSON.parse(content)
    if ((parsed.type === 'booking_request' || parsed.type === 'appointment_scheduled') && parsed.booking_id) {
      return {
        booking_id: parsed.booking_id,
        message_type: parsed.type
      }
    }
  } catch {
    return null
  }
  return null
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
  const { user, profile } = useAuth()
  const isMobile = useIsMobile()
  
  const handleLogoClick = () => navigate('/')
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  const [showBookingRequest, setShowBookingRequest] = useState(false)
  const [showArtistAppointmentForm, setShowArtistAppointmentForm] = useState(false)
  const [currentArtistId, setCurrentArtistId] = useState<string | null>(null)
  const [appointmentClientData, setAppointmentClientData] = useState<{ id: string; name: string } | null>(null)
  const [refreshBookingStatusFn, setRefreshBookingStatusFn] = useState<(() => Promise<void>) | null>(null)
  const [mobileRefreshBookingStatusFn, setMobileRefreshBookingStatusFn] = useState<(() => Promise<void>) | null>(null)
  const [refreshMessagesFn, setRefreshMessagesFn] = useState<(() => Promise<void>) | null>(null)
  const [bookingRefreshTrigger, setBookingRefreshTrigger] = useState(0)

  // Function to trigger booking card refresh
  const handleBookingUpdated = async () => {
    setBookingRefreshTrigger(prev => prev + 1)

    // Also refresh booking status for progress tracker
    if (refreshBookingStatusFn) {
      await refreshBookingStatusFn()
    }
    if (mobileRefreshBookingStatusFn) {
      await mobileRefreshBookingStatusFn()
    }
  }
  
  // Hook for mobile booking status - must be before any early returns
  // Use artistId directly for mobile since it's available from useParams
  const mobileParticipantId = (isMobile && artistId) ? artistId : null
  const { bookingData: mobileBookingData, showProgressTracker: mobileShowProgressTracker, showPinnedAction: mobileShowPinnedAction, refreshBookingStatus: mobileRefreshBookingStatus } = useBookingStatus(mobileParticipantId)
  
  // Store mobile refresh function
  useEffect(() => {
    if (isMobile && artistId) {
      setMobileRefreshBookingStatusFn(() => mobileRefreshBookingStatus)
    } else {
      setMobileRefreshBookingStatusFn(null)
    }
  }, [mobileRefreshBookingStatus, isMobile, artistId])
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    subject: '',
    tattoo_style: '',
    body_area: '',
    size_category: '',
    color_preferences: '',
    meaning: '',
    budget_min: '',
    budget_max: ''
  })
  
  // State for reference image (single image like ServiceForm)
  const [selectedReferenceFile, setSelectedReferenceFile] = useState<File | null>(null)
  const [referenceFilePreview, setReferenceFilePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  // Upload image function (same as ServiceForm)
  const uploadReferenceImage = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated')
    
    try {
      setImageUploading(true)
      // Genera un nome file unico
      const fileExt = file.name.split('.').pop()
      const fileName = `booking-ref-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Carica il file su Supabase Storage
      const { error } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Ottieni l'URL pubblico
      const { data } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch {
      // Error uploading reference image
      throw new Error('Errore durante il caricamento dell\'immagine di riferimento')
    } finally {
      setImageUploading(false)
    }
  }
  
  // Dropdown states
  const [tattooStyleDropdownOpen, setTattooStyleDropdownOpen] = useState(false)
  const [bodyAreaDropdownOpen, setBodyAreaDropdownOpen] = useState(false)
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false)
  
  // Handler for reference image upload (single file like ServiceForm)
  const handleReferenceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Formato file non supportato. Usa JPG, PNG o WebP.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Il file è troppo grande. Dimensione massima: 5MB.')
        return
      }

      setSelectedReferenceFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setReferenceFilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }
  
  // Helper function to close booking modal and reset form
  const handleCloseBookingModal = () => {
    setShowBookingRequest(false)
    setBookingForm({
      subject: '',
      tattoo_style: '',
      body_area: '',
      size_category: '',
      color_preferences: '',
      meaning: '',
      budget_min: '',
      budget_max: ''
    })
    setSelectedReferenceFile(null)
    setReferenceFilePreview(null)
    setTattooStyleDropdownOpen(false)
    setBodyAreaDropdownOpen(false)
    setSizeDropdownOpen(false)
  }

  // Helper functions for artist appointment form
  const handleOpenArtistAppointment = (participantId: string, participantName: string) => {
    setAppointmentClientData({ id: participantId, name: participantName })
    setShowArtistAppointmentForm(true)
  }

  const handleCloseArtistAppointment = () => {
    setShowArtistAppointmentForm(false)
    setAppointmentClientData(null)
  }

  const handleAppointmentCreated = async () => {
    // Refresh booking status to update UI
    if (refreshBookingStatusFn) {
      await refreshBookingStatusFn()
    }
    if (mobileRefreshBookingStatusFn) {
      await mobileRefreshBookingStatusFn()
    }

    // Force refresh messages to show the appointment card immediately for sender
    if (isMobile && artistId) {
      // Reload mobile conversation messages
      setTimeout(async () => {
        const messages = await fetchConversationMessages(artistId)
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: msg.created_at,
          isFromCurrentUser: msg.sender_id === user?.id
        }))
        setConversationMessages(formattedMessages)
        setTimeout(() => scrollToBottom(), 100)
      }, 500)
    } else if (refreshMessagesFn) {
      // For desktop, use the messages refresh function
      setTimeout(() => refreshMessagesFn(), 500)
    }
  }
  
  // Funzione per salvare la prenotazione nel database
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !currentArtistId) {
      // Cannot send request: missing data
      alert('Errore: impossibile inviare richiesta')
      return
    }
    
    // Validazione campi obbligatori
    if (!bookingForm.subject || !bookingForm.tattoo_style || !bookingForm.body_area || !bookingForm.size_category || !bookingForm.color_preferences) {
      alert('Compila tutti i campi obbligatori')
      return
    }
    
    try {
      // Upload reference image if selected
      let referenceImageUrl: string | null = null
      if (selectedReferenceFile) {
        try {
          referenceImageUrl = await uploadReferenceImage(selectedReferenceFile)
        } catch {
          // Error uploading reference image
          alert('Errore nel caricamento dell\'immagine di riferimento. La richiesta sarà inviata senza immagine.')
        }
      }

      const bookingData = {
        client_id: user.id,
        artist_id: currentArtistId,
        subject: bookingForm.subject,
        tattoo_style: bookingForm.tattoo_style,
        body_area: bookingForm.body_area,
        size_category: bookingForm.size_category,
        color_preferences: bookingForm.color_preferences,
        meaning: bookingForm.meaning || null,
        budget_min: bookingForm.budget_min ? parseFloat(bookingForm.budget_min) : null,
        budget_max: bookingForm.budget_max ? parseFloat(bookingForm.budget_max) : null,
        status: 'pending',
        reference_images: referenceImageUrl ? [referenceImageUrl] : null
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
      
      if (error) {
        // Error saving booking
        alert('Errore nell\'invio della richiesta. Riprova.')
        return
      }
      
      
      // Crea un messaggio nella conversazione con il booking ID
      const bookingMessage = JSON.stringify({
        type: 'booking_request',
        booking_id: data[0].id
      })
      
      // Invia il messaggio di prenotazione nella conversazione
      if (sendMessage) {
        await sendMessage(currentArtistId, bookingMessage)
      }
      
      // Chiudi il modal e resetta il form
      handleCloseBookingModal()
      
      // Aggiorna lo stato del booking in tempo reale
      if (refreshBookingStatusFn) {
        await refreshBookingStatusFn()
      }
      // Aggiorna anche la versione mobile se attiva
      if (mobileRefreshBookingStatusFn) {
        await mobileRefreshBookingStatusFn()
      }

      // Force refresh messages to show the booking card immediately for sender
      if (isMobile && artistId) {
        // Reload mobile conversation messages
        setTimeout(async () => {
          const messages = await fetchConversationMessages(artistId)
          const formattedMessages = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.created_at,
            isFromCurrentUser: msg.sender_id === user?.id
          }))
          setConversationMessages(formattedMessages)
          setTimeout(() => scrollToBottom(), 100)
        }, 500)
      } else if (refreshMessagesFn) {
        // For desktop, use the messages refresh function
        setTimeout(() => refreshMessagesFn(), 500)
      }
      
    } catch {
      // Error saving booking
      alert('Errore nell\'invio della richiesta. Riprova.')
    }
  }
  
  // Dropdown options
  const tattooStyleOptions = [
    { value: 'Tradizionale', label: 'Tradizionale' },
    { value: 'Realismo', label: 'Realismo' },
    { value: 'Neo-tradizionale', label: 'Neo-tradizionale' },
    { value: 'Blackwork', label: 'Blackwork' },
    { value: 'Dotwork', label: 'Dotwork' },
    { value: 'Geometrico', label: 'Geometrico' },
    { value: 'Minimalista', label: 'Minimalista' },
    { value: 'Watercolor', label: 'Watercolor' },
    { value: 'Biomeccanico', label: 'Biomeccanico' },
    { value: 'Tribale', label: 'Tribale' },
    { value: 'Giapponese', label: 'Giapponese' },
    { value: 'Chicano', label: 'Chicano' },
    { value: 'New School', label: 'New School' },
    { value: 'Fine Line', label: 'Fine Line' },
    { value: 'Lettering', label: 'Lettering' },
    { value: 'Altro', label: 'Altro' }
  ]
  
  const bodyAreaOptions = [
    { value: 'braccio', label: 'Braccio' },
    { value: 'gamba', label: 'Gamba' },
    { value: 'schiena', label: 'Schiena' },
    { value: 'petto', label: 'Petto' },
    { value: 'mano', label: 'Mano' },
    { value: 'piede', label: 'Piede' },
    { value: 'collo', label: 'Collo' },
    { value: 'viso', label: 'Viso' },
    { value: 'altro', label: 'Altro' }
  ]
  
  const sizeOptions = [
    { value: 'piccolo', label: 'Piccolo (2-5cm)' },
    { value: 'medio', label: 'Medio (5-15cm)' },
    { value: 'grande', label: 'Grande (15-30cm)' },
    { value: 'extra-grande', label: 'Extra Grande (>30cm)' }
  ]

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

  // Callback handlers for ChatConversation
  const handleBookingStatusRefresh = useCallback((refreshFn: () => Promise<void>) => {
    setRefreshBookingStatusFn(() => refreshFn)
  }, [])

  const handleMessagesRefresh = useCallback((refreshFn: () => Promise<void>) => {
    setRefreshMessagesFn(() => refreshFn)
  }, [])

  // All state declarations first
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [newChatArtist, setNewChatArtist] = useState<{id: string, name: string, avatar?: string} | null>(null)
  const [chatToDelete, setChatToDelete] = useState<{id: string, participantName: string} | null>(null)
  
  
  // Note: Body scroll blocking is handled by individual modal components (ConfirmationModal, AuthOverlay)
  
  const [newMessage, setNewMessage] = useState('')
  const [conversationMessages, setConversationMessages] = useState<Array<{
    id: string
    content: string
    timestamp: string
    isFromCurrentUser: boolean
  }>>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  const { conversations, loading, error, deleteConversation, markConversationAsRead, sendMessage, fetchConversationMessages } = useMessages()
  const mobileMessagesListRef = useRef<HTMLDivElement>(null)
  
  // Unified scroll function for mobile using utility
  const scrollToBottom = useCallback(createScrollToBottom(mobileMessagesListRef), [])
  
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
        .select('user_id, full_name, username, avatar_url, profile_type')
        .eq('user_id', artistUserId)
        .single()
      
      if (error) {
        // Error fetching artist profile
        return
      }
      
      const artist = {
        id: artistUserId,
        name: profile?.profile_type === 'client'
          ? (profile?.full_name || 'Unknown User')
          : (profile?.username || profile?.full_name || 'Unknown Artist'),
        avatar: profile?.avatar_url
      }
      
      if (user) {
        const conversationId = generateConversationId(user.id, artistUserId)
        setSelectedChatId(conversationId)
        setNewChatArtist(artist)
      }
    } catch {
      // Error fetching artist profile
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
    } else if (!artistId && isMobile) {
      // Reset selected chat when returning to mobile chat list
      setSelectedChatId(null)
      setNewChatArtist(null)
    }
  }, [artistId, user, conversations, fetchArtistProfile, isMobile])

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
          isFromCurrentUser: msg.sender_id === user?.id
        }))

        // Always update messages and scroll to bottom (like desktop ChatConversation)
        setConversationMessages(formattedMessages)

        // Always scroll to bottom after loading messages
        scrollToBottom({ delay: 150 })
      } catch {
        // Error loading conversation messages
        setConversationMessages([])
      } finally {
        if (showLoading) setLoadingMessages(false)
      }
    }

    // Load initial messages
    loadConversationMessages(true)

    // Setup real-time subscription for mobile conversation
    const channel = supabase
      .channel('global-messages')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const messageData = payload.payload

        if (!messageData) return

        // Only process messages received from the current conversation partner
        if (messageData.receiver_id !== user.id || messageData.sender_id !== artistId) return

        // Convert to local message format
        const formattedMessage = {
          id: messageData.id,
          content: messageData.content,
          timestamp: messageData.created_at,
          isFromCurrentUser: messageData.sender_id === user.id
        }

        // Add message to the current conversation
        setConversationMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === formattedMessage.id)) {
            return prev
          }

          const newMessages = [...prev, formattedMessage]
          // Schedule scroll to bottom after state update
          scrollToBottom({ delay: 100 })
          return newMessages
        })
      })
      .subscribe()

    // Cleanup subscription when component unmounts or conversation changes
    return () => {
      supabase.removeChannel(channel)
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

  // Scroll to bottom whenever a mobile chat is opened/reopened
  useEffect(() => {
    if (isMobile && artistId && selectedChat) {
      scrollToBottom({ delay: 200 })
    }
  }, [isMobile, artistId, selectedChat?.id, scrollToBottom])

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
      } catch {
        // Failed to delete conversation
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
        if (isMobile) {
          // Add message optimistically for immediate feedback
          const optimisticMessage = {
            id: `temp_${Date.now()}`,
            content: messageContent,
            timestamp: new Date().toISOString(),
            isFromCurrentUser: true
          }

          setConversationMessages(prev => {
            const newMessages = [...prev, optimisticMessage]
            // Ensure scroll to bottom after sending message
            scrollToBottom({ delay: 50 })
            return newMessages
          })
        }
      } else {
        // If send failed, restore the message to input
        setNewMessage(messageContent)
      }
    } catch {
      // Error sending message
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
                <span className="conversation-participant-name">{selectedChat.participant.name}</span>
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

            {/* Conditional rendering: Pinned Action Button OR Progress Tracker */}
            {mobileShowPinnedAction && (
              <div className="pinned-action-container">
                <PinnedActionButton 
                  participantId={artistId}
                  participantName={selectedChat.participant.name}
                  onOpenBookingRequest={(participantId?: string) => {
                    if (!participantId) return
                    setCurrentArtistId(participantId)
                    setShowBookingRequest(true)
                  }}
                  onOpenArtistAppointment={handleOpenArtistAppointment}
                />
              </div>
            )}
            
            {mobileShowProgressTracker && mobileBookingData && profile && (
              <BookingProgressTracker
                status={mobileBookingData.status}
                userType={profile.profile_type}
                appointmentDate={mobileBookingData.appointment_date || undefined}
                artistName={profile.profile_type === 'client' ? selectedChat?.participant?.name : undefined}
                clientName={profile.profile_type === 'artist' ? selectedChat?.participant?.name : undefined}
                artistId={profile.profile_type === 'client' ? (() => {
                  if (!selectedChat || !user) return undefined
                  const [userId1, userId2] = selectedChat.id.split('__')
                  return userId1 === user.id ? userId2 : userId1
                })() : user?.id}
                currentUserId={user?.id}
                bookingId={mobileBookingData.id}
                onBookingUpdated={handleBookingUpdated}
              />
            )}
            

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
                    {conversationMessages.map((message) => {
                      const bookingData = parseBookingRequestMessage(message.content)
                      
                      if (bookingData) {
                        // Render BookingRequestCard for booking request messages
                        const cardType = bookingData.message_type === 'appointment_scheduled' ? 'appointment' : 'request'
                        return (
                          <AppointmentCard
                            key={message.id}
                            bookingId={bookingData.booking_id}
                            isFromCurrentUser={message.isFromCurrentUser}
                            timestamp={message.timestamp}
                            cardType={cardType}
                            refreshTrigger={bookingRefreshTrigger}
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
                    })}
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
          <ConfirmationModal
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

          {/* Booking Request Overlay - Mobile version */}
          {showBookingRequest && profile?.profile_type === 'client' && (
            <div className="modal-overlay" onClick={handleCloseBookingModal}>
              <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
                <div className="auth-header-sticky">
                  <button className="modal-close-btn" onClick={handleCloseBookingModal}>
                    ×
                  </button>
                </div>
                <div className="auth-modal-header"></div>
                <div className="auth-content">
                  <div className="header-card">
                    <h2>RICHIESTA TATUAGGIO</h2>
                    <p>Invia una richiesta personalizzata all'artista</p>
                  </div>
                  <form className="auth-form" onSubmit={handleBookingSubmit}>
                    <div className="form-group">
                      <label htmlFor="subject" className="form-label">
                        SOGGETTO DEL TATUAGGIO <span className="required-indicator">*</span>
                      </label>
                      <input 
                        id="subject" 
                        className="form-input" 
                        placeholder="Es. Rosa con spine, leone, scritta..." 
                        maxLength={200} 
                        type="text" 
                        value={bookingForm.subject}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        STILE TATTOO <span className="required-indicator">*</span>
                      </label>
                      <div className="custom-dropdown">
                        <button
                          type="button"
                          className="dropdown-trigger"
                          onClick={() => setTattooStyleDropdownOpen(!tattooStyleDropdownOpen)}
                        >
                          <span className="dropdown-text">
                            {bookingForm.tattoo_style 
                              ? tattooStyleOptions.find(opt => opt.value === bookingForm.tattoo_style)?.label || 'Seleziona uno stile'
                              : 'Seleziona uno stile'
                            }
                          </span>
                          <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="6,9 12,15 18,9"></polyline>
                          </svg>
                        </button>
                        {tattooStyleDropdownOpen && (
                          <div className="dropdown-menu select-dropdown-menu">
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setBookingForm(prev => ({ ...prev, tattoo_style: '' }))
                                setTattooStyleDropdownOpen(false)
                              }}
                            >
                              Seleziona uno stile
                            </button>
                            {tattooStyleOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`dropdown-item ${bookingForm.tattoo_style === option.value ? 'active' : ''}`}
                                onClick={() => {
                                  setBookingForm(prev => ({ ...prev, tattoo_style: option.value }))
                                  setTattooStyleDropdownOpen(false)
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        ZONA DEL CORPO <span className="required-indicator">*</span>
                      </label>
                      <div className="custom-dropdown">
                        <button
                          type="button"
                          className="dropdown-trigger"
                          onClick={() => setBodyAreaDropdownOpen(!bodyAreaDropdownOpen)}
                        >
                          <span className="dropdown-text">
                            {bookingForm.body_area 
                              ? bodyAreaOptions.find(opt => opt.value === bookingForm.body_area)?.label || 'Seleziona una zona'
                              : 'Seleziona una zona'
                            }
                          </span>
                          <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="6,9 12,15 18,9"></polyline>
                          </svg>
                        </button>
                        {bodyAreaDropdownOpen && (
                          <div className="dropdown-menu select-dropdown-menu">
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setBookingForm(prev => ({ ...prev, body_area: '' }))
                                setBodyAreaDropdownOpen(false)
                              }}
                            >
                              Seleziona una zona
                            </button>
                            {bodyAreaOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`dropdown-item ${bookingForm.body_area === option.value ? 'active' : ''}`}
                                onClick={() => {
                                  setBookingForm(prev => ({ ...prev, body_area: option.value }))
                                  setBodyAreaDropdownOpen(false)
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        DIMENSIONI <span className="required-indicator">*</span>
                      </label>
                      <div className="custom-dropdown">
                        <button
                          type="button"
                          className="dropdown-trigger"
                          onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                        >
                          <span className="dropdown-text">
                            {bookingForm.size_category 
                              ? sizeOptions.find(opt => opt.value === bookingForm.size_category)?.label || 'Seleziona una dimensione'
                              : 'Seleziona una dimensione'
                            }
                          </span>
                          <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="6,9 12,15 18,9"></polyline>
                          </svg>
                        </button>
                        {sizeDropdownOpen && (
                          <div className="dropdown-menu select-dropdown-menu">
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setBookingForm(prev => ({ ...prev, size_category: '' }))
                                setSizeDropdownOpen(false)
                              }}
                            >
                              Seleziona una dimensione
                            </button>
                            {sizeOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`dropdown-item ${bookingForm.size_category === option.value ? 'active' : ''}`}
                                onClick={() => {
                                  setBookingForm(prev => ({ ...prev, size_category: option.value }))
                                  setSizeDropdownOpen(false)
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        COLORE <span className="required-indicator">*</span>
                      </label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="color_preferences"
                            value="Bianco e nero"
                            checked={bookingForm.color_preferences === 'Bianco e nero'}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, color_preferences: e.target.value }))}
                          />
                          <span className="radio-label">Bianco e nero</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="color_preferences"
                            value="Colori"
                            checked={bookingForm.color_preferences === 'Colori'}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, color_preferences: e.target.value }))}
                          />
                          <span className="radio-label">Colori</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="meaning" className="form-label">
                        SIGNIFICATO EVENTUALE
                      </label>
                      <textarea 
                        id="meaning" 
                        className="form-textarea" 
                        placeholder="Racconta il significato del tuo tatuaggio (opzionale)" 
                        rows={3} 
                        maxLength={500}
                        value={bookingForm.meaning}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, meaning: e.target.value }))}
                      ></textarea>
                      <div className="char-count">{bookingForm.meaning.length}/500 caratteri</div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="reference_images" className="form-label">
                        IMMAGINI DI RIFERIMENTO
                      </label>
                      <div className="image-upload-section">
                        {referenceFilePreview && (
                          <div className="image-preview-container">
                            <img 
                              src={referenceFilePreview} 
                              alt="Preview" 
                              className="image-preview"
                            />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={() => {
                                setSelectedReferenceFile(null)
                                setReferenceFilePreview(null)
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <div className="file-upload-container">
                          <input 
                            id="reference_images" 
                            className="file-input" 
                            accept="image/jpeg,image/jpg,image/png,image/webp" 
                            type="file" 
                            onChange={handleReferenceFileSelect}
                          />
                          <label htmlFor="reference_images" className="file-upload-btn">
                            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"></path>
                            </svg>
                            <span>{selectedReferenceFile ? 'Cambia Immagine' : 'Carica Immagine'}</span>
                          </label>
                        </div>
                        <p className="file-info">JPG, PNG o WebP. Max 5MB.</p>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="budget_min" className="form-label">
                        BUDGET (€) <span className="required-indicator">*</span>
                      </label>
                      <div className="form-row">
                        <input
                          id="budget_min"
                          className="form-input"
                          placeholder="Min"
                          type="number"
                          min="0"
                          step="10"
                          value={bookingForm.budget_min}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, budget_min: e.target.value }))}
                          required
                        />
                        <span className="budget-separator">-</span>
                        <input
                          id="budget_max"
                          className="form-input"
                          placeholder="Max"
                          type="number"
                          min="0"
                          step="10"
                          value={bookingForm.budget_max}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, budget_max: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-help">Indica il range di budget che hai in mente</div>
                    </div>

                    <div className="form-actions">
                      <button type="button" className="action-btn" onClick={handleCloseBookingModal}>
                        <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                        <span className="action-text">Annulla</span>
                      </button>
                      <button
                        type="submit"
                        className={`action-btn ${imageUploading ? 'disabled' : ''}`}
                        disabled={imageUploading || !bookingForm.subject.trim() || !bookingForm.tattoo_style || !bookingForm.body_area || !bookingForm.size_category || !bookingForm.color_preferences || !bookingForm.budget_min || !bookingForm.budget_max}
                      >
                        <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 5v14m7-7l-7-7-7 7"></path>
                        </svg>
                        <span className="action-text">{imageUploading ? 'Caricamento...' : 'Invia'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Artist Appointment Form - Mobile version */}
          {showArtistAppointmentForm && appointmentClientData && (
            <ArtistAppointmentForm
              clientId={appointmentClientData.id}
              clientName={appointmentClientData.name}
              onClose={handleCloseArtistAppointment}
              onAppointmentCreated={handleAppointmentCreated}
              sendMessage={sendMessage}
            />
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
                      <h3 className="chat-list-participant-name">
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
        <ConfirmationModal
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
    <div className={`messages-page ${showBookingRequest ? 'modal-open' : ''}`}>
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
              isModalOpen={showBookingRequest}
              onOpenBookingRequest={(participantId?: string) => {
                if (!participantId) {
                  // Cannot open request without participantId
                  return
                }
                setCurrentArtistId(participantId)
                setShowBookingRequest(true)
              }}
              onBookingRequestSent={() => {
                // Callback eseguito quando il booking request è stato inviato con successo
                // Il refresh dello stato booking sarà gestito dal hook useBookingStatus
              }}
              onOpenArtistAppointment={handleOpenArtistAppointment}
              onBookingStatusRefresh={handleBookingStatusRefresh}
              onMessagesRefresh={handleMessagesRefresh}
              refreshTrigger={bookingRefreshTrigger}
              onBookingUpdated={handleBookingUpdated}
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
      <ConfirmationModal
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

      {/* Booking Request Overlay - Solo per profili client */}
      {showBookingRequest && profile?.profile_type === 'client' && (
        <div className="modal-overlay" onClick={handleCloseBookingModal}>
          <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-header-sticky">
              <button className="modal-close-btn" onClick={handleCloseBookingModal}>
                ×
              </button>
            </div>
            <div className="auth-modal-header"></div>
            <div className="auth-content">
              <div className="header-card">
                <h2>RICHIESTA TATUAGGIO</h2>
                <p>Invia una richiesta personalizzata all'artista</p>
              </div>
              <form className="auth-form" onSubmit={handleBookingSubmit}>
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    SOGGETTO DEL TATUAGGIO <span className="required-indicator">*</span>
                  </label>
                  <input 
                    id="subject" 
                    className="form-input" 
                    placeholder="Es. Rosa con spine, leone, scritta..." 
                    maxLength={200} 
                    type="text" 
                    value={bookingForm.subject}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    STILE TATTOO <span className="required-indicator">*</span>
                  </label>
                  <div className="custom-dropdown">
                    <button
                      type="button"
                      className="dropdown-trigger"
                      onClick={() => setTattooStyleDropdownOpen(!tattooStyleDropdownOpen)}
                    >
                      <span className="dropdown-text">
                        {bookingForm.tattoo_style 
                          ? tattooStyleOptions.find(opt => opt.value === bookingForm.tattoo_style)?.label || 'Seleziona uno stile'
                          : 'Seleziona uno stile'
                        }
                      </span>
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </button>
                    {tattooStyleDropdownOpen && (
                      <div className="dropdown-menu select-dropdown-menu">
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setBookingForm(prev => ({ ...prev, tattoo_style: '' }))
                            setTattooStyleDropdownOpen(false)
                          }}
                        >
                          Seleziona uno stile
                        </button>
                        {tattooStyleOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`dropdown-item ${bookingForm.tattoo_style === option.value ? 'active' : ''}`}
                            onClick={() => {
                              setBookingForm(prev => ({ ...prev, tattoo_style: option.value }))
                              setTattooStyleDropdownOpen(false)
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    ZONA DEL CORPO <span className="required-indicator">*</span>
                  </label>
                  <div className="custom-dropdown">
                    <button
                      type="button"
                      className="dropdown-trigger"
                      onClick={() => setBodyAreaDropdownOpen(!bodyAreaDropdownOpen)}
                    >
                      <span className="dropdown-text">
                        {bookingForm.body_area 
                          ? bodyAreaOptions.find(opt => opt.value === bookingForm.body_area)?.label || 'Seleziona una zona'
                          : 'Seleziona una zona'
                        }
                      </span>
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </button>
                    {bodyAreaDropdownOpen && (
                      <div className="dropdown-menu select-dropdown-menu">
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setBookingForm(prev => ({ ...prev, body_area: '' }))
                            setBodyAreaDropdownOpen(false)
                          }}
                        >
                          Seleziona una zona
                        </button>
                        {bodyAreaOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`dropdown-item ${bookingForm.body_area === option.value ? 'active' : ''}`}
                            onClick={() => {
                              setBookingForm(prev => ({ ...prev, body_area: option.value }))
                              setBodyAreaDropdownOpen(false)
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    DIMENSIONI <span className="required-indicator">*</span>
                  </label>
                  <div className="custom-dropdown">
                    <button
                      type="button"
                      className="dropdown-trigger"
                      onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                    >
                      <span className="dropdown-text">
                        {bookingForm.size_category 
                          ? sizeOptions.find(opt => opt.value === bookingForm.size_category)?.label || 'Seleziona una dimensione'
                          : 'Seleziona una dimensione'
                        }
                      </span>
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </button>
                    {sizeDropdownOpen && (
                      <div className="dropdown-menu select-dropdown-menu">
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setBookingForm(prev => ({ ...prev, size_category: '' }))
                            setSizeDropdownOpen(false)
                          }}
                        >
                          Seleziona una dimensione
                        </button>
                        {sizeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`dropdown-item ${bookingForm.size_category === option.value ? 'active' : ''}`}
                            onClick={() => {
                              setBookingForm(prev => ({ ...prev, size_category: option.value }))
                              setSizeDropdownOpen(false)
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    COLORE <span className="required-indicator">*</span>
                  </label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="color_preferences"
                        value="Bianco e nero"
                        checked={bookingForm.color_preferences === 'Bianco e nero'}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, color_preferences: e.target.value }))}
                      />
                      <span className="radio-label">Bianco e nero</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="color_preferences"
                        value="Colori"
                        checked={bookingForm.color_preferences === 'Colori'}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, color_preferences: e.target.value }))}
                      />
                      <span className="radio-label">Colori</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="meaning" className="form-label">
                    SIGNIFICATO EVENTUALE
                  </label>
                  <textarea 
                    id="meaning" 
                    className="form-textarea" 
                    placeholder="Racconta il significato del tuo tatuaggio (opzionale)" 
                    rows={3} 
                    maxLength={500}
                    value={bookingForm.meaning}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, meaning: e.target.value }))}
                  ></textarea>
                  <div className="char-count">{bookingForm.meaning.length}/500 caratteri</div>
                </div>

                <div className="form-group">
                  <label htmlFor="reference_images" className="form-label">
                    IMMAGINI DI RIFERIMENTO
                  </label>
                  <div className="image-upload-section">
                    {referenceFilePreview && (
                      <div className="image-preview-container">
                        <img 
                          src={referenceFilePreview} 
                          alt="Preview" 
                          className="image-preview"
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => {
                            setSelectedReferenceFile(null)
                            setReferenceFilePreview(null)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="file-upload-container">
                      <input 
                        id="reference_images" 
                        className="file-input" 
                        accept="image/jpeg,image/jpg,image/png,image/webp" 
                        type="file" 
                        onChange={handleReferenceFileSelect}
                      />
                      <label htmlFor="reference_images" className="file-upload-btn">
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"></path>
                        </svg>
                        <span>{selectedReferenceFile ? 'Cambia Immagine' : 'Carica Immagine'}</span>
                      </label>
                    </div>
                    <p className="file-info">JPG, PNG o WebP. Max 5MB.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="budget_min" className="form-label">
                    BUDGET (€) <span className="required-indicator">*</span>
                  </label>
                  <div className="form-row">
                    <input
                      id="budget_min"
                      className="form-input"
                      placeholder="Min"
                      type="number"
                      min="0"
                      step="10"
                      value={bookingForm.budget_min}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, budget_min: e.target.value }))}
                      required
                    />
                    <span className="budget-separator">-</span>
                    <input
                      id="budget_max"
                      className="form-input"
                      placeholder="Max"
                      type="number"
                      min="0"
                      step="10"
                      value={bookingForm.budget_max}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, budget_max: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-help">Indica il range di budget che hai in mente</div>
                </div>

                <div className="form-actions">
                  <button type="button" className="action-btn" onClick={handleCloseBookingModal}>
                    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                    <span className="action-text">Annulla</span>
                  </button>
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={!bookingForm.subject.trim() || !bookingForm.tattoo_style || !bookingForm.body_area || !bookingForm.size_category || !bookingForm.color_preferences || !bookingForm.budget_min || !bookingForm.budget_max}
                  >
                    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 5v14m7-7l-7-7-7 7"></path>
                    </svg>
                    <span className="action-text">Invia</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Artist Appointment Form */}
      {showArtistAppointmentForm && appointmentClientData && (
        <ArtistAppointmentForm
          clientId={appointmentClientData.id}
          clientName={appointmentClientData.name}
          onClose={handleCloseArtistAppointment}
          onAppointmentCreated={handleAppointmentCreated}
          sendMessage={sendMessage}
        />
      )}
    </div>
  )
}