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
import { useFollowers } from '../hooks/useFollowers'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

interface FeaturedArtistsPageProps {
  onLogoClick?: () => void
}

export function FeaturedArtistsPage({ onLogoClick }: FeaturedArtistsPageProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { artistProfiles, loading, error } = usePortfolioSearch()
  const { fetchFollowerStats, getFollowerStats } = useFollowers()
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

  // Fetch follower stats for all artists
  useEffect(() => {
    if (artistProfiles.length > 0) {
      const artistUserIds = artistProfiles.map(p => p.user_id)
      fetchFollowerStats(artistUserIds)
    }
  }, [artistProfiles, fetchFollowerStats])

  // Memoized list of featured artists sorted by followers
  const featuredArtists = useMemo(() => {
    // Early return if no artists
    if (!artistProfiles || artistProfiles.length === 0) {
      return []
    }
    
    // Transform profiles to include follower counts
    const artistsWithFollowerCount = artistProfiles.map(profile => {
      const stats = getFollowerStats(profile.user_id)
      return {
        ...profile,
        followerCount: stats?.follower_count || 0
      }
    })

    // Sort by follower count descending, then by creation date for ties
    return artistsWithFollowerCount.sort((a, b) => {
      if (b.followerCount !== a.followerCount) {
        return b.followerCount - a.followerCount
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [artistProfiles, getFollowerStats])

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
        {!error && featuredArtists.length === 0 && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">👨‍🎨</div>
              <h2 className="empty-title">Nessun artista in evidenza</h2>
              <p className="empty-description">
                Non ci sono ancora artisti da mostrare. Torna più tardi per scoprire gli artisti più seguiti dalla community.
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
        {(featuredArtists.length > 0 || error) && (
          <div className="page-content">
            {/* Header */}
            {featuredArtists.length > 0 && (
              <div className="header-card">
                <PageHeader 
                  title="ARTISTI IN EVIDENZA"
                  subtitle={featuredArtists.length === 1 ? (
                    '1 artista in evidenza'
                  ) : (
                    `${featuredArtists.length} artisti in evidenza`
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
            {!error && featuredArtists.length > 0 && (
              <div className="artist-grid">
                {featuredArtists.map(artist => (
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