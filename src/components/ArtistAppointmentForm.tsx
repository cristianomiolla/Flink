import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import './FormOverlay.css'
import './Dropdown.css'

interface ArtistAppointmentFormProps {
  clientId: string
  clientName: string
  onClose: () => void
  onAppointmentCreated?: () => void
  existingSubject?: string
  sendMessage?: (receiverId: string, content: string) => Promise<boolean>
}

export function ArtistAppointmentForm({
  clientId,
  clientName,
  onClose,
  onAppointmentCreated,
  existingSubject = '',
  sendMessage
}: ArtistAppointmentFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false)
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false)

  const [appointmentForm, setAppointmentForm] = useState({
    subject: existingSubject,
    appointment_date: '',
    appointment_time: '',
    appointment_duration: '60',
    deposit_amount: '',
    total_amount: '',
    artist_notes: ''
  })

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (durationDropdownOpen || timeDropdownOpen) {
        const dropdown = target.closest('.custom-dropdown')
        if (!dropdown) {
          setDurationDropdownOpen(false)
          setTimeDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [durationDropdownOpen, timeDropdownOpen])

  const durationOptions = [
    { value: '30', label: '30 minuti' },
    { value: '60', label: '1 ora' },
    { value: '90', label: '1 ora e 30' },
    { value: '120', label: '2 ore' },
    { value: '150', label: '2 ore e 30' },
    { value: '180', label: '3 ore' },
    { value: '240', label: '4 ore' },
    { value: '300', label: '5 ore' },
    { value: '360', label: '6 ore' }
  ]

  // Generate time options (every 30 minutes from 8:00 to 20:00)
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push({ value: timeValue, label: timeValue })
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Devi essere autenticato')
      return
    }

    if (!appointmentForm.subject || !appointmentForm.appointment_date || !appointmentForm.appointment_time || !appointmentForm.deposit_amount || !appointmentForm.total_amount) {
      setError('Compila tutti i campi obbligatori')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Combine date and time into ISO format
      const appointmentDateTime = `${appointmentForm.appointment_date}T${appointmentForm.appointment_time}:00`
      
      // First, try to find an existing pending booking between these users
      const { data: existingBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('id')
        .or(`and(client_id.eq.${clientId},artist_id.eq.${user.id}),and(client_id.eq.${user.id},artist_id.eq.${clientId})`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        // Error fetching existing booking
        setError('Errore nel recuperare la prenotazione esistente.')
        return
      }

      const appointmentData = {
        subject: appointmentForm.subject,
        appointment_date: appointmentDateTime,
        appointment_duration: parseInt(appointmentForm.appointment_duration),
        deposit_amount: parseFloat(appointmentForm.deposit_amount),
        total_amount: parseFloat(appointmentForm.total_amount),
        artist_notes: appointmentForm.artist_notes || null,
        status: 'scheduled'
      }

      let insertedData

      if (existingBooking) {
        // Update existing pending booking
        const { data, error: updateError } = await supabase
          .from('bookings')
          .update(appointmentData)
          .eq('id', existingBooking.id)
          .select()

        if (updateError) {
          // Error updating appointment
          setError('Errore nell\'invio dell\'appuntamento. Riprova.')
          return
        }
        insertedData = data
      } else {
        // Create new booking if no pending one exists
        const fullAppointmentData = {
          client_id: clientId,
          artist_id: user.id,
          ...appointmentData
        }

        const { data, error: insertError } = await supabase
          .from('bookings')
          .insert([fullAppointmentData])
          .select()

        if (insertError) {
          // Error saving appointment
          setError('Errore nell\'invio dell\'appuntamento. Riprova.')
          return
        }
        insertedData = data
      }

      // Create a message in the conversation with the appointment data
      if (insertedData && insertedData[0] && sendMessage) {
        const appointmentMessage = JSON.stringify({
          type: 'appointment_scheduled',
          booking_id: insertedData[0].id
        })
        
        // Send the appointment message to the client
        try {
          await sendMessage(clientId, appointmentMessage)
        } catch (messageError) {
          // Error sending appointment message
          // Don't fail the appointment creation if message sending fails
        }
      }

      // Success - call callbacks and close
      if (onAppointmentCreated) {
        onAppointmentCreated()
      }
      
      onClose()
    } catch (error) {
      // Error creating appointment
      setError('Errore nell\'invio dell\'appuntamento. Riprova.')
    } finally {
      setLoading(false)
    }
  }


  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Close any open dropdowns first
      setDurationDropdownOpen(false)
      setTimeDropdownOpen(false)
      // Then close the modal
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header-sticky">
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="auth-modal-header"></div>
        <div className="auth-content">
          <div className="header-card">
            <h2>Crea Appuntamento</h2>
            <p>Crea un nuovo appuntamento con {clientName}</p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="subject" className="form-label">
                OGGETTO DEL TATUAGGIO <span className="required-indicator">*</span>
              </label>
              <input
                id="subject"
                className="form-input"
                placeholder="Es. Rosa con spine, leone, scritta..."
                maxLength={200}
                type="text"
                value={appointmentForm.subject}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
              <div className="form-help">
                {existingSubject ? 'Puoi modificare l\'oggetto se necessario' : 'Descrivi il tatuaggio da realizzare'}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="appointment_date" className="form-label">
                DATA APPUNTAMENTO <span className="required-indicator">*</span>
              </label>
              <input
                id="appointment_date"
                className="form-input"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={appointmentForm.appointment_date}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                ORARIO APPUNTAMENTO <span className="required-indicator">*</span>
              </label>
              <div className="custom-dropdown">
                <button
                  type="button"
                  className="dropdown-trigger"
                  onClick={() => {
                    setTimeDropdownOpen(!timeDropdownOpen)
                    setDurationDropdownOpen(false)
                  }}
                >
                  <span className="dropdown-text">
                    {appointmentForm.appointment_time 
                      ? timeOptions.find(opt => opt.value === appointmentForm.appointment_time)?.label || 'Seleziona orario'
                      : 'Seleziona orario'
                    }
                  </span>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                {timeDropdownOpen && (
                  <div className="dropdown-menu select-dropdown-menu">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dropdown-item ${appointmentForm.appointment_time === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setAppointmentForm(prev => ({ ...prev, appointment_time: option.value }))
                          setTimeDropdownOpen(false)
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
              <label htmlFor="appointment_duration" className="form-label">
                DURATA APPUNTAMENTO
              </label>
              <div className="custom-dropdown">
                <button
                  type="button"
                  className="dropdown-trigger"
                  onClick={() => {
                    setDurationDropdownOpen(!durationDropdownOpen)
                    setTimeDropdownOpen(false)
                  }}
                >
                  <span className="dropdown-text">
                    {appointmentForm.appointment_duration 
                      ? durationOptions.find(opt => opt.value === appointmentForm.appointment_duration)?.label || 'Seleziona durata'
                      : 'Seleziona durata'
                    }
                  </span>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                {durationDropdownOpen && (
                  <div className="dropdown-menu select-dropdown-menu">
                    {durationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dropdown-item ${appointmentForm.appointment_duration === option.value ? 'active' : ''}`}
                        onClick={() => {
                          setAppointmentForm(prev => ({ ...prev, appointment_duration: option.value }))
                          setDurationDropdownOpen(false)
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
              <label htmlFor="total_amount" className="form-label">
                PREZZO TOTALE TATUAGGIO (€) <span className="required-indicator">*</span>
              </label>
              <input
                id="total_amount"
                className="form-input"
                placeholder="Es. 200"
                type="number"
                min="0"
                step="10"
                value={appointmentForm.total_amount}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, total_amount: e.target.value }))}
                required
              />
              <div className="form-help">Prezzo totale concordato per il tatuaggio</div>
            </div>

            <div className="form-group">
              <label htmlFor="deposit_amount" className="form-label">
                ACCONTO RICHIESTO (€) <span className="required-indicator">*</span>
              </label>
              <input
                id="deposit_amount"
                className="form-input"
                placeholder="Es. 50"
                type="number"
                min="0"
                step="10"
                value={appointmentForm.deposit_amount}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, deposit_amount: e.target.value }))}
                required
              />
              <div className="form-help">Importo dell'acconto richiesto al cliente</div>
            </div>

            <div className="form-group">
              <label htmlFor="artist_notes" className="form-label">
                NOTE/INDICAZIONI
              </label>
              <textarea
                id="artist_notes"
                className="form-textarea"
                placeholder="Note aggiuntive per il cliente (preparazione, materiali necessari, etc.)"
                rows={4}
                maxLength={500}
                value={appointmentForm.artist_notes}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, artist_notes: e.target.value }))}
              />
              <div className="char-count">{appointmentForm.artist_notes.length}/500 caratteri</div>
            </div>

            <div className="form-actions">
              <button type="button" className="action-btn" onClick={onClose}>
                <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
                <span className="action-text">Annulla</span>
              </button>
              <button
                type="submit"
                className="action-btn primary"
                disabled={loading || !appointmentForm.subject.trim() || !appointmentForm.appointment_date || !appointmentForm.appointment_time || !appointmentForm.total_amount || !appointmentForm.deposit_amount || parseFloat(appointmentForm.total_amount) <= 0 || parseFloat(appointmentForm.deposit_amount) <= 0}
              >
                <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span className="action-text">
                  {loading ? 'Invio...' : 'Crea'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}