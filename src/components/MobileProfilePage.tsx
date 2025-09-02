import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Avatar'
import './MobileProfilePage.css'

export function MobileProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const getDisplayName = (): string => {
    if (profile?.full_name) return profile.full_name
    if (profile?.username) return profile.username
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
        <div className="mobile-profile-loading">
          <p>Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-profile-page">
      <div className="mobile-profile-header">
        <h1 className="mobile-profile-title">Profilo</h1>
      </div>

      <div className="mobile-profile-content">
        {/* User Info Section */}
        <div className="mobile-profile-user">
          <div className="mobile-profile-avatar">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
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
            <button 
              className="mobile-profile-item" 
              onClick={() => navigate('/profile')}
            >
              <span className="mobile-profile-item-text">Il mio profilo</span>
              <svg className="mobile-profile-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          )}

          <button 
            className="mobile-profile-item" 
            onClick={() => {
              // TODO: Navigate to settings page when implemented
              console.log('Settings not implemented yet')
            }}
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