import { useState, useRef, useEffect, memo, useCallback } from 'react'
import './PortfolioGrid.css'
import { PortfolioCard } from './PortfolioCard'
import { DataStateHandler } from './DataStateHandler'
import { GridHeader, GridSearchInfo } from './GridHeader'
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
  onEdit?: (itemId: string) => void
  onDelete?: (itemId: string) => void
}

const PortfolioGrid = memo(function PortfolioGrid({ 
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
  onContactArtist,
  onEdit,
  onDelete
}: PortfolioGridProps) {
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        setIsDesktopDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDesktopFilterClick = useCallback((filter: FlashFilter) => {
    onFlashFilterChange?.(filter)
    setIsDesktopDropdownOpen(false)
  }, [onFlashFilterChange])

  const getFilterLabel = (filter: FlashFilter) => {
    switch (filter) {
      case 'all': return 'Tutti'
      case 'flash': return 'Flash'
      case 'realizzati': return 'Realizzati'
    }
  }
  
  const hasSearchTerms = searchTerm.trim() || locationFilter.trim()

  return (
    <DataStateHandler
      loading={loading}
      error={error}
      data={items}
      searchTerm={searchTerm}
      locationFilter={locationFilter}
      searchEmptyMessage="Nessuna opera trovata per i criteri selezionati"
      fallbackEmptyMessage="Il portfolio è ancora vuoto"
    >
      <section className="grid-container">
        <div className="container">
          <GridHeader 
            title="PORTFOLIO OPERE"
            subtitle={hasSearchTerms ? (
              filteredCount === 1 ? '1 risultato' : `${filteredCount} risultati`
            ) : (
              totalCount === 1 ? '1 opera totale' : `${totalCount} opere totali`
            )}
            searchInfo={
              <GridSearchInfo
                searchTerm={searchTerm}
                locationFilter={locationFilter}
              />
            }
            actions={
              <div className="filter-dropdown" ref={desktopDropdownRef}>
                <button 
                  className="action-btn"
                  onClick={() => setIsDesktopDropdownOpen(!isDesktopDropdownOpen)}
                  aria-expanded={isDesktopDropdownOpen}
                >
                  <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                  </svg>
                  <span className="action-text">{getFilterLabel(flashFilter)}</span>
                  <span className="action-icon">
                    <svg className={`chevron-icon ${isDesktopDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="6,9 12,15 18,9"/>
                    </svg>
                  </span>
                </button>
                {isDesktopDropdownOpen && (
                  <div className="filter-dropdown-menu">
                    <button 
                      className={`action-btn ${flashFilter === 'all' ? 'active' : ''}`}
                      onClick={() => handleDesktopFilterClick('all')}
                    >
                      <span className="action-text">Tutti</span>
                    </button>
                    <button 
                      className={`action-btn ${flashFilter === 'flash' ? 'active' : ''}`}
                      onClick={() => handleDesktopFilterClick('flash')}
                    >
                      <span className="action-text">Flash</span>
                    </button>
                    <button 
                      className={`action-btn ${flashFilter === 'realizzati' ? 'active' : ''}`}
                      onClick={() => handleDesktopFilterClick('realizzati')}
                    >
                      <span className="action-text">Realizzati</span>
                    </button>
                  </div>
                )}
              </div>
            }
          />


          <div className="portfolio-grid">
            {items.map((item) => (
              <PortfolioCard 
                key={item.id} 
                item={item}
                onArtistClick={onArtistClick}
                onAuthRequired={onAuthRequired}
                onContactArtist={onContactArtist}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </section>
    </DataStateHandler>
  )
})

export { PortfolioGrid }