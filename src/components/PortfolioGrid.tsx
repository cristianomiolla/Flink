import { useState, useRef, useEffect } from 'react'
import './PortfolioGrid.css'
import { PortfolioCard } from './PortfolioCard'
import LoadingSpinner from './LoadingSpinner'
import type { PortfolioItem, FlashFilter } from '../types/portfolio'

interface PortfolioGridProps {
  items: PortfolioItem[]
  loading: boolean
  error: string | null
  searchTerm: string
  locationFilter: string
  flashFilter: FlashFilter
  totalCount: number
  filteredCount: number
  onArtistClick?: (artistId: string) => void
  onFlashFilterChange?: (filter: FlashFilter) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
}

export function PortfolioGrid({ 
  items, 
  loading, 
  error, 
  searchTerm, 
  locationFilter,
  flashFilter,
  totalCount,
  filteredCount,
  onArtistClick,
  onFlashFilterChange,
  onAuthRequired,
  onContactArtist
}: PortfolioGridProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleFilterClick = (filter: FlashFilter) => {
    onFlashFilterChange?.(filter)
    setIsDropdownOpen(false)
  }

  const getFilterLabel = (filter: FlashFilter) => {
    switch (filter) {
      case 'all': return 'Tutti'
      case 'flash': return 'Flash'
      case 'realizzati': return 'Realizzati'
    }
  }
  
  if (loading) {
    return (
      <section className="grid-container">
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="grid-container">
        <div className="container">
          <div className="error-state">
            <div className="error-card">
              <h2 className="error-title">Errore di caricamento</h2>
              <p className="error-message">{error}</p>
              <button className="btn btn-accent retry-btn" onClick={() => window.location.reload()}>
                Riprova
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const hasSearchTerms = searchTerm.trim() || locationFilter.trim()

  return (
    <section className="grid-container">
      <div className="container">
        <div className="grid-header">
          <div className="header-card">
            <div className="header-top">
              <h2 className="grid-title">Portfolio opere</h2>
              <div className="filter-dropdown" ref={dropdownRef}>
                <button 
                  className="action-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-expanded={isDropdownOpen}
                >
                  <span className="action-icon">
                    <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                    </svg>
                  </span>
                  <span className="action-text">{getFilterLabel(flashFilter)}</span>
                  <span className="action-icon">
                    <svg className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="6,9 12,15 18,9"/>
                    </svg>
                  </span>
                </button>
                {isDropdownOpen && (
                  <div className="filter-dropdown-menu">
                    <button 
                      className={`filter-option ${flashFilter === 'all' ? 'active' : ''}`}
                      onClick={() => handleFilterClick('all')}
                    >
                      Tutti
                    </button>
                    <button 
                      className={`filter-option ${flashFilter === 'flash' ? 'active' : ''}`}
                      onClick={() => handleFilterClick('flash')}
                    >
                      Flash
                    </button>
                    <button 
                      className={`filter-option ${flashFilter === 'realizzati' ? 'active' : ''}`}
                      onClick={() => handleFilterClick('realizzati')}
                    >
                      Realizzati
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid-stats">
              <span className="stat-count">{hasSearchTerms ? filteredCount : totalCount}</span>
              <span className="stat-label">{hasSearchTerms ? 'risultati' : 'opere totali'}</span>
            </div>
            
            {hasSearchTerms && (
              <div className="search-info">
                {searchTerm && <span className="search-term">"{searchTerm}"</span>}
                {locationFilter && <span className="location-term">{locationFilter}</span>}
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-card">
              <h3 className="empty-title">Nessun risultato</h3>
              <p className="empty-message">
                {hasSearchTerms 
                  ? 'Nessuna opera trovata per i criteri selezionati' 
                  : 'Il portfolio è ancora vuoto'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="portfolio-grid">
            {items.map((item) => (
              <PortfolioCard 
                key={item.id} 
                item={item}
                onArtistClick={onArtistClick}
                onAuthRequired={onAuthRequired}
                onContactArtist={onContactArtist}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}