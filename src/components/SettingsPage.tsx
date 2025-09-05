import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SearchBar } from './SearchBar'
import { PageHeader } from './PageHeader'
import './SettingsPage.css'

// Lazy load overlay components
const PasswordChangeOverlay = lazy(() => import('./PasswordChangeOverlay').then(module => ({ default: module.PasswordChangeOverlay })))
const EmailChangeOverlay = lazy(() => import('./EmailChangeOverlay').then(module => ({ default: module.EmailChangeOverlay })))
const FullNameChangeOverlay = lazy(() => import('./FullNameChangeOverlay').then(module => ({ default: module.FullNameChangeOverlay })))

interface SettingsPageProps {
  onLogoClick?: () => void
}

export function SettingsPage({ onLogoClick }: SettingsPageProps) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [showPasswordOverlay, setShowPasswordOverlay] = useState(false)
  const [showEmailOverlay, setShowEmailOverlay] = useState(false)
  const [showFullNameOverlay, setShowFullNameOverlay] = useState(false)

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
    // TODO: Open profile type change overlay
    console.log('Open profile type change overlay')
  }

  const handleAccountDeletionClick = () => {
    // TODO: Open account deletion overlay
    console.log('Open account deletion overlay')
  }

  const getProfileTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'client':
        return 'Cliente'
      case 'artist':
        return 'Artista'
      default:
        return type
    }
  }

  const getOtherProfileTypeDisplayName = (type: string): string => {
    return type === 'artist' ? 'Cliente' : 'Artista'
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

              <button 
                className="settings-link"
                onClick={handleProfileTypeChangeClick}
              >
                <div className="settings-link-content">
                  <h3 className="settings-link-title">
                    Cambia a {profile ? getOtherProfileTypeDisplayName(profile.profile_type) : 'Artista'}
                  </h3>
                  <p className="settings-link-description">
                    Attualmente sei: {profile ? getProfileTypeDisplayName(profile.profile_type) : 'N/A'}
                  </p>
                </div>
                <svg className="settings-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>

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
    </div>
  )
}