import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import './SavedItemsPage.css' // Riusa gli stili esistenti
import './ArtistGrid.css'
import { SearchBar } from './SearchBar'
import { PageHeader } from './PageHeader'
import LoadingSpinner from './LoadingSpinner'
import { ArtistCard } from './ArtistCard'
import { usePortfolioSearch } from '../hooks/usePortfolioSearch'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import EmptyState from './EmptyState'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

interface RecentArtistsPageProps {
  onLogoClick?: () => void
}

export function RecentArtistsPage({ onLogoClick }: RecentArtistsPageProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { artistProfiles, loading, error } = usePortfolioSearch()
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


  // Memoized list of recent artists (last 30 days) sorted by creation date
  const recentArtists = useMemo(() => {
    // Early return if no artists
    if (!artistProfiles || artistProfiles.length === 0) {
      return []
    }
    
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    // Filter for recent artists and sort by creation date (newest first)
    return artistProfiles
      .filter(profile => new Date(profile.created_at) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [artistProfiles])

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
        {!error && recentArtists.length === 0 && (
          <EmptyState
            icon="🆕"
            title="Nessun artista recente"
            description="Non ci sono artisti che si sono iscritti negli ultimi 30 giorni. Torna più tardi per scoprire i nuovi talenti."
            action={
              <button
                className="action-btn"
                onClick={onLogoClick}
                style={{ marginTop: '1.5rem' }}
              >
                Torna alla Home
              </button>
            }
          />
        )}

        {/* Content area */}
        {(recentArtists.length > 0 || error) && (
          <div className="page-content">
            {/* Header */}
            {recentArtists.length > 0 && (
              <div className="header-card">
                <PageHeader 
                  title="ARTISTI ISCRITTI DA POCO"
                  subtitle={recentArtists.length === 1 ? (
                    '1 artista negli ultimi 30 giorni'
                  ) : (
                    `${recentArtists.length} artisti negli ultimi 30 giorni`
                  )}
                />
              </div>
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
            {!error && recentArtists.length > 0 && (
              <div className="artist-grid">
                {recentArtists.map(artist => (
                  <ArtistCard
                    key={artist.id}
                    profile={artist}
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
            isOpen={showAuthOverlay}
            onClose={() => setShowAuthOverlay(false)}
          />
        </Suspense>
      )}
    </div>
  )
}