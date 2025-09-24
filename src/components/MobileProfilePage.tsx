import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Avatar'
import './MobileProfilePage.css'
import EmptyState from './EmptyState'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

export function MobileProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)

  const handleAuthRequired = useCallback(() => {
    setShowAuthOverlay(true)
  }, [])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])


  const getDisplayName = (): string => {
    if (profile?.profile_type === 'client') {
      if (profile?.full_name) return profile.full_name
    } else {
      if (profile?.username) return profile.username
      if (profile?.full_name) return profile.full_name
    }
    if (user?.email) {
      const emailPart = user.email.split('@')[0]
      if (emailPart.includes('.')) {
        return emailPart
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      }
      return emailPart
    }
    return 'Utente'
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

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  if (!user || !profile) {
    return (
      <div className="mobile-profile-page">
        <div className="container">
          <EmptyState
            icon="👤"
            title="Accedi per visualizzare il profilo"
            description="Effettua il login per accedere alle impostazioni del tuo profilo e gestire il tuo account."
            action={
              <button
                className="action-btn"
                style={{ marginTop: '1.5rem' }}
                onClick={handleAuthRequired}
              >
                Accedi
              </button>
            }
          />
        </div>
        
        {/* Auth Overlay */}
        {showAuthOverlay && (
          <Suspense fallback={<div />}>
            <AuthOverlay
              isOpen={showAuthOverlay}
              onClose={() => setShowAuthOverlay(false)}
            />
          </Suspense>
        )}
      </div>
    )
  }

  return (
    <div className="mobile-profile-page">
      <div className="mobile-profile-content">
        {/* User Info Section */}
        <div className="mobile-profile-user">
          <div className="mobile-profile-user-header">
            <button className="header-icon-btn" aria-label="Notifiche" title="Notifiche">
              <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
            </button>
          </div>
          <div className="mobile-profile-avatar">
            <Avatar
              src={profile.avatar_url}
              name={profile.profile_type === 'client'
                ? (profile.full_name || getDisplayName())
                : (profile.username || profile.full_name || getDisplayName())}
              alt={`Avatar di ${getDisplayName()}`}
              size="lg"
              variant="default"
            />
          </div>
          <div className="mobile-profile-info">
            <div className="mobile-profile-name">{getDisplayName()}</div>
            <div className="mobile-profile-type">{getProfileTypeDisplayName(profile.profile_type)}</div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="mobile-profile-menu">
          {profile.profile_type !== 'artist' && (
            <button 
              className="mobile-profile-item become-artist-btn" 
              onClick={() => navigate('/become-artist')}
            >
              <span className="mobile-profile-item-text">Diventi un'artista</span>
              <svg className="mobile-profile-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          )}

          {profile.profile_type === 'artist' && (
            <>
              <button
                className="mobile-profile-item"
                onClick={() => navigate('/profile')}
              >
                <span className="mobile-profile-item-text">Il mio profilo</span>
                <svg className="mobile-profile-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>

              <button
                className="mobile-profile-item"
                onClick={() => navigate('/saved')}
              >
                <span className="mobile-profile-item-text">Elementi salvati</span>
                <svg className="mobile-profile-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </button>
            </>
          )}

          {profile.profile_type !== 'artist' && (
            <button
              className="mobile-profile-item"
              onClick={() => navigate('/appointments')}
            >
              <span className="mobile-profile-item-text">Appuntamenti</span>
              <svg className="mobile-profile-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          )}


          <button
            className="mobile-profile-item"
            onClick={() => navigate('/settings')}
          >
            <span className="mobile-profile-item-text">Impostazioni</span>
            <svg className="mobile-profile-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>

          <button 
            className="mobile-profile-item logout-item" 
            onClick={handleSignOut}
          >
            <span className="mobile-profile-item-text">Esci</span>
            <svg className="mobile-profile-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}