import { useState, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBar.css'
import { LocationSelect } from './LocationSelect'
import { AuthOverlay } from './AuthOverlay'
import { Header } from './Header'

interface SearchBarProps {
  onSearch?: (searchTerm: string, location: string) => void
  onLogoClick?: () => void
  hideOnMobile?: boolean
}

export const SearchBar = memo(function SearchBar({ onSearch, onLogoClick, hideOnMobile = false }: SearchBarProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  const [showMobileLocationInput, setShowMobileLocationInput] = useState(false)

  const handleSearch = () => {
    // Always navigate to home with search parameters
    navigate(`/?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`)
    
    // Also call the onSearch callback if provided (for compatibility)
    onSearch?.(searchTerm, location)
    
    // Hide mobile location input after search
    setShowMobileLocationInput(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearchInputBlur = () => {
    // Hide location input if focus is not moving to location select or search button
    setTimeout(() => {
      const activeElement = document.activeElement
      const isLocationSelect = activeElement?.closest('.location-input-container')
      const isSearchButton = activeElement?.closest('.search-btn')
      
      if (!isLocationSelect && !isSearchButton) {
        setShowMobileLocationInput(false)
      }
    }, 100)
  }

  return (
    <>
      <Header 
        onLogoClick={onLogoClick}
        onAuthRequired={() => setShowAuthOverlay(true)}
        hideOnMobile={hideOnMobile}
      >
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
      </Header>

      {/* Mobile search form - outside Header */}
      {!hideOnMobile && (
        <div className="mobile-search-container">
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
                onFocus={() => setShowMobileLocationInput(true)}
                onBlur={handleSearchInputBlur}
              />
            </div>
            {showMobileLocationInput && (
              <div className="location-input-container">
                <span className="location-icon">📍</span>
                <LocationSelect
                  value={location}
                  onChange={setLocation}
                  onKeyPress={handleKeyPress}
                />
              </div>
            )}
            {showMobileLocationInput && (
              <button 
                className="btn btn-accent search-btn"
                onClick={handleSearch}
              >
                <span className="btn-icon">→</span>
                Cerca
              </button>
            )}
          </div>
        </div>
      )}
      
      <AuthOverlay 
        isOpen={showAuthOverlay} 
        onClose={() => setShowAuthOverlay(false)} 
      />
    </>
  )
})