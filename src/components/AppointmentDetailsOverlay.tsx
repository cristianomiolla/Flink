import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import './AuthOverlay.css'

interface BookingData {
  id: string
  subject: string
  tattoo_style?: string
  body_area?: string
  size_category?: string
  color_preferences?: string
  meaning?: string
  budget_min?: number
  budget_max?: number
  reference_images?: string[] | null
  appointment_date?: string
  appointment_duration?: number
  deposit_amount?: number
  artist_notes?: string
  status: string
  created_at: string
}

interface AppointmentDetailsOverlayProps {
  isOpen: boolean
  onClose: () => void
  userType: 'client' | 'artist'
  appointmentDate?: string
  artistName?: string
  clientName?: string
  artistId?: string
  currentUserId?: string
  bookingId?: string
}

export function AppointmentDetailsOverlay({
  isOpen,
  onClose,
  userType,
  appointmentDate,
  artistName,
  clientName,
  artistId,
  currentUserId,
  bookingId
}: AppointmentDetailsOverlayProps) {
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)

  // Fetch booking data from database
  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
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
          console.error('Error fetching booking data:', error)
        } else if (data) {
          setBookingData(data)
        }
      } catch (error) {
        console.error('Error fetching booking data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchBookingData()
    }
  }, [bookingId, isOpen])

  // Check if current user is the artist who created the appointment
  const isAppointmentCreator = artistId && currentUserId && artistId === currentUserId

  if (!isOpen) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data da confermare'
    const date = new Date(dateString)
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
    if (!bookingData?.appointment_duration) return ''
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

  const formatCreatedDate = () => {
    if (!bookingData?.created_at) return ''
    const date = new Date(bookingData.created_at)
    return date.toLocaleString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusDisplay = () => {
    if (loading || !bookingData) return 'Caricamento...'

    switch (bookingData.status) {
      case 'scheduled':
        return 'Programmato'
      case 'completed':
        return 'Completato'
      default:
        return 'Confermato'
    }
  }

  const handleModifyAppointment = () => {
    // TODO: Add modify appointment functionality
    alert('Funzionalità di modifica in arrivo')
  }

  const handleCancelAppointment = () => {
    setShowCancelConfirmation(true)
  }

  const handleConfirmCancellation = () => {
    if (!bookingId) return
    // TODO: Add cancel appointment functionality
    alert('Funzionalità di cancellazione in arrivo')
    setShowCancelConfirmation(false)
    onClose()
  }

  const handleCancelCancellation = () => {
    setShowCancelConfirmation(false)
  }

  return createPortal(
    <>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content auth-modal">
          <div className="auth-header-sticky">
            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="auth-modal-header">
          </div>

          <div className="auth-content">
          <div className="header-card">
            <h2>DETTAGLI APPUNTAMENTO</h2>
            <p>Il tuo appuntamento è stato confermato</p>
          </div>

          <div className="appointment-details-content">
            {loading ? (
              <div className="detail-item">
                <div className="detail-value">Caricamento dati appuntamento...</div>
              </div>
            ) : bookingData ? (
              <>
                {userType === 'client' && artistName && (
                  <div className="detail-item">
                    <div className="detail-label">Artista</div>
                    <div className="detail-value">
                      {artistName}
                    </div>
                  </div>
                )}

                {userType === 'artist' && clientName && (
                  <div className="detail-item">
                    <div className="detail-label">Cliente</div>
                    <div className="detail-value">
                      {clientName}
                    </div>
                  </div>
                )}

                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value success">
                    <span className="status-icon">✅</span>
                    {getStatusDisplay()}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Soggetto</div>
                  <div className="detail-value">
                    {bookingData.subject}
                  </div>
                </div>

                {bookingData.appointment_date && (
                  <div className="detail-item">
                    <div className="detail-label">Data e Ora</div>
                    <div className="detail-value">
                      {formatDate(bookingData.appointment_date)}
                    </div>
                  </div>
                )}

                {bookingData.appointment_duration && (
                  <div className="detail-item">
                    <div className="detail-label">Durata</div>
                    <div className="detail-value">
                      {formatDuration()}
                    </div>
                  </div>
                )}

                {bookingData.deposit_amount && (
                  <div className="detail-item">
                    <div className="detail-label">Acconto</div>
                    <div className="detail-value budget">
                      €{bookingData.deposit_amount}
                    </div>
                  </div>
                )}

                {bookingData.artist_notes && (
                  <div className="detail-item">
                    <div className="detail-label">Note Artista</div>
                    <div className="detail-value">
                      {bookingData.artist_notes}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="detail-item">
                <div className="detail-value">Errore nel caricamento dei dati.</div>
              </div>
            )}
          </div>

          {bookingData && (
            <div className="booking-footer" style={{ marginTop: '1rem', padding: '0.75rem', borderTop: '1px solid #eee', fontSize: '0.875rem', color: '#666' }}>
              <span>Richiesta creata il {formatCreatedDate()}</span>
            </div>
          )}

          {isAppointmentCreator && (
            <div className="form-actions">
              <button
                type="button"
                className="action-btn"
                onClick={handleModifyAppointment}
              >
                <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span className="action-text">Modifica</span>
              </button>

              <button
                type="button"
                className="action-btn"
                onClick={handleCancelAppointment}
              >
                <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
                <span className="action-text">Cancella</span>
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {showCancelConfirmation && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancelCancellation()}>
          <div className="modal-content auth-modal">
            <div className="auth-header-sticky">
              <button className="modal-close-btn" onClick={handleCancelCancellation}>
                ×
              </button>
            </div>

            <div className="auth-modal-header">
            </div>

            <div className="auth-content">
              <div className="header-card">
                <h2>CANCELLA APPUNTAMENTO</h2>
                <p>Sei sicuro di voler cancellare questo appuntamento? Questa azione non può essere annullata.</p>
              </div>

              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleConfirmCancellation(); }}>
                <div className="form-actions">
                  <button type="button" className="action-btn" onClick={handleCancelCancellation}>
                    <span className="action-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                      </svg>
                    </span>
                    <span className="action-text">Annulla</span>
                  </button>
                  <button type="submit" className="action-btn">
                    <span className="action-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </span>
                    <span className="action-text">Cancella</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}