import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './Avatar'
import { useNavigate } from 'react-router-dom'
import './ProfileDropdown.css'
import './Dropdown.css'

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
    if (profile?.profile_type === 'client') {
      if (profile?.full_name) return profile.full_name
    } else {
      if (profile?.username) return profile.username
      if (profile?.full_name) return profile.full_name
    }
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
          <div className="dropdown-menu profile-dropdown-menu">
            <div className="dropdown-header">
              <Avatar
                name={fallbackName}
                size="sm"
                variant="default"
              />
              <div className="user-info">
                <div className="user-name">{fallbackName}</div>
                <div className="user-type">Cliente</div>
              </div>
            </div>
            <div className="dropdown-divider"></div>
            
            <button className="dropdown-item profile-dropdown-item become-artist-btn" onClick={() => {
              navigate('/become-artist')
              setIsOpen(false)
            }}>
              Diventi un'artista
            </button>
            <button className="dropdown-item profile-dropdown-item" onClick={() => {
              navigate('/settings')
              setIsOpen(false)
            }}>
              Impostazioni
            </button>
            
            <div className="dropdown-divider"></div>
            <button className="dropdown-item profile-dropdown-item logout-item" onClick={() => {
              signOut()
              setIsOpen(false)
              navigate('/')
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
        name={profile.profile_type === 'client'
          ? (profile.full_name || getDisplayName())
          : (profile.username || profile.full_name || getDisplayName())}
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
              name={profile.profile_type === 'client'
          ? (profile.full_name || getDisplayName())
          : (profile.username || profile.full_name || getDisplayName())}
              alt={`Avatar di ${getDisplayName()}`}
              size="sm"
              variant="default"
            />
            <div className="user-info">
              <div className="user-name">{profile.profile_type === 'client'
                ? (profile.full_name && profile.full_name.trim() ? profile.full_name : getDisplayName())
                : (profile.username || (profile.full_name && profile.full_name.trim() ? profile.full_name : getDisplayName()))}</div>
              <div className="user-type">{getProfileTypeDisplayName(profile.profile_type)}</div>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          
          {profile.profile_type !== 'artist' && (
            <button className="dropdown-item profile-dropdown-item become-artist-btn" onClick={() => {
              navigate('/become-artist')
              setIsOpen(false)
            }}>
              Diventi un'artista
            </button>
          )}
          {profile.profile_type === 'artist' && (
            <button className="dropdown-item profile-dropdown-item" onClick={() => {
              navigate('/profile')
              setIsOpen(false)
            }}>
              Il mio profilo
            </button>
          )}
{profile.profile_type === 'artist' ? (
            <button className="dropdown-item profile-dropdown-item" onClick={() => {
              navigate('/saved')
              setIsOpen(false)
            }}>
              Elementi salvati
            </button>
          ) : (
            <button className="dropdown-item profile-dropdown-item" onClick={() => {
              navigate('/appointments')
              setIsOpen(false)
            }}>
              Appuntamenti
            </button>
          )}
          <button className="dropdown-item profile-dropdown-item" onClick={() => {
            navigate('/settings')
            setIsOpen(false)
          }}>
            Impostazioni
          </button>
          
          <div className="dropdown-divider"></div>
          <button className="dropdown-item profile-dropdown-item logout-item" onClick={() => {
            signOut()
            setIsOpen(false)
            navigate('/')
          }}>
            Esci
          </button>
        </div>
      )}
    </div>
  )
}