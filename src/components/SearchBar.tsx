import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBar.css'
import { LocationSelect } from './LocationSelect'
import { AuthOverlay } from './AuthOverlay'
import { Header } from './Header'

interface SearchBarProps {
  onSearch?: (searchTerm: string, location: string) => void
  onLogoClick?: () => void
}

export function SearchBar({ onSearch, onLogoClick }: SearchBarProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)

  const handleSearch = () => {
    // Always navigate to home with search parameters
    navigate(`/?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`)
    
    // Also call the onSearch callback if provided (for compatibility)
    onSearch?.(searchTerm, location)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <>
      <Header 
        onLogoClick={onLogoClick}
        onAuthRequired={() => setShowAuthOverlay(true)}
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
      
      <AuthOverlay 
        isOpen={showAuthOverlay} 
        onClose={() => setShowAuthOverlay(false)} 
      />
    </>
  )
}