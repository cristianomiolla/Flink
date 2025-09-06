import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import './SavedItemsPage.css' // Riusa gli stili esistenti
import './PortfolioGrid.css'
import { SearchBar } from './SearchBar'
import { PageHeader } from './PageHeader'
import LoadingSpinner from './LoadingSpinner'
import { PortfolioCard } from './PortfolioCard'
import { usePortfolioSearch } from '../hooks/usePortfolioSearch'
import { useFollowedArtists } from '../hooks/useFollowedArtists'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import type { PortfolioItem } from '../types/portfolio'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

interface FollowedArtistsWorksPageProps {
  onLogoClick?: () => void
  onArtistClick?: (artistId: string) => void
}

export function FollowedArtistsWorksPage({ onLogoClick, onArtistClick }: FollowedArtistsWorksPageProps) {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const { getFollowedArtistsItems, loading, error } = usePortfolioSearch()
  const { followedArtistIds, loading: followedLoading } = useFollowedArtists()
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

  // Memoized list of items from followed artists, sorted by creation date
  const followedArtistsItems = useMemo(() => {
    return getFollowedArtistsItems(followedArtistIds)
  }, [getFollowedArtistsItems, followedArtistIds])

  const isLoading = loading || followedLoading

  if (isLoading) {
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
        {/* Empty state - not authenticated */}
        {!user && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">👥</div>
              <h2 className="empty-title">Accedi per vedere le opere degli artisti che segui</h2>
              <p className="empty-description">
                Effettua il login per vedere le opere più recenti degli artisti che hai deciso di seguire.
              </p>
              <button 
                className="action-btn" 
                onClick={handleAuthRequired}
                style={{ marginTop: '1.5rem' }}
              >
                Accedi
              </button>
            </div>
          </div>
        )}

        {/* Empty state - authenticated but no followed artists */}
        {user && !error && followedArtistsItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">👥</div>
              <h2 className="empty-title">Non segui ancora nessun artista</h2>
              <p className="empty-description">
                Inizia a seguire degli artisti per vedere le loro opere più recenti qui. Esplora i portfolio e trova i tuoi artisti preferiti.
              </p>
              <button 
                className="action-btn" 
                onClick={onLogoClick}
                style={{ marginTop: '1.5rem' }}
              >
                Esplora Artisti
              </button>
            </div>
          </div>
        )}

        {/* Content area */}
        {user && (followedArtistsItems.length > 0 || error) && (
          <div className="saved-items-content">
            {/* Header */}
            {followedArtistsItems.length > 0 && (
              <PageHeader 
                title="OPERE DEGLI ARTISTI CHE SEGUI"
                subtitle={followedArtistsItems.length === 1 ? (
                  '1 opera recente'
                ) : (
                  `${followedArtistsItems.length} opere recenti`
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
            {!error && followedArtistsItems.length > 0 && (
              <div className="portfolio-grid">
                {followedArtistsItems.map(item => (
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