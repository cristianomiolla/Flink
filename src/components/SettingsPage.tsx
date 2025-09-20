import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SearchBar } from './SearchBar'
import { PageHeader } from './PageHeader'
import { supabase } from '../lib/supabase'
import './SettingsPage.css'
import './FormOverlay.css'

// Lazy load overlay components
const EmailChangeOverlay = lazy(() => import('./EmailChangeOverlay').then(module => ({ default: module.EmailChangeOverlay })))
const FullNameChangeOverlay = lazy(() => import('./FullNameChangeOverlay').then(module => ({ default: module.FullNameChangeOverlay })))
const PasswordChangeOverlay = lazy(() => import('./PasswordChangeOverlay').then(module => ({ default: module.PasswordChangeOverlay })))

interface SettingsPageProps {
  onLogoClick?: () => void
}

export function SettingsPage({ onLogoClick }: SettingsPageProps) {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [showEmailOverlay, setShowEmailOverlay] = useState(false)
  const [showFullNameOverlay, setShowFullNameOverlay] = useState(false)
  const [showPasswordOverlay, setShowPasswordOverlay] = useState(false)
  const [showProfileTypeOverlay, setShowProfileTypeOverlay] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handlePasswordChangeClick = () => {
    setShowPasswordOverlay(true)
  }

  const handleEmailChangeClick = () => {
    setShowEmailOverlay(true)
  }

  const handleFullNameChangeClick = () => {
    setShowFullNameOverlay(true)
  }

  const handleProfileTypeChangeClick = () => {
    setShowProfileTypeOverlay(true)
  }

  const handleProfileTypeChange = async () => {
    if (!profile || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Change from artist to client
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_type: 'client',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id)
      
      if (error) {
        // Error changing profile type
        alert('Errore durante il cambio del tipo di profilo. Riprova.')
        return
      }
      
      // Refresh profile data
      if (refreshProfile) {
        await refreshProfile()
      }
      
      // Close overlay and redirect to home
      setShowProfileTypeOverlay(false)
      navigate('/')
    } catch {
      // Error changing profile type
      alert('Errore durante il cambio del tipo di profilo. Riprova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAccountDeletionClick = () => {
    // TODO: Open account deletion overlay
  }


  return (
    <div className="settings-page">
      <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
      
      {/* Mobile Header */}
      <div className="settings-mobile-header">
        <button className="back-to-profile" onClick={() => navigate('/profile-menu')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <div className="settings-mobile-title">
          <span className="settings-title-text">IMPOSTAZIONI</span>
        </div>
        <div className="settings-mobile-spacer"></div>
      </div>
      
      <div className="container">
        <div className="settings-content">
          <PageHeader 
            title="IMPOSTAZIONI"
            subtitle="Gestisci il tuo account e le preferenze"
            className="settings-desktop-header"
          />

          <div className="settings-card">
            <div className="settings-links">
              <button 
                className="settings-link"
                onClick={handlePasswordChangeClick}
              >
                <div className="settings-link-content">
                  <h3 className="settings-link-title">Cambia Password</h3>
                  <p className="settings-link-description">
                    Aggiorna la password del tuo account
                  </p>
                </div>
                <svg className="settings-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>

              <button 
                className="settings-link"
                onClick={handleEmailChangeClick}
              >
                <div className="settings-link-content">
                  <h3 className="settings-link-title">Cambia Email</h3>
                  <p className="settings-link-description">
                    Aggiorna l'indirizzo email del tuo account
                  </p>
                </div>
                <svg className="settings-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>

              <button 
                className="settings-link"
                onClick={handleFullNameChangeClick}
              >
                <div className="settings-link-content">
                  <h3 className="settings-link-title">Cambia Nome</h3>
                  <p className="settings-link-description">
                    Aggiorna il nome visualizzato sul tuo profilo
                  </p>
                </div>
                <svg className="settings-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>

              {/* Only show profile type change for artists */}
              {profile?.profile_type === 'artist' && (
                <button 
                  className="settings-link"
                  onClick={handleProfileTypeChangeClick}
                >
                  <div className="settings-link-content">
                    <h3 className="settings-link-title">Cambia a Cliente</h3>
                    <p className="settings-link-description">
                      Attualmente sei: Artista
                    </p>
                  </div>
                  <svg className="settings-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
              )}

              <button 
                className="settings-link danger"
                onClick={handleAccountDeletionClick}
              >
                <div className="settings-link-content">
                  <h3 className="settings-link-title">Elimina Account</h3>
                  <p className="settings-link-description">
                    Elimina definitivamente il tuo account
                  </p>
                </div>
                <svg className="settings-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Password Change Overlay */}
      {showPasswordOverlay && (
        <Suspense fallback={<div />}>
          <PasswordChangeOverlay
            isOpen={showPasswordOverlay}
            onClose={() => setShowPasswordOverlay(false)}
          />
        </Suspense>
      )}

      {/* Email Change Overlay */}
      {showEmailOverlay && (
        <Suspense fallback={<div />}>
          <EmailChangeOverlay
            isOpen={showEmailOverlay}
            onClose={() => setShowEmailOverlay(false)}
          />
        </Suspense>
      )}

      {/* Full Name Change Overlay */}
      {showFullNameOverlay && (
        <Suspense fallback={<div />}>
          <FullNameChangeOverlay
            isOpen={showFullNameOverlay}
            onClose={() => setShowFullNameOverlay(false)}
          />
        </Suspense>
      )}

      {/* Profile Type Change Overlay */}
      {showProfileTypeOverlay && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowProfileTypeOverlay(false)}>
          <div className="modal-content auth-modal">
            <div className="auth-header-sticky">
              <button className="modal-close-btn" onClick={() => setShowProfileTypeOverlay(false)}>
                ×
              </button>
            </div>
            
            <div className="auth-modal-header">
            </div>
            
            <div className="auth-content">
              <div className="header-card">
                <h2>CAMBIA A CLIENTE</h2>
                <p>Stai per cambiare il tuo tipo di profilo da Artista a Cliente. Questo nasconderà le tue funzionalità da artista</p>
              </div>

              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleProfileTypeChange(); }}>
                <div className="form-group">
                  <label className="form-label">Tipo attuale</label>
                  <div className="current-email-display">Artista</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nuovo tipo profilo</label>
                  <div className="current-email-display">Cliente</div>
                </div>

                <div className="warning-message" style={{ 
                  background: '#FEF3C7', 
                  color: '#92400E', 
                  padding: '1rem', 
                  borderRadius: '4px', 
                  fontSize: '0.875rem'
                }}>
                  <strong>Attenzione:</strong> Cambiando a Cliente perderai l'accesso alle funzionalità da artista come il portfolio personale e la gestione dei lavori. Potrai sempre tornare artista in futuro.
                </div>

                <button 
                  type="submit" 
                  className="action-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Cambiando...' : 'Cambia a Cliente'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}