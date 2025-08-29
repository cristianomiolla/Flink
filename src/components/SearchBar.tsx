import { useState } from 'react'
import './SearchBar.css'
import { LocationSelect } from './LocationSelect'
import { useAuth } from '../hooks/useAuth'
import { AuthOverlay } from './AuthOverlay'
import { HeaderIcons } from './HeaderIcons'
import { ProfileDropdown } from './ProfileDropdown'

interface SearchBarProps {
  onSearch?: (searchTerm: string, location: string) => void
  onLogoClick?: () => void
}

export function SearchBar({ onSearch, onLogoClick }: SearchBarProps) {
  const { user, loading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)

  const handleSearch = () => {
    onSearch?.(searchTerm, location)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleAuthClick = () => {
    setShowAuthOverlay(true)
  }

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <span className="logo" onClick={onLogoClick}>SKUNK</span>

            {/* Search Form */}
            <div className="search-form">
              <div className="search-input-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cerca tatuaggi, artisti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="location-input-container">
                <span className="location-icon">📍</span>
                <LocationSelect
                  value={location}
                  onChange={setLocation}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <button 
                className="btn btn-accent search-btn"
                onClick={handleSearch}
              >
                <span className="btn-icon">→</span>
                Cerca
              </button>
            </div>

            {/* User section */}
            <div className="user-section">
              {loading ? (
                <div className="auth-loading">...</div>
              ) : user ? (
                <>
                  <HeaderIcons />
                  <ProfileDropdown />
                </>
              ) : (
                <button className="btn btn-primary auth-btn" onClick={handleAuthClick}>
                  Login/Registrati
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <AuthOverlay 
        isOpen={showAuthOverlay} 
        onClose={() => setShowAuthOverlay(false)} 
      />
    </>
  )
}