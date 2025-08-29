import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Avatar'
import './ProfileDropdown.css'

export function ProfileDropdown() {
  const { user, profile, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    const fallbackName = user?.email ? user.email.split('@')[0] : 'U'
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
              <Avatar
                name={fallbackName}
                size="md"
                variant="default"
              />
              <div className="user-info">
                <div className="user-name">{fallbackName}</div>
                <div className="user-type">Cliente</div>
              </div>
            </div>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item become-artist-btn" onClick={() => {
              // TODO: Navigate to become artist page
            }}>
              Diventi un'artista
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={() => {
              // TODO: Navigate to profile page
            }}>
              Il mio profilo
            </button>
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
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              alt={`Avatar di ${getDisplayName()}`}
              size="md"
              variant="default"
            />
            <div className="user-info">
              <div className="user-name">{profile.full_name || getDisplayName()}</div>
              <div className="user-type">{getProfileTypeDisplayName(profile.profile_type)}</div>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          {profile.profile_type !== 'artist' && (
            <button className="dropdown-item become-artist-btn" onClick={() => {
              // TODO: Navigate to become artist page
            }}>
              Diventi un'artista
            </button>
          )}
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={() => {
            // TODO: Navigate to profile page
          }}>
            Il mio profilo
          </button>
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