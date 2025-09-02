import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Avatar'
import { useNavigate } from 'react-router-dom'
import './ProfileDropdown.css'

export function ProfileDropdown() {
  const { user, profile, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Don't render if still loading or no user
  if (loading || !user) return null

  const getDisplayName = (): string => {
    if (profile?.full_name) return profile.full_name
    if (profile?.username) return profile.username
    if (user?.email) {
      const emailPart = user.email.split('@')[0]
      // Se contiene punti, trasformali in spazi e metti maiuscole
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

  // Fallback rendering if profile is not loaded yet
  if (!profile) {
    const getFallbackName = (): string => {
      if (!user?.email) return 'U'
      const emailPart = user.email.split('@')[0]
      // Se contiene punti, trasformali in spazi e metti maiuscole
      if (emailPart.includes('.')) {
        return emailPart
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      }
      return emailPart
    }
    const fallbackName = getFallbackName()
    return (
      <div className="profile-dropdown">
        <Avatar
          name={fallbackName}
          size="sm"
          variant="default"
          onClick={() => setIsOpen(!isOpen)}
        />
        {isOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <div className="avatar avatar-sm avatar-default">
                <div className="avatar-placeholder">
                  {fallbackName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="user-info">
                <div className="user-name">{fallbackName}</div>
                <div className="user-type">Cliente</div>
              </div>
            </div>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item become-artist-btn" onClick={() => {
              navigate('/become-artist')
              setIsOpen(false)
            }}>
              Diventi un'artista
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={() => {
              // TODO: Navigate to settings page
            }}>
              Impostazioni
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item logout-item" onClick={() => {
              signOut()
              setIsOpen(false)
            }}>
              Esci
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <Avatar
        src={profile.avatar_url}
        name={profile.full_name}
        alt={`Avatar di ${getDisplayName()}`}
        size="sm"
        variant="default"
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="avatar avatar-sm avatar-default" aria-label={`Avatar di ${getDisplayName()}`}>
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={`Avatar di ${getDisplayName()}`}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  {(profile.full_name || getDisplayName()).split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{profile.full_name && profile.full_name.trim() ? profile.full_name : getDisplayName()}</div>
              <div className="user-type">{getProfileTypeDisplayName(profile.profile_type)}</div>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          {profile.profile_type !== 'artist' && (
            <button className="dropdown-item become-artist-btn" onClick={() => {
              navigate('/become-artist')
              setIsOpen(false)
            }}>
              Diventi un'artista
            </button>
          )}
          <div className="dropdown-divider"></div>
          {profile.profile_type === 'artist' && (
            <button className="dropdown-item" onClick={() => {
              navigate('/profile')
              setIsOpen(false)
            }}>
              Il mio profilo
            </button>
          )}
          <button className="dropdown-item" onClick={() => {
            // TODO: Navigate to settings page
          }}>
            Impostazioni
          </button>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item logout-item" onClick={() => {
            signOut()
            setIsOpen(false)
          }}>
            Esci
          </button>
        </div>
      )}
    </div>
  )
}