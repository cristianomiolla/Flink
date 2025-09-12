import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppointments } from '../hooks/useAppointments'
import { useAuth } from '../hooks/useAuth'
import { SearchBar } from './SearchBar'
import LoadingSpinner from './LoadingSpinner'
import { BookingRequestCard } from './BookingRequestCard'
import './AppointmentsPage.css'
import './Header.css'
import './PageHeader.css'

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { appointments, loading, error } = useAppointments()

  const handleLogoClick = () => {
    navigate('/')
  }


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
            </div>

            <div className="appointments-content">
              <div className="appointments-list">
                {appointments.map((appointment) => (
                  <BookingRequestCard
                    key={appointment.id}
                    bookingData={{
                      subject: appointment.subject,
                      tattoo_style: appointment.tattoo_style,
                      body_area: appointment.body_area,
                      size_category: appointment.size_category,
                      color_preferences: appointment.color_preferences,
                      meaning: appointment.meaning,
                      budget_min: appointment.budget_min,
                      budget_max: appointment.budget_max,
                      reference_images: appointment.reference_images,
                      created_at: appointment.created_at,
                      appointment_date: appointment.appointment_date
                    }}
                    bookingId={appointment.id}
                    timestamp={appointment.created_at}
                    mode="appointment"
                    participantName={
                      profile?.profile_type === 'artist' 
                        ? appointment.client_profile?.full_name || appointment.client_profile?.username || 'Cliente'
                        : appointment.artist_profile?.full_name || appointment.artist_profile?.username || 'Artista'
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}