import { useState } from 'react'
import './BookingProgressTracker.css'
import { AppointmentDetailsOverlay } from './AppointmentDetailsOverlay'

type BookingStatus = 'pending' | 'expired' | 'scheduled' | 'rescheduled' | 'cancelled' | 'completed'

interface BookingProgressTrackerProps {
  status: BookingStatus
  userType: 'client' | 'artist'
  appointmentDate?: string
  artistName?: string
  clientName?: string
  artistId?: string
  currentUserId?: string
  bookingId?: string
  onBookingUpdated?: () => void
  showParticipants?: boolean
}

const getStatusDisplay = (status: BookingStatus, userType: 'client' | 'artist') => {
  const statusMap = {
    pending: {
      client: { text: 'RICHIESTA INVIATA', icon: '⏳', color: 'warning' },
      artist: { text: 'RICHIESTA RICEVUTA', icon: '📬', color: 'info' }
    },
    expired: {
      client: { text: 'RICHIESTA SCADUTA', icon: '⏰', color: 'muted' },
      artist: { text: 'RICHIESTA SCADUTA', icon: '⏰', color: 'muted' }
    },
    scheduled: {
      client: { text: 'APPUNTAMENTO PROGRAMMATO', icon: '✅', color: 'success' },
      artist: { text: 'APPUNTAMENTO PROGRAMMATO', icon: '✅', color: 'success' }
    },
    rescheduled: {
      client: { text: 'APPUNTAMENTO MODIFICATO', icon: '🔄', color: 'info' },
      artist: { text: 'APPUNTAMENTO MODIFICATO', icon: '🔄', color: 'info' }
    },
    cancelled: {
      client: { text: 'APPUNTAMENTO ANNULLATO', icon: '🚫', color: 'error' },
      artist: { text: 'APPUNTAMENTO ANNULLATO', icon: '🚫', color: 'error' }
    },
    completed: {
      client: { text: 'TATTOO COMPLETATO', icon: '🎉', color: 'success' },
      artist: { text: 'TATTOO COMPLETATO', icon: '🎉', color: 'success' }
    }
  }

  return statusMap[status][userType]
}

export function BookingProgressTracker({
  status,
  userType,
  artistName,
  clientName,
  artistId,
  currentUserId,
  bookingId,
  onBookingUpdated,
  showParticipants = false
}: BookingProgressTrackerProps) {
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false)
  const statusDisplay = getStatusDisplay(status, userType)

  // Artists with pending status should not show progress tracker at all
  // They should see the pinned action button instead
  if (status === 'pending' && userType === 'artist') {
    return null
  }

  const handleClick = () => {
    // Open overlay for scheduled, rescheduled, pending, cancelled, and completed appointments
    if (status === 'scheduled' || status === 'rescheduled' || status === 'pending' || status === 'cancelled' || status === 'completed') {
      setShowDetailsOverlay(true)
    }
  }

  return (
    <>
      <div className={`booking-progress-tracker ${statusDisplay.color}`}>
        <div
          className={`progress-content ${(status === 'scheduled' || status === 'rescheduled' || status === 'pending' || status === 'cancelled' || status === 'completed') ? 'clickable' : ''}`}
          onClick={handleClick}
        >
          <span className="progress-icon">{statusDisplay.icon}</span>
          <span className="progress-text">{statusDisplay.text}</span>
        </div>
      </div>

      <AppointmentDetailsOverlay
        isOpen={showDetailsOverlay}
        onClose={() => setShowDetailsOverlay(false)}
        userType={userType}
        artistName={artistName}
        clientName={clientName}
        artistId={artistId}
        currentUserId={currentUserId}
        bookingId={bookingId}
        showParticipants={showParticipants}
        onBookingUpdated={onBookingUpdated}
      />
    </>
  )
}