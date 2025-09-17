import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AppointmentDetailsOverlay } from './AppointmentDetailsOverlay'
import './BookingRequestCard.css'

interface BookingRequestData {
  subject: string
  tattoo_style?: string
  body_area?: string
  size_category?: string
  color_preferences?: string
  meaning?: string
  budget_min?: number
  budget_max?: number
  reference_images?: string[] | null
  created_at: string
  // Artist appointment specific fields
  appointment_date?: string
  appointment_duration?: number
  deposit_amount?: number
  artist_notes?: string
}

interface BookingRequestCardProps {
  bookingId: string  // booking_id is now required
  isFromCurrentUser?: boolean
  timestamp: string
  mode?: 'message' | 'appointment' // New prop to control rendering mode
  participantName?: string // For appointment mode
  cardType?: 'request' | 'appointment' // New prop to force card display type
  refreshTrigger?: number // New prop to trigger refresh
  onBookingUpdated?: () => void // Callback for when booking is updated
}

export function BookingRequestCard({ bookingId, isFromCurrentUser, timestamp, mode = 'message', participantName, cardType, refreshTrigger, onBookingUpdated }: BookingRequestCardProps) {
  const { user, profile } = useAuth()
  const [currentStatus, setCurrentStatus] = useState<string>('pending')
  const [loading, setLoading] = useState(true)
  const [fullBookingData, setFullBookingData] = useState<BookingRequestData | null>(null)
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false)

  // Fetch complete booking data from database
  const fetchBookingData = async () => {
    // Skip fetching if user is not authenticated or no bookingId
    if (!user || !bookingId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching booking data:', error)
        setCurrentStatus('pending')
        setFullBookingData(null)
      } else if (data) {
        setCurrentStatus(data.status || 'pending')
        setFullBookingData({
          subject: data.subject,
          tattoo_style: data.tattoo_style,
          body_area: data.body_area,
          size_category: data.size_category,
          color_preferences: data.color_preferences,
          meaning: data.meaning,
          budget_min: data.budget_min,
          budget_max: data.budget_max,
          reference_images: data.reference_images,
          created_at: data.created_at,
          appointment_date: data.appointment_date,
          appointment_duration: data.appointment_duration,
          deposit_amount: data.deposit_amount,
          artist_notes: data.artist_notes
        })
      }
    } catch (error) {
      console.warn('Error fetching booking data:', error)
      setCurrentStatus('pending')
      setFullBookingData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookingData()
  }, [bookingId, user, refreshTrigger]) // fetchBookingData è definita inline e non cambia

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('it-IT', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatBudget = () => {
    if (!fullBookingData) return 'Budget da definire'

    if (fullBookingData.budget_min && fullBookingData.budget_max) {
      return `€${fullBookingData.budget_min} - €${fullBookingData.budget_max}`
    } else if (fullBookingData.budget_min) {
      return `da €${fullBookingData.budget_min}`
    } else if (fullBookingData.budget_max) {
      return `fino a €${fullBookingData.budget_max}`
    }
    return 'Budget da definire'
  }

  const formatAppointmentDate = () => {
    if (!fullBookingData?.appointment_date) return ''
    const date = new Date(fullBookingData.appointment_date)
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = () => {
    if (!fullBookingData?.appointment_duration) return ''
    const hours = Math.floor(fullBookingData.appointment_duration / 60)
    const minutes = fullBookingData.appointment_duration % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${minutes}min`
    }
  }

  // Determine display mode based on cardType prop or data availability
  const isArtistAppointment = cardType === 'appointment' ||
    (cardType !== 'request' && !!(fullBookingData?.appointment_date || fullBookingData?.deposit_amount))

  // Handle card click to open modal overlay (only in appointment mode)
  const handleCardClick = () => {
    if (mode === 'appointment') {
      setShowDetailsOverlay(true)
    }
  }

  const getStatusBadge = () => {
    // Mostra loading mentre carica lo status
    if (loading) {
      return <span className="status-badge pending">Caricamento...</span>
    }

    // Per le "Richieste Tatuaggio" (non appuntamenti), usa logica speciale
    if (!isArtistAppointment) {
      switch (currentStatus) {
        case 'pending':
          return <span className="status-badge pending">In attesa</span>
        case 'scheduled':
        case 'rescheduled':
        case 'completed':
          return <span className="status-badge accepted">Accettata</span>
        case 'expired':
          return <span className="status-badge expired">Scaduta</span>
        case 'cancelled':
          return null // Non mostrare badge per richieste cancellate
        default:
          return null // Non mostrare badge per altri stati nelle richieste
      }
    }

    // Per gli "Appuntamenti", usa la logica completa
    switch (currentStatus) {
      case 'pending':
        return <span className="status-badge pending">In attesa</span>
      case 'expired':
        return <span className="status-badge expired">Scaduta</span>
      case 'accepted':
        return <span className="status-badge accepted">Accettata</span>
      case 'declined':
        return <span className="status-badge declined">Rifiutata</span>
      case 'scheduled':
        return <span className="status-badge accepted">Programmato</span>
      case 'rescheduled':
        return <span className="status-badge accepted">Riprogrammato</span>
      case 'completed':
        return <span className="status-badge accepted">Completato</span>
      case 'cancelled':
        return <span className="status-badge declined">Cancellato</span>
      default:
        return <span className="status-badge pending">In attesa</span>
    }
  }

  const cardContent = (
    <div
      className={`booking-request-card ${mode === 'appointment' ? 'clickable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="booking-header">
        <div className="booking-title-container">
          <div className="booking-title">
            <span className="booking-icon">{isArtistAppointment ? '📅' : '📝'}</span>
            <h4>{isArtistAppointment ? 'Appuntamento' : 'Richiesta Tatuaggio'}</h4>
          </div>
          <div className="status-badge-mobile">
            {getStatusBadge()}
          </div>
        </div>
        <div className="status-badge-desktop">
          {getStatusBadge()}
        </div>
      </div>
      
      <div className="booking-content">
        {mode === 'appointment' && participantName && (
          <div className="booking-field">
            <span className="field-label">{profile?.profile_type === 'artist' ? 'Cliente' : 'Artista'}:</span>
            <span className="field-value">{participantName}</span>
          </div>
        )}
        
        {fullBookingData && (
          <div className="booking-field">
            <span className="field-label">Soggetto:</span>
            <span className="field-value">{fullBookingData.subject}</span>
          </div>
        )}
          
          {fullBookingData && (
            <>
              {isArtistAppointment ? (
                // Artist appointment specific fields
                <>
                  {fullBookingData.appointment_date && (
                    <div className="booking-field">
                      <span className="field-label">Data e Ora:</span>
                      <span className="field-value">{formatAppointmentDate()}</span>
                    </div>
                  )}

                  {fullBookingData.appointment_duration && (
                    <div className="booking-field">
                      <span className="field-label">Durata:</span>
                      <span className="field-value">{formatDuration()}</span>
                    </div>
                  )}

                  {fullBookingData.deposit_amount && (
                    <div className="booking-field">
                      <span className="field-label">Acconto:</span>
                      <span className="field-value budget">€{fullBookingData.deposit_amount}</span>
                    </div>
                  )}

                  {fullBookingData.artist_notes && (
                    <div className="booking-field">
                      <span className="field-label">Note Artista:</span>
                      <span className="field-value">{fullBookingData.artist_notes}</span>
                    </div>
                  )}
                </>
              ) : (
                // Client request specific fields
                <>
                  {fullBookingData.tattoo_style && (
                    <div className="booking-field">
                      <span className="field-label">Stile:</span>
                      <span className="field-value">{fullBookingData.tattoo_style}</span>
                    </div>
                  )}

                  {fullBookingData.body_area && (
                    <div className="booking-field">
                      <span className="field-label">Zona:</span>
                      <span className="field-value">{fullBookingData.body_area}</span>
                    </div>
                  )}

                  {fullBookingData.size_category && (
                    <div className="booking-field">
                      <span className="field-label">Dimensioni:</span>
                      <span className="field-value">{fullBookingData.size_category}</span>
                    </div>
                  )}

                  {fullBookingData.color_preferences && (
                    <div className="booking-field">
                      <span className="field-label">Colore:</span>
                      <span className="field-value">{fullBookingData.color_preferences}</span>
                    </div>
                  )}

                  {fullBookingData.meaning && (
                    <div className="booking-field">
                      <span className="field-label">Significato:</span>
                      <span className="field-value">{fullBookingData.meaning}</span>
                    </div>
                  )}

                  {fullBookingData.reference_images && fullBookingData.reference_images.length > 0 && (
                    <div className="booking-field reference-images">
                      <span className="field-label">Riferimenti:</span>
                      <div className="reference-images-container">
                        {fullBookingData.reference_images.map((imageUrl, index) => (
                          <div key={index} className="reference-image">
                            <img
                              src={imageUrl}
                              alt={`Riferimento ${index + 1}`}
                              className="reference-image-preview"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="booking-field">
                    <span className="field-label">Budget:</span>
                    <span className="field-value budget">{formatBudget()}</span>
                  </div>
                </>
              )}
            </>
          )}
      </div>
      
      <div className="booking-footer">
        <span className="booking-time">
          {isArtistAppointment ? `Appuntamento creato il ${formatTime(timestamp)}` : `Richiesta creata il ${formatTime(timestamp)}`}
        </span>
      </div>
    </div>
  )

  // Return with or without message wrapper based on mode
  if (mode === 'appointment') {
    return (
      <>
        {cardContent}
        <AppointmentDetailsOverlay
          isOpen={showDetailsOverlay}
          onClose={() => setShowDetailsOverlay(false)}
          userType={profile?.profile_type === 'artist' ? 'artist' : 'client'}
          artistName={profile?.profile_type === 'client' ? participantName : undefined}
          clientName={profile?.profile_type === 'artist' ? participantName : undefined}
          bookingId={bookingId}
          onBookingUpdated={() => {
            fetchBookingData()
            if (onBookingUpdated) {
              onBookingUpdated()
            }
          }}
        />
      </>
    )
  }

  return (
    <div className={`message ${isFromCurrentUser ? 'sent' : 'received'}`}>
      {cardContent}
    </div>
  )
}