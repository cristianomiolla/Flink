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
import EmptyState from './EmptyState'
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
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison

    const monthlyAppointments = appointments.filter(appointment => {
      const appointmentDate = appointment.appointment_date ? new Date(appointment.appointment_date) : new Date(appointment.created_at)
      return appointmentDate.getFullYear() === selectedYear && appointmentDate.getMonth() === selectedMonth
    })

    // Split appointments by date relative to today
    const pastAppointments = monthlyAppointments.filter(appointment => {
      if (!appointment.appointment_date) return false
      const appointmentDate = new Date(appointment.appointment_date)
      appointmentDate.setHours(0, 0, 0, 0)
      return appointmentDate < currentDate
    })

    const futureAppointments = monthlyAppointments.filter(appointment => {
      if (!appointment.appointment_date) return false
      const appointmentDate = new Date(appointment.appointment_date)
      appointmentDate.setHours(0, 0, 0, 0)
      return appointmentDate >= currentDate
    })

    const completedEarnings = pastAppointments.reduce((total, appointment) => {
      return total + (appointment.total_amount || 0)
    }, 0)

    const scheduledEarnings = futureAppointments.reduce((total, appointment) => {
      return total + (appointment.total_amount || 0)
    }, 0)

    return {
      total: pastAppointments.length + futureAppointments.length,
      scheduled: futureAppointments.length,
      completedEarnings,
      scheduledEarnings
    }
  }

  const get12MonthAverage = () => {
    const currentDate = new Date()
    const monthlyData: Array<{appointments: number, earnings: number}> = []

    // Calculate stats for each of the last 12 months
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const targetYear = targetDate.getFullYear()
      const targetMonth = targetDate.getMonth()

      const monthAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.appointment_date ? new Date(appointment.appointment_date) : new Date(appointment.created_at)
        return appointmentDate.getFullYear() === targetYear && appointmentDate.getMonth() === targetMonth
      })

      const monthEarnings = monthAppointments.reduce((total, appointment) => {
        return total + (appointment.total_amount || 0)
      }, 0)

      // Only include months that have data
      if (monthAppointments.length > 0 || monthEarnings > 0) {
        monthlyData.push({
          appointments: monthAppointments.length,
          earnings: monthEarnings
        })
      }
    }

    // Calculate average only from months with data
    const monthsWithData = monthlyData.length
    const avgAppointments = monthsWithData > 0 ? monthlyData.reduce((sum, month) => sum + month.appointments, 0) / monthsWithData : 0
    const avgEarnings = monthsWithData > 0 ? monthlyData.reduce((sum, month) => sum + month.earnings, 0) / monthsWithData : 0

    return { avgAppointments, avgEarnings, monthsWithData }
  }

  const calculateComparison = (current: number, average: number) => {
    if (average === 0) return { percentage: 0, isPositive: true }
    const percentage = ((current - average) / average) * 100
    return { percentage: Math.round(percentage), isPositive: percentage >= 0 }
  }

  const monthlyStats = getMonthlyStats()
  const averageStats = get12MonthAverage()
  const appointmentsComparison = calculateComparison(monthlyStats.total, averageStats.avgAppointments)
  const earningsComparison = calculateComparison(monthlyStats.completedEarnings + monthlyStats.scheduledEarnings, averageStats.avgEarnings)


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
                    <EmptyState
                      icon="📅"
                      title="Nessun appuntamento"
                      description="Non hai ancora ricevuto richieste di appuntamento. Completa il tuo profilo per attirare nuovi clienti."
                      action={
                        <button
                          className="action-btn"
                          onClick={() => navigate('/profile')}
                        >
                          Completa Profilo
                        </button>
                      }
                    />
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
                            <EmptyState
                              icon="📅"
                              title={`Nessun appuntamento ${selectedFilter}`}
                              description={`Non hai appuntamenti ${selectedFilter === 'programmati' ? 'programmati' : selectedFilter} al momento.`}
                            />
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
                          {monthlyStats.scheduled > 0 && (
                            <>
                              <br />
                              ({monthlyStats.scheduled} programmati)
                            </>
                          )}
                        </span>
                        <div className={`comparison-chip ${appointmentsComparison.isPositive ? 'positive' : 'negative'}`}>
                          {appointmentsComparison.isPositive ? '↗' : '↘'} {Math.abs(appointmentsComparison.percentage)}%
                        </div>
                      </div>
                    </div>

                    <div className="stats-box">
                      <div className="stats-item">
                        <span className="stats-label">GUADAGNO TOTALE</span>
                        <span className="stats-value">
                          €{(monthlyStats.completedEarnings + monthlyStats.scheduledEarnings).toFixed(2)}
                          {monthlyStats.scheduledEarnings > 0 && (
                            <>
                              <br />
                              (€{monthlyStats.scheduledEarnings.toFixed(2)} programmati)
                            </>
                          )}
                        </span>
                        <div className={`comparison-chip ${earningsComparison.isPositive ? 'positive' : 'negative'}`}>
                          {earningsComparison.isPositive ? '↗' : '↘'} {Math.abs(earningsComparison.percentage)}%
                        </div>
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
              <EmptyState
                icon="📅"
                title="Nessun appuntamento"
                description="Non hai ancora prenotato nessun appuntamento. Esplora i portfolio degli artisti e prenota il tuo primo tatuaggio."
                action={
                  <button
                    className="action-btn"
                    onClick={() => navigate('/')}
                  >
                    Esplora Portfolio
                  </button>
                }
              />
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
                      <EmptyState
                        icon="📅"
                        title={`Nessun appuntamento ${selectedFilter}`}
                        description={`Non hai appuntamenti ${selectedFilter === 'programmati' ? 'programmati' : selectedFilter} al momento.`}
                      />
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