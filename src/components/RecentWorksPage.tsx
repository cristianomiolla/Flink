import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import './SavedItemsPage.css' // Riusa gli stili esistenti
import './PortfolioGrid.css'
import { SearchBar } from './SearchBar'
import { PageHeader } from './PageHeader'
import LoadingSpinner from './LoadingSpinner'
import { PortfolioCard } from './PortfolioCard'
import { usePortfolioSearch } from '../hooks/usePortfolioSearch'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import type { PortfolioItem } from '../types/portfolio'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

interface RecentWorksPageProps {
  onLogoClick?: () => void
  onArtistClick?: (artistId: string) => void
}

export function RecentWorksPage({ onLogoClick, onArtistClick }: RecentWorksPageProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { portfolioItems, loading, error } = usePortfolioSearch()
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [flashFilter, setFlashFilter] = useState<'all' | 'flash' | 'realized'>('all')

  const handleAuthRequired = useCallback(() => {
    setShowAuthOverlay(true)
  }, [])

  const handleContactArtist = useCallback((artistId: string) => {
    navigate(`/messages/${artistId}`)
  }, [navigate])

  const handleArtistProfileOpen = useCallback((artistId: string) => {
    // Se l'artista cliccato è l'utente corrente, vai al profilo personale
    if (profile && profile.user_id === artistId) {
      navigate('/profile')
    } else {
      navigate(`/artist/${artistId}`)
    }
  }, [navigate, profile])

  const handleFilterSelect = useCallback((filter: 'all' | 'flash' | 'realized') => {
    setFlashFilter(filter)
    setIsFilterDropdownOpen(false)
  }, [])

  const getFilterLabel = useCallback((filter: 'all' | 'flash' | 'realized') => {
    switch (filter) {
      case 'flash': return 'Flash'
      case 'realized': return 'Realizzati'
      default: return 'Tutti'
    }
  }, [])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Memoized list of items sorted by creation date and filtered by flash status
  const recentItems = useMemo(() => {
    let filteredItems = [...portfolioItems]
    
    // Apply flash filter
    if (flashFilter === 'flash') {
      filteredItems = filteredItems.filter(item => item.is_flash === true)
    } else if (flashFilter === 'realized') {
      filteredItems = filteredItems.filter(item => item.is_flash === false)
    }
    // 'all' shows everything, no additional filtering needed
    
    // Sort by creation date (most recent first)
    return filteredItems.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime()
      const bDate = new Date(b.created_at).getTime()
      return bDate - aDate
    })
  }, [portfolioItems, flashFilter])

  if (loading) {
    return (
      <div className="page-container">
        <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="saved-items-page">
      <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
      
      <div className="container">
        {/* Empty state */}
        {!error && recentItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">🆕</div>
              <h2 className="empty-title">Nessuna opera recente</h2>
              <p className="empty-description">
                Non ci sono ancora opere da mostrare. Torna più tardi per scoprire le ultime opere pubblicate dalla community.
              </p>
              <button 
                className="action-btn" 
                onClick={onLogoClick}
                style={{ marginTop: '1.5rem' }}
              >
                Torna alla Home
              </button>
            </div>
          </div>
        )}

        {/* Content area */}
        {(recentItems.length > 0 || error) && (
          <div className="page-content">
            {/* Header */}
            {recentItems.length > 0 && (
              <PageHeader 
                title="USCITE RECENTEMENTE"
                subtitle={recentItems.length === 1 ? (
                  '1 opera recente'
                ) : (
                  `${recentItems.length} opere recenti`
                )}
                actions={
                  <div className="filter-dropdown">
                    <button 
                      className="action-btn" 
                      aria-expanded={isFilterDropdownOpen}
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    >
                      <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                      </svg>
                      <span className="action-text">{getFilterLabel(flashFilter)}</span>
                      <span className="action-icon">
                        <svg className={`chevron-icon ${isFilterDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="6,9 12,15 18,9"/>
                        </svg>
                      </span>
                    </button>
                    {isFilterDropdownOpen && (
                      <div className="filter-dropdown-menu">
                        <button 
                          className={`action-btn ${flashFilter === 'all' ? 'active' : ''}`}
                          onClick={() => handleFilterSelect('all')}
                        >
                          <span className="action-text">Tutti</span>
                        </button>
                        <button 
                          className={`action-btn ${flashFilter === 'flash' ? 'active' : ''}`}
                          onClick={() => handleFilterSelect('flash')}
                        >
                          <span className="action-text">Flash</span>
                        </button>
                        <button 
                          className={`action-btn ${flashFilter === 'realized' ? 'active' : ''}`}
                          onClick={() => handleFilterSelect('realized')}
                        >
                          <span className="action-text">Realizzati</span>
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            )}

            {error && (
              <div className="error-state">
                <div className="error-content">
                  <p className="error-message">{error}</p>
                  <button 
                    className="btn btn-accent retry-btn" 
                    onClick={onLogoClick}
                    style={{ marginTop: '1.5rem' }}
                  >
                    Torna alla Home
                  </button>
                </div>
              </div>
            )}

            {/* Grid */}
            {!error && recentItems.length > 0 && (
              <div className="portfolio-grid">
                {recentItems.map(item => (
                  <PortfolioCard
                    key={item.id}
                    item={item}
                    onArtistClick={handleArtistProfileOpen}
                    onAuthRequired={handleAuthRequired}
                    onContactArtist={handleContactArtist}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth Overlay */}
      {showAuthOverlay && (
        <Suspense fallback={<div />}>
          <AuthOverlay 
            onClose={() => setShowAuthOverlay(false)}
            mode="login"
          />
        </Suspense>
      )}
    </div>
  )
}