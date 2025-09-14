import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
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
  bookingData: BookingRequestData
  bookingId?: string  // booking_id viene passato separatamente
  isFromCurrentUser?: boolean
  timestamp: string
  mode?: 'message' | 'appointment' // New prop to control rendering mode
  participantName?: string // For appointment mode
}

export function BookingRequestCard({ bookingData, bookingId, isFromCurrentUser, timestamp, mode = 'message', participantName }: BookingRequestCardProps) {
  const { user } = useAuth()
  const [currentStatus, setCurrentStatus] = useState<string>('pending')
  const [loading, setLoading] = useState(true)

  // Fetch status dinamicamente dal database
  useEffect(() => {
    const fetchStatus = async () => {
      // Skip fetching if user is not authenticated or no bookingId
      if (!user || !bookingId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .maybeSingle()

        if (error) {
          console.warn('Error fetching booking status:', error)
          setCurrentStatus('pending')
        } else {
          setCurrentStatus(data?.status || 'pending')
        }
      } catch (error) {
        console.warn('Error fetching booking status:', error)
        setCurrentStatus('pending')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [bookingId, user])

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
    if (bookingData.budget_min && bookingData.budget_max) {
      return `€${bookingData.budget_min} - €${bookingData.budget_max}`
    } else if (bookingData.budget_min) {
      return `da €${bookingData.budget_min}`
    } else if (bookingData.budget_max) {
      return `fino a €${bookingData.budget_max}`
    }
    return 'Budget da definire'
  }

  const formatAppointmentDate = () => {
    if (!bookingData.appointment_date) return ''
    const date = new Date(bookingData.appointment_date)
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
    if (!bookingData.appointment_duration) return ''
    const hours = Math.floor(bookingData.appointment_duration / 60)
    const minutes = bookingData.appointment_duration % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${minutes}min`
    }
  }

  // Check if this is an artist appointment (has appointment-specific fields)
  const isArtistAppointment = !!(bookingData.appointment_date || bookingData.deposit_amount)

  const getStatusBadge = () => {
    // Mostra loading mentre carica lo status
    if (loading) {
      return <span className="status-badge pending">Caricamento...</span>
    }
    
    
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
      case 'completed':
        return <span className="status-badge accepted">Completato</span>
      default:
        return <span className="status-badge pending">In attesa</span>
    }
  }

  const cardContent = (
    <div className="booking-request-card">
      <div className="booking-header">
        <div className="booking-title-container">
          <div className="booking-title">
            <span className="booking-icon">{isArtistAppointment ? '📅' : '📝'}</span>
            <h4>{isArtistAppointment ? 'Appuntamento Fissato' : 'Richiesta Tatuaggio'}</h4>
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
            <span className="field-label">{isArtistAppointment ? 'Cliente' : 'Artista'}:</span>
            <span className="field-value">{participantName}</span>
          </div>
        )}
        
        <div className="booking-field">
          <span className="field-label">Soggetto:</span>
          <span className="field-value">{bookingData.subject}</span>
        </div>
          
          {isArtistAppointment ? (
            // Artist appointment specific fields
            <>
              {bookingData.appointment_date && (
                <div className="booking-field">
                  <span className="field-label">Data e Ora:</span>
                  <span className="field-value">{formatAppointmentDate()}</span>
                </div>
              )}
              
              {bookingData.appointment_duration && (
                <div className="booking-field">
                  <span className="field-label">Durata:</span>
                  <span className="field-value">{formatDuration()}</span>
                </div>
              )}
              
              {bookingData.deposit_amount && (
                <div className="booking-field">
                  <span className="field-label">Acconto:</span>
                  <span className="field-value budget">€{bookingData.deposit_amount}</span>
                </div>
              )}
              
              {bookingData.artist_notes && (
                <div className="booking-field">
                  <span className="field-label">Note Artista:</span>
                  <span className="field-value">{bookingData.artist_notes}</span>
                </div>
              )}
            </>
          ) : (
            // Client request specific fields
            <>
              {bookingData.tattoo_style && (
                <div className="booking-field">
                  <span className="field-label">Stile:</span>
                  <span className="field-value">{bookingData.tattoo_style}</span>
                </div>
              )}
              
              {bookingData.body_area && (
                <div className="booking-field">
                  <span className="field-label">Zona:</span>
                  <span className="field-value">{bookingData.body_area}</span>
                </div>
              )}
              
              {bookingData.size_category && (
                <div className="booking-field">
                  <span className="field-label">Dimensioni:</span>
                  <span className="field-value">{bookingData.size_category}</span>
                </div>
              )}
              
              {bookingData.color_preferences && (
                <div className="booking-field">
                  <span className="field-label">Colore:</span>
                  <span className="field-value">{bookingData.color_preferences}</span>
                </div>
              )}
              
              {bookingData.meaning && (
                <div className="booking-field">
                  <span className="field-label">Significato:</span>
                  <span className="field-value">{bookingData.meaning}</span>
                </div>
              )}
              
              {bookingData.reference_images && bookingData.reference_images.length > 0 && (
                <div className="booking-field reference-images">
                  <span className="field-label">Riferimenti:</span>
                  <div className="reference-images-container">
                    {bookingData.reference_images.map((imageUrl, index) => (
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
      </div>
      
      <div className="booking-footer">
        <span className="booking-time">{formatTime(timestamp)}</span>
      </div>
    </div>
  )

  // Return with or without message wrapper based on mode
  if (mode === 'appointment') {
    return cardContent
  }

  return (
    <div className={`message ${isFromCurrentUser ? 'sent' : 'received'}`}>
      {cardContent}
    </div>
  )
}