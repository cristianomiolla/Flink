import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppointments } from '../hooks/useAppointments'
import { useAuth } from '../hooks/useAuth'
import { SearchBar } from './SearchBar'
import LoadingSpinner from './LoadingSpinner'
import { CompactAppointmentCard } from './CompactAppointmentCard'
import './CompactAppointmentCard.css'
import './AppointmentsPage.css'
import './Header.css'
import './PageHeader.css'

type FilterType = 'programmati' | 'completati' | 'cancellati'

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { appointments, loading, error, refreshAppointments } = useAppointments()
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('programmati')

  const handleLogoClick = () => {
    navigate('/')
  }

  // Filter appointments based on selected chip
  const filteredAppointments = appointments.filter(appointment => {
    switch (selectedFilter) {
      case 'programmati':
        return appointment.status === 'scheduled' || appointment.status === 'rescheduled'
      case 'completati':
        return appointment.status === 'completed'
      case 'cancellati':
        return appointment.status === 'cancelled'
      default:
        return true
    }
  }).sort((a, b) => {
    // Sort by appointment date/time (most recent first)
    // If appointment_date is null, fall back to created_at
    const dateA = a.appointment_date ? new Date(a.appointment_date) : new Date(a.created_at)
    const dateB = b.appointment_date ? new Date(b.appointment_date) : new Date(b.created_at)

    return dateB.getTime() - dateA.getTime() // Most recent first
  })

  const getFilterCounts = () => {
    const programmati = appointments.filter(a => a.status === 'scheduled' || a.status === 'rescheduled').length
    const completati = appointments.filter(a => a.status === 'completed').length
    const cancellati = appointments.filter(a => a.status === 'cancelled').length
    return { programmati, completati, cancellati }
  }

  const filterCounts = getFilterCounts()


  if (loading) {
    return (
      <div className="page-container">
        <SearchBar onLogoClick={handleLogoClick} hideOnMobile={true} />
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <SearchBar onLogoClick={handleLogoClick} hideOnMobile={true} />
        <div className="container">
          <div className="error-state">
            <div className="error-content">
              <p className="error-message">Errore nel caricamento degli appuntamenti: {error}</p>
              <button 
                className="btn btn-accent retry-btn" 
                onClick={() => window.location.reload()}
                style={{ marginTop: '1.5rem' }}
              >
                Riprova
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <SearchBar onLogoClick={handleLogoClick} hideOnMobile={true} />
      
      <div className="container">
        {/* Empty state - outside page-content */}
        {appointments.length === 0 && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">📅</div>
              <h2 className="empty-title">Nessun appuntamento</h2>
              <p className="empty-description">
                {profile?.profile_type === 'artist' 
                  ? 'Non hai ancora ricevuto richieste di appuntamento. Completa il tuo profilo per attirare nuovi clienti.'
                  : 'Non hai ancora prenotato nessun appuntamento. Esplora i portfolio degli artisti e prenota il tuo primo tatuaggio.'}
              </p>
              <button 
                className="action-btn" 
                style={{ marginTop: '1.5rem' }}
                onClick={() => navigate(profile?.profile_type === 'artist' ? '/profile' : '/')}
              >
                {profile?.profile_type === 'artist' ? 'Completa Profilo' : 'Esplora Portfolio'}
              </button>
            </div>
          </div>
        )}

        {/* Content area only when there are appointments */}
        {appointments.length > 0 && (
          <div className="page-content">
            <div className="page-header">
              <div className="header-card">
                <h2>I MIEI APPUNTAMENTI</h2>
                <p>{profile?.profile_type === 'artist'
                    ? 'Gestisci le richieste dei tuoi clienti'
                    : 'Tieni traccia delle tue prenotazioni'}</p>
              </div>

              {/* Filter Chips */}
              <div className="filter-chips">
                <button
                  className={`filter-chip ${selectedFilter === 'programmati' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('programmati')}
                >
                  Programmati ({filterCounts.programmati})
                </button>
                <button
                  className={`filter-chip ${selectedFilter === 'completati' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('completati')}
                >
                  Completati ({filterCounts.completati})
                </button>
                <button
                  className={`filter-chip ${selectedFilter === 'cancellati' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('cancellati')}
                >
                  Cancellati ({filterCounts.cancellati})
                </button>
              </div>
            </div>

            <div className="appointments-content">
              <div className="appointments-list">
                {filteredAppointments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-content">
                      <div className="empty-icon">📅</div>
                      <h3 className="empty-title">Nessun appuntamento {selectedFilter}</h3>
                      <p className="empty-description">
                        Non hai appuntamenti {selectedFilter === 'programmati' ? 'programmati' : selectedFilter} al momento.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredAppointments.map((appointment) => (
                  <CompactAppointmentCard
                    key={appointment.id}
                    bookingId={appointment.id}
                    participantName={
                      profile?.profile_type === 'artist'
                        ? (appointment.client_profile?.full_name || 'Cliente')
                        : (appointment.artist_profile?.username || appointment.artist_profile?.full_name || 'Artista')
                    }
                    showParticipants={true}
                    onBookingUpdated={refreshAppointments}
                  />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}