import './BookingProgressTracker.css'

type BookingStatus = 'pending' | 'expired' | 'rejected' | 'scheduled' | 'rescheduled' | 'cancelled' | 'completed'

interface BookingProgressTrackerProps {
  status: BookingStatus
  userType: 'client' | 'artist'
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
    rejected: {
      client: { text: 'RICHIESTA RIFIUTATA', icon: '❌', color: 'error' },
      artist: { text: 'RICHIESTA RIFIUTATA', icon: '❌', color: 'error' }
    },
    scheduled: {
      client: { text: 'APPUNTAMENTO FISSATO', icon: '✅', color: 'success' },
      artist: { text: 'APPUNTAMENTO FISSATO', icon: '✅', color: 'success' }
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

export function BookingProgressTracker({ status, userType }: BookingProgressTrackerProps) {
  const statusDisplay = getStatusDisplay(status, userType)

  // Artists with pending status should not show progress tracker at all
  // They should see the pinned action button instead
  if (status === 'pending' && userType === 'artist') {
    return null
  }

  return (
    <div className={`booking-progress-tracker ${statusDisplay.color}`}>
      <div className="progress-content">
        <span className="progress-icon">{statusDisplay.icon}</span>
        <span className="progress-text">{statusDisplay.text}</span>
      </div>
    </div>
  )
}