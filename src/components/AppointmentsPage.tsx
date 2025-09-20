import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppointments } from '../hooks/useAppointments'
import { useAuth } from '../hooks/useAuth'
import { SearchBar } from './SearchBar'
import LoadingSpinner from './LoadingSpinner'
import { CompactAppointmentCard } from './CompactAppointmentCard'
import { ManagementSidebar } from './ManagementSidebar'
import { MonthSlider } from './MonthSlider'
import { AppointmentChart } from './AppointmentChart'
import './CompactAppointmentCard.css'
import './AppointmentsPage.css'
import './Header.css'
import './PageHeader.css'
import './CategoryBar.css'

type FilterType = 'programmati' | 'completati' | 'cancellati'
type ManagementSection = 'appointments' | 'dashboard' | 'calendar'

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { appointments, loading, error, refreshAppointments } = useAppointments()
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('programmati')
  const [activeSection, setActiveSection] = useState<ManagementSection>('appointments')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

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

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const getMonthlyStats = () => {
    const monthlyAppointments = appointments.filter(appointment => {
      const appointmentDate = appointment.appointment_date ? new Date(appointment.appointment_date) : new Date(appointment.created_at)
      return appointmentDate.getFullYear() === selectedYear && appointmentDate.getMonth() === selectedMonth
    })

    const completedAppointments = monthlyAppointments.filter(a => a.status === 'completed')
    const scheduledAppointments = monthlyAppointments.filter(a => a.status === 'scheduled' || a.status === 'rescheduled')

    const completedEarnings = completedAppointments.reduce((total, appointment) => {
      return total + (appointment.total_amount || 0)
    }, 0)

    const scheduledEarnings = scheduledAppointments.reduce((total, appointment) => {
      return total + (appointment.total_amount || 0)
    }, 0)

    return {
      total: completedAppointments.length,
      scheduled: scheduledAppointments.length,
      completedEarnings,
      scheduledEarnings
    }
  }

  const monthlyStats = getMonthlyStats()


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

      {/* Artists get full management layout */}
      {profile?.profile_type === 'artist' ? (
        <div className={`appointments-container management-layout ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
            {/* Sidebar on left without padding */}
            {sidebarVisible && (
              <ManagementSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />
            )}

            {/* Dynamic content on right - hidden on mobile */}
            <div className="management-content">
              {/* Toggle button for sidebar */}
              <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarVisible(!sidebarVisible)}
                title={sidebarVisible ? 'Nascondi sidebar' : 'Mostra sidebar'}
              >
                {sidebarVisible ? '◀' : '▶'}
              </button>
              {/* Appointments Section */}
              {activeSection === 'appointments' && (
                <>
                  {/* Empty state */}
                  {appointments.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-content">
                        <div className="empty-icon">📅</div>
                        <h2 className="empty-title">Nessun appuntamento</h2>
                        <p className="empty-description">
                          Non hai ancora ricevuto richieste di appuntamento. Completa il tuo profilo per attirare nuovi clienti.
                        </p>
                        <button
                          className="action-btn"
                          style={{ marginTop: '1.5rem' }}
                          onClick={() => navigate('/profile')}
                        >
                          Completa Profilo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Appointments content */}
                  {appointments.length > 0 && (
                    <div className="page-content">
                      <div className="page-header">
                        <div className="header-card">
                          <h2>I MIEI APPUNTAMENTI</h2>
                          <p>Gestisci le richieste dei tuoi clienti</p>
                        </div>

                        {/* Category Tags */}
                        <div className="category-tags">
                          <button
                            className={`category-tag ${selectedFilter === 'programmati' ? 'active' : ''}`}
                            onClick={() => setSelectedFilter('programmati')}
                          >
                            Programmati ({filterCounts.programmati})
                          </button>
                          <button
                            className={`category-tag ${selectedFilter === 'completati' ? 'active' : ''}`}
                            onClick={() => setSelectedFilter('completati')}
                          >
                            Completati ({filterCounts.completati})
                          </button>
                          <button
                            className={`category-tag ${selectedFilter === 'cancellati' ? 'active' : ''}`}
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
                              participantName={appointment.client_profile?.full_name || 'Cliente'}
                              showParticipants={true}
                              onBookingUpdated={refreshAppointments}
                            />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Dashboard Section */}
              {activeSection === 'dashboard' && (
                <div className="page-content">
                  <div className="page-header">
                    <div className="header-card">
                      <h2>DASHBOARD</h2>
                      <p>Panoramica delle tue attività</p>
                    </div>

                    <MonthSlider
                      onMonthChange={handleMonthChange}
                      initialYear={selectedYear}
                      initialMonth={selectedMonth}
                    />
                  </div>

                  {/* Monthly Stats Boxes */}
                  <div className="dashboard-stats">
                    <div className="stats-box">
                      <div className="stats-item">
                        <span className="stats-label">N. APPUNTAMENTI</span>
                        <span className="stats-value">
                          {monthlyStats.total}
                          <br />
                          ({monthlyStats.scheduled} programmati)
                        </span>
                      </div>
                    </div>

                    <div className="stats-box">
                      <div className="stats-item">
                        <span className="stats-label">GUADAGNO TOTALE</span>
                        <span className="stats-value">
                          €{monthlyStats.completedEarnings.toFixed(2)}
                          <br />
                          (€{monthlyStats.scheduledEarnings.toFixed(2)} programmati)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Trend Chart */}
                  <AppointmentChart
                    appointments={appointments}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                  />

                  {/* Dashboard content will be added here */}
                </div>
              )}

              {/* Calendar Section */}
              {activeSection === 'calendar' && (
                <div className="page-content">
                  <div className="page-header">
                    <div className="header-card">
                      <h2>CALENDARIO</h2>
                      <p>Gestisci le tue disponibilità</p>
                    </div>
                  </div>
                  {/* Empty content area */}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Clients get simple layout without sidebar */
          <div className="appointments-container">
            {/* Empty state */}
            {appointments.length === 0 && (
              <div className="empty-state">
                <div className="empty-content">
                  <div className="empty-icon">📅</div>
                  <h2 className="empty-title">Nessun appuntamento</h2>
                  <p className="empty-description">
                    Non hai ancora prenotato nessun appuntamento. Esplora i portfolio degli artisti e prenota il tuo primo tatuaggio.
                  </p>
                  <button
                    className="action-btn"
                    style={{ marginTop: '1.5rem' }}
                    onClick={() => navigate('/')}
                  >
                    Esplora Portfolio
                  </button>
                </div>
              </div>
            )}

            {/* Client appointments content */}
            {appointments.length > 0 && (
              <div className="page-content">
                <div className="page-header">
                  <div className="header-card">
                    <h2>I MIEI APPUNTAMENTI</h2>
                    <p>Tieni traccia delle tue prenotazioni</p>
                  </div>

                  {/* Category Tags */}
                  <div className="category-tags">
                    <button
                      className={`category-tag ${selectedFilter === 'programmati' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('programmati')}
                    >
                      Programmati ({filterCounts.programmati})
                    </button>
                    <button
                      className={`category-tag ${selectedFilter === 'completati' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('completati')}
                    >
                      Completati ({filterCounts.completati})
                    </button>
                    <button
                      className={`category-tag ${selectedFilter === 'cancellati' ? 'active' : ''}`}
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
                        participantName={appointment.artist_profile?.username || appointment.artist_profile?.full_name || 'Artista'}
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
        )}
    </div>
  )
}