import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Avatar'
import './MobileNavbar.css'

interface MobileNavbarProps {
  onSearchClick?: () => void
}

export function MobileNavbar({ onSearchClick }: MobileNavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, user } = useAuth()

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

  const isActive = (path: string) => location.pathname === path

  const handleNavigation = (path: string) => {
    if (path === '/') {
      navigate('/')
      onSearchClick?.()
    } else {
      navigate(path)
    }
  }

  // Hide navbar in mobile conversation view and settings page
  const isConversationPage = location.pathname.startsWith('/messages/') && location.pathname !== '/messages'
  const isSettingsPage = location.pathname === '/settings'
  if (isConversationPage || isSettingsPage) {
    return null
  }

  return (
    <div className="mobile-navbar">
      <button 
        className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
        onClick={() => handleNavigation('/')}
        aria-label="Ricerca"
      >
        <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <span className="mobile-nav-label">Cerca</span>
      </button>

      {profile?.profile_type !== 'artist' && (
        <button
          className={`mobile-nav-item ${isActive('/saved') ? 'active' : ''}`}
          onClick={() => handleNavigation('/saved')}
          aria-label="Elementi salvati"
        >
          <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
          <span className="mobile-nav-label">Salvati</span>
        </button>
      )}

      <button
        className={`mobile-nav-item ${isActive('/messages') ? 'active' : ''}`}
        onClick={() => handleNavigation('/messages')}
        aria-label="Messaggi"
      >
        <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span className="mobile-nav-label">Messaggi</span>
      </button>

      {profile?.profile_type === 'artist' && (
        <button
          className={`mobile-nav-item ${isActive('/appointments') ? 'active' : ''}`}
          onClick={() => handleNavigation('/appointments')}
          aria-label="Appuntamenti"
        >
          <svg className="mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="mobile-nav-label">Agenda</span>
        </button>
      )}

      <button
        className={`mobile-nav-item ${isActive('/profile-menu') ? 'active' : ''}`}
        onClick={() => handleNavigation('/profile-menu')}
        aria-label="Profilo"
      >
        <div className="mobile-nav-avatar">
          <Avatar
            src={profile?.avatar_url}
            name={user ? (profile?.profile_type === 'client'
              ? (profile?.full_name || getDisplayName())
              : (profile?.username || profile?.full_name || getDisplayName())) : undefined}
            alt={`Avatar di ${getDisplayName()}`}
            size="xs"
            variant="default"
          />
        </div>
        <span className="mobile-nav-label">Profilo</span>
      </button>
    </div>
  )
}