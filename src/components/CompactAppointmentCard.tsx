import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AppointmentDetailsOverlay } from './AppointmentDetailsOverlay'
import './CompactAppointmentCard.css'

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
  appointment_date?: string
  appointment_duration?: number
  deposit_amount?: number
  total_amount?: number
  artist_notes?: string
}

interface CompactAppointmentCardProps {
  bookingId: string
  participantName?: string
  refreshTrigger?: number
  onBookingUpdated?: () => void
  showParticipants?: boolean
}

export function CompactAppointmentCard({
  bookingId,
  participantName,
  refreshTrigger,
  onBookingUpdated,
  showParticipants = false
}: CompactAppointmentCardProps) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [fullBookingData, setFullBookingData] = useState<BookingRequestData | null>(null)
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false)

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!user || !bookingId) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle()

        if (data) {
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
            total_amount: data.total_amount,
            artist_notes: data.artist_notes
          })
        } else {
          setFullBookingData(null)
        }
      } catch {
        setFullBookingData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [bookingId, user, refreshTrigger])

  const formatAppointmentDate = () => {
    if (!fullBookingData?.appointment_date) return ''
    const date = new Date(fullBookingData.appointment_date)
    return {
      date: date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }),
      time: date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
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

  const handleCardClick = () => {
    setShowDetailsOverlay(true)
  }

  const isArtistAppointment = !!(fullBookingData?.appointment_date || fullBookingData?.deposit_amount || fullBookingData?.total_amount)

  if (loading) {
    return (
      <div className="compact-appointment-card loading">
        <div className="loading-content">
          <div className="loading-line"></div>
          <div className="loading-line short"></div>
        </div>
      </div>
    )
  }

  const appointmentDateTime = formatAppointmentDate()

  return (
    <>
      <div className="compact-appointment-card clickable" onClick={handleCardClick}>
        <div className="appointment-main">
          {/* Date and Time - Most prominent */}
          {isArtistAppointment && appointmentDateTime && (
            <div className="appointment-datetime">
              <div className="appointment-date">{appointmentDateTime.date}</div>
              <div className="appointment-time">{appointmentDateTime.time}</div>
            </div>
          )}

          {/* Subject and participant */}
          <div className="appointment-info">
            {participantName && (
              <div className="participant-name">
                {profile?.profile_type === 'artist' ? participantName : `con ${participantName}`}
              </div>
            )}
            {fullBookingData && (
              <div className="appointment-subject">{fullBookingData.subject}</div>
            )}
          </div>
        </div>

        {/* Secondary details - smaller, less prominent */}
        <div className="appointment-details">
          {isArtistAppointment ? (
            <div className="appointment-meta">
              {fullBookingData?.appointment_duration && (
                <span className="detail-item">⏱ {formatDuration()}</span>
              )}
              {fullBookingData?.total_amount && (
                <span className="detail-item total">
                  <span className="price-label">Totale</span>
                  <span className="price-value">€{fullBookingData.total_amount}</span>
                </span>
              )}
              {fullBookingData?.deposit_amount && (
                <span className="detail-item deposit">
                  <span className="price-label">Acconto</span>
                  <span className="price-value">€{fullBookingData.deposit_amount}</span>
                </span>
              )}
            </div>
          ) : (
            <div className="appointment-meta">
              {fullBookingData?.body_area && (
                <span className="detail-item">📍 {fullBookingData.body_area}</span>
              )}
              {fullBookingData?.size_category && (
                <span className="detail-item">📏 {fullBookingData.size_category}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <AppointmentDetailsOverlay
        isOpen={showDetailsOverlay}
        onClose={() => setShowDetailsOverlay(false)}
        userType={profile?.profile_type === 'artist' ? 'artist' : 'client'}
        artistName={profile?.profile_type === 'client' ? participantName : undefined}
        clientName={profile?.profile_type === 'artist' ? participantName : undefined}
        bookingId={bookingId}
        showParticipants={showParticipants}
        onBookingUpdated={() => {
          if (onBookingUpdated) {
            onBookingUpdated()
          }
        }}
      />
    </>
  )
}