import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import './AuthOverlay.css'

interface BookingData {
  id: string
  client_id: string
  artist_id: string
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
  artistName?: string
  clientName?: string
  artistId?: string
  currentUserId?: string
  bookingId?: string
  onBookingUpdated?: () => void
}

export function AppointmentDetailsOverlay({
  isOpen,
  onClose,
  userType,
  artistName,
  clientName,
  artistId,
  bookingId,
  onBookingUpdated
}: AppointmentDetailsOverlayProps) {
  const { user } = useAuth()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [editFormData, setEditFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    appointment_duration: '',
    deposit_amount: '',
    artist_notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false)

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
          // Initialize edit form data
          const appointmentDateTime = data.appointment_date ? new Date(data.appointment_date) : null
          setEditFormData({
            appointment_date: appointmentDateTime ? appointmentDateTime.toISOString().slice(0, 10) : '',
            appointment_time: appointmentDateTime ? appointmentDateTime.toTimeString().slice(0, 5) : '',
            appointment_duration: data.appointment_duration?.toString() || '',
            deposit_amount: data.deposit_amount?.toString() || '',
            artist_notes: data.artist_notes || ''
          })
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isTimeDropdownOpen || isDurationDropdownOpen) {
        const target = event.target as Element
        const dropdown = target.closest('.custom-dropdown')
        if (!dropdown) {
          setIsTimeDropdownOpen(false)
          setIsDurationDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTimeDropdownOpen, isDurationDropdownOpen])

  // Check if current user is the artist who created the appointment
  // Use bookingData.artist_id if available, otherwise fall back to props
  const isAppointmentCreator = user && bookingData &&
    (artistId ? user.id === artistId : user.id === bookingData.artist_id)

  // Check if form data has been modified
  const hasChanges = () => {
    if (!bookingData) return false

    const appointmentDateTime = bookingData.appointment_date ? new Date(bookingData.appointment_date) : null
    const originalDate = appointmentDateTime ? appointmentDateTime.toISOString().slice(0, 10) : ''
    const originalTime = appointmentDateTime ? appointmentDateTime.toTimeString().slice(0, 5) : ''
    const originalDuration = bookingData.appointment_duration?.toString() || ''
    const originalDeposit = bookingData.deposit_amount?.toString() || ''
    const originalNotes = bookingData.artist_notes || ''

    return (
      editFormData.appointment_date !== originalDate ||
      editFormData.appointment_time !== originalTime ||
      editFormData.appointment_duration !== originalDuration ||
      editFormData.deposit_amount !== originalDeposit ||
      editFormData.artist_notes !== originalNotes
    )
  }

  // Check if appointment can be edited (only artists can edit, not cancelled/completed, and before appointment date)
  const canEditAppointment = () => {
    // Only artists can edit appointments, clients are always in read-only mode
    if (userType !== 'artist') return false
    if (bookingData?.status === 'cancelled' || bookingData?.status === 'completed') return false
    if (!bookingData?.appointment_date) return true
    const appointmentDate = new Date(bookingData.appointment_date)
    const now = new Date()
    return appointmentDate > now
  }

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
    if (loading || !bookingData) return { text: 'Caricamento...', icon: '⏳', className: 'pending' }

    switch (bookingData.status) {
      case 'pending':
        return { text: 'In attesa', icon: '⏳', className: 'pending' }
      case 'expired':
        return { text: 'Scaduta', icon: '⏰', className: 'expired' }
      case 'scheduled':
        return { text: 'Programmato', icon: '✅', className: 'accepted' }
      case 'rescheduled':
        return { text: 'Modificato', icon: '🔄', className: 'accepted' }
      case 'cancelled':
        return { text: 'Cancellato', icon: '🚫', className: 'declined' }
      case 'completed':
        return { text: 'Completato', icon: '🎉', className: 'accepted' }
      default:
        return { text: 'In attesa', icon: '⏳', className: 'pending' }
    }
  }


  const handleSaveChanges = async () => {
    if (!bookingId || !user) return

    setSaving(true)

    try {
      const updateData: Partial<BookingData> & { updated_at?: string } = {
        updated_at: new Date().toISOString()
      }

      // Check if appointment date or time has changed
      const appointmentDateTime = bookingData?.appointment_date ? new Date(bookingData.appointment_date) : null
      const originalDate = appointmentDateTime ? appointmentDateTime.toISOString().slice(0, 10) : ''
      const originalTime = appointmentDateTime ? appointmentDateTime.toTimeString().slice(0, 5) : ''

      let dateTimeChanged = false

      // Only update fields that have values
      if (editFormData.appointment_date && editFormData.appointment_time) {
        const combinedDateTime = new Date(`${editFormData.appointment_date}T${editFormData.appointment_time}`)
        updateData.appointment_date = combinedDateTime.toISOString()

        // Check if date or time has changed
        if (editFormData.appointment_date !== originalDate || editFormData.appointment_time !== originalTime) {
          dateTimeChanged = true
        }
      }
      if (editFormData.appointment_duration) {
        updateData.appointment_duration = parseInt(editFormData.appointment_duration)
      }
      if (editFormData.deposit_amount) {
        updateData.deposit_amount = parseFloat(editFormData.deposit_amount)
      }
      if (editFormData.artist_notes !== undefined) {
        updateData.artist_notes = editFormData.artist_notes
      }

      // If date or time changed, update status to 'rescheduled'
      if (dateTimeChanged && bookingData?.status === 'scheduled') {
        updateData.status = 'rescheduled'
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

      if (error) {
        console.error('Error updating appointment:', error)
        alert('Errore durante la modifica dell\'appuntamento. Riprova.')
        return
      }

      // Update local state
      setBookingData(prev => prev ? { ...prev, ...updateData } : null)

      // Notify parent component of booking update
      if (onBookingUpdated) {
        onBookingUpdated()
      }

      // Reset form data to match the updated booking data
      if (updateData.appointment_date) {
        const newDateTime = new Date(updateData.appointment_date)
        setEditFormData(prev => ({
          ...prev,
          appointment_date: newDateTime.toISOString().slice(0, 10),
          appointment_time: newDateTime.toTimeString().slice(0, 5)
        }))
      }

    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Errore durante la modifica dell\'appuntamento. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAppointment = () => {
    setShowCancelConfirmation(true)
  }

  const handleTimeSelect = (time: string) => {
    setEditFormData(prev => ({ ...prev, appointment_time: time }))
    setIsTimeDropdownOpen(false)
  }

  const toggleTimeDropdown = () => {
    setIsTimeDropdownOpen(prev => !prev)
  }

  const handleDurationSelect = (duration: string) => {
    setEditFormData(prev => ({ ...prev, appointment_duration: duration }))
    setIsDurationDropdownOpen(false)
  }

  const toggleDurationDropdown = () => {
    setIsDurationDropdownOpen(prev => !prev)
  }

  const formatDurationForDisplay = (minutes: string) => {
    if (!minutes) return '1 ora'
    const mins = parseInt(minutes)
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remainingMins = mins % 60
      if (remainingMins === 0) {
        return `${hours} ${hours === 1 ? 'ora' : 'ore'}`
      } else {
        return `${hours}h ${remainingMins}min`
      }
    }
    return `${mins} min`
  }

  const handleConfirmCancellation = async () => {
    if (!bookingId || !user) return

    setCancelling(true)

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) {
        console.error('Error cancelling appointment:', error)
        alert('Errore durante la cancellazione dell\'appuntamento. Riprova.')
        return
      }

      // Update local state
      setBookingData(prev => prev ? { ...prev, status: 'cancelled' } : null)

      // Notify parent component of booking update
      if (onBookingUpdated) {
        onBookingUpdated()
      }

      // Close overlays without showing alert
      setShowCancelConfirmation(false)
      onClose()

    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Errore durante la cancellazione dell\'appuntamento. Riprova.')
    } finally {
      setCancelling(false)
    }
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
            <h2>DETTAGLI {bookingData?.status === 'scheduled' || bookingData?.status === 'rescheduled' || bookingData?.status === 'completed' ? 'APPUNTAMENTO' : 'RICHIESTA'}</h2>
            <p>{bookingData?.status === 'completed'
              ? 'Tattoo completato con successo'
              : bookingData?.status === 'scheduled'
                ? 'Il tuo appuntamento è stato confermato'
                : bookingData?.status === 'rescheduled'
                  ? 'Il tuo appuntamento è stato modificato'
                  : bookingData?.status === 'pending'
                    ? 'La tua richiesta è in attesa di risposta'
                    : bookingData?.status === 'expired'
                        ? 'La tua richiesta è scaduta'
                        : bookingData?.status === 'cancelled'
                          ? 'Appuntamento cancellato'
                          : 'Dettagli della richiesta'}</p>
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
                  <div className="detail-label">Soggetto</div>
                  <div className="detail-value">
                    {bookingData.subject}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className={`detail-value ${getStatusDisplay().className}`}>
                    <span className="status-icon">{getStatusDisplay().icon}</span>
                    {getStatusDisplay().text}
                  </div>
                </div>

                {/* Show original request details only if appointment is not scheduled */}
                {bookingData.status !== 'scheduled' && bookingData.status !== 'rescheduled' && bookingData.status !== 'completed' && (
                  <>
                    <div className="detail-item">
                      <div className="detail-label">Soggetto</div>
                      <div className="detail-value">
                        {bookingData.subject}
                      </div>
                    </div>
                    {bookingData.tattoo_style && (
                      <div className="detail-item">
                        <div className="detail-label">Stile</div>
                        <div className="detail-value">
                          {bookingData.tattoo_style}
                        </div>
                      </div>
                    )}

                    {bookingData.body_area && (
                      <div className="detail-item">
                        <div className="detail-label">Zona</div>
                        <div className="detail-value">
                          {bookingData.body_area}
                        </div>
                      </div>
                    )}

                    {bookingData.size_category && (
                      <div className="detail-item">
                        <div className="detail-label">Dimensioni</div>
                        <div className="detail-value">
                          {bookingData.size_category}
                        </div>
                      </div>
                    )}

                    {bookingData.color_preferences && (
                      <div className="detail-item">
                        <div className="detail-label">Colore</div>
                        <div className="detail-value">
                          {bookingData.color_preferences}
                        </div>
                      </div>
                    )}

                    {(bookingData.budget_min || bookingData.budget_max) && (
                      <div className="detail-item">
                        <div className="detail-label">Budget</div>
                        <div className="detail-value budget">
                          {bookingData.budget_min && bookingData.budget_max
                            ? `€${bookingData.budget_min} - €${bookingData.budget_max}`
                            : bookingData.budget_min
                            ? `da €${bookingData.budget_min}`
                            : `fino a €${bookingData.budget_max}`}
                        </div>
                      </div>
                    )}

                    {bookingData.meaning && (
                      <div className="detail-item">
                        <div className="detail-label">Significato</div>
                        <div className="detail-value">
                          {bookingData.meaning}
                        </div>
                      </div>
                    )}

                    {bookingData.reference_images && bookingData.reference_images.length > 0 && (
                      <div className="detail-item">
                        <div className="detail-label">Riferimenti</div>
                        <div className="detail-value">
                          <div className="reference-images-container" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {bookingData.reference_images.map((imageUrl, index) => (
                              <div key={index} className="reference-image">
                                <img
                                  src={imageUrl}
                                  alt={`Riferimento ${index + 1}`}
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    border: '1px solid #ddd'
                                  }}
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {bookingData.appointment_date && (
                  <>
                    <div className="detail-item">
                      {isAppointmentCreator && canEditAppointment() ? (
                        <div className="form-group">
                          <label className="form-label">DATA APPUNTAMENTO</label>
                          <input
                            type="date"
                            className="form-input"
                            value={editFormData.appointment_date}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                            min={new Date().toISOString().slice(0, 10)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="detail-label">Data e Ora</div>
                          <div className="detail-value">
                            {formatDate(bookingData.appointment_date)}
                          </div>
                        </>
                      )}
                    </div>

                    {isAppointmentCreator && canEditAppointment() && (
                      <div className="detail-item">
                        <div className="form-group">
                          <label className="form-label">ORARIO APPUNTAMENTO</label>
                          <div className={`custom-dropdown ${isTimeDropdownOpen ? 'open' : ''}`}>
                            <button type="button" className="dropdown-trigger" onClick={toggleTimeDropdown}>
                              <span className="dropdown-text">
                                {editFormData.appointment_time || 'Seleziona orario'}
                              </span>
                              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="6,9 12,15 18,9"></polyline>
                              </svg>
                            </button>
                            {isTimeDropdownOpen && (
                              <div className="dropdown-menu select-dropdown-menu">
                                <div className="dropdown-item" onClick={() => handleTimeSelect('09:00')}>09:00</div>
                                <div className="dropdown-item" onClick={() => handleTimeSelect('10:00')}>10:00</div>
                                <div className="dropdown-item" onClick={() => handleTimeSelect('11:00')}>11:00</div>
                                <div className="dropdown-item" onClick={() => handleTimeSelect('14:00')}>14:00</div>
                                <div className="dropdown-item" onClick={() => handleTimeSelect('15:00')}>15:00</div>
                                <div className="dropdown-item" onClick={() => handleTimeSelect('16:00')}>16:00</div>
                                <div className="dropdown-item" onClick={() => handleTimeSelect('17:00')}>17:00</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {bookingData.appointment_duration && (
                  <div className="detail-item">
                    {isAppointmentCreator && canEditAppointment() ? (
                      <div className="form-group">
                        <label className="form-label">DURATA APPUNTAMENTO</label>
                        <div className={`custom-dropdown ${isDurationDropdownOpen ? 'open' : ''}`}>
                          <button type="button" className="dropdown-trigger" onClick={toggleDurationDropdown}>
                            <span className="dropdown-text">
                              {formatDurationForDisplay(editFormData.appointment_duration)}
                            </span>
                            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                          </button>
                          {isDurationDropdownOpen && (
                            <div className="dropdown-menu select-dropdown-menu">
                              <div className="dropdown-item" onClick={() => handleDurationSelect('30')}>30 min</div>
                              <div className="dropdown-item" onClick={() => handleDurationSelect('60')}>1 ora</div>
                              <div className="dropdown-item" onClick={() => handleDurationSelect('90')}>1h 30min</div>
                              <div className="dropdown-item" onClick={() => handleDurationSelect('120')}>2 ore</div>
                              <div className="dropdown-item" onClick={() => handleDurationSelect('180')}>3 ore</div>
                              <div className="dropdown-item" onClick={() => handleDurationSelect('240')}>4 ore</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="detail-label">Durata</div>
                        <div className="detail-value">
                          {formatDuration()}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(bookingData.deposit_amount || (isAppointmentCreator && canEditAppointment())) && (
                  <div className="detail-item">
                    {isAppointmentCreator && canEditAppointment() ? (
                      <div className="form-group">
                        <label className="form-label">ACCONTO RICHIESTO (€)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Es. 50"
                          value={editFormData.deposit_amount}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                          min="0"
                          step="10"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="detail-label">Acconto</div>
                        <div className="detail-value budget">
                          €{bookingData.deposit_amount}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {(bookingData.artist_notes || (isAppointmentCreator && canEditAppointment())) && (
                  <div className="detail-item">
                    {isAppointmentCreator && canEditAppointment() ? (
                      <div className="form-group">
                        <label className="form-label">NOTE/INDICAZIONI</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Note aggiuntive per il cliente (preparazione, materiali necessari, etc.)"
                          value={editFormData.artist_notes}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, artist_notes: e.target.value }))}
                          rows={4}
                          maxLength={500}
                        />
                        <div className="char-count">{editFormData.artist_notes.length}/500 caratteri</div>
                      </div>
                    ) : (
                      <>
                        <div className="detail-label">Note Artista</div>
                        <div className="detail-value">
                          {bookingData.artist_notes}
                        </div>
                      </>
                    )}
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
              <span>
                {bookingData.status === 'scheduled' || bookingData.status === 'rescheduled' || bookingData.status === 'completed'
                  ? 'Appuntamento creato il'
                  : 'Richiesta creata il'} {formatCreatedDate()}
              </span>
            </div>
          )}

          {isAppointmentCreator && userType === 'artist' && bookingData?.status !== 'cancelled' && bookingData?.status !== 'completed' && (
            <div className="form-actions">
              {hasChanges() && (
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17,21 17,13 7,13 7,21"></polyline>
                    <polyline points="7,3 7,8 15,8"></polyline>
                  </svg>
                  <span className="action-text">{saving ? 'Salvando...' : 'Salva'}</span>
                </button>
              )}

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
                  <button type="submit" className="action-btn" disabled={cancelling}>
                    <span className="action-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </span>
                    <span className="action-text">{cancelling ? 'Cancellazione...' : 'Cancella'}</span>
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