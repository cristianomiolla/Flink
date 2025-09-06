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

interface FeaturedWorksPageProps {
  onLogoClick?: () => void
  onArtistClick?: (artistId: string) => void
}

export function FeaturedWorksPage({ onLogoClick, onArtistClick }: FeaturedWorksPageProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { portfolioItems, loading, error } = usePortfolioSearch()
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)

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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Memoized list of items sorted by likes for featured section
  const featuredItems = useMemo(() => {
    return [...portfolioItems].sort((a, b) => {
      const aLikes = a.like_count ?? 0
      const bLikes = b.like_count ?? 0
      return bLikes - aLikes // Sort descending (most likes first)
    })
  }, [portfolioItems])

  if (loading) {
    return (
      <div className="saved-items-page">
        <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
        <div className="saved-items-loading">
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
        {!error && featuredItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">⭐</div>
              <h2 className="empty-title">Nessuna opera in evidenza</h2>
              <p className="empty-description">
                Non ci sono ancora opere da mostrare. Torna più tardi per scoprire le opere più apprezzate dalla community.
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
        {(featuredItems.length > 0 || error) && (
          <div className="saved-items-content">
            {/* Header */}
            {featuredItems.length > 0 && (
              <PageHeader 
                title="OPERE IN EVIDENZA"
                subtitle={featuredItems.length === 1 ? (
                  '1 opera in evidenza'
                ) : (
                  `${featuredItems.length} opere in evidenza`
                )}
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
            {!error && featuredItems.length > 0 && (
              <div className="portfolio-grid">
                {featuredItems.map(item => (
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