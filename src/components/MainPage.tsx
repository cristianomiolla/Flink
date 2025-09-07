import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { CategoryBar } from './CategoryBar'
import { PortfolioGrid } from './PortfolioGrid'
import { ArtistGrid } from './ArtistGrid'
import { HorizontalPortfolioSection } from './HorizontalPortfolioSection'
import { usePortfolioSearch } from '../hooks/usePortfolioSearch'
import { useAuth } from '../hooks/useAuth'
import { useFollowedArtists } from '../hooks/useFollowedArtists'
import LoadingSpinner from './LoadingSpinner'

// Lazy load heavy modal component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

export function MainPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, user } = useAuth()
  const [searchSource, setSearchSource] = useState<'search-bar' | 'category' | null>(null)
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  
  const {
    portfolioItems,
    artistProfiles,
    viewMode,
    loading,
    error,
    searchTerm,
    locationFilter,
    flashFilter,
    search,
    setFlashFilter,
    toggleViewMode,
    getFollowedArtistsItems,
    totalCount,
    filteredCount,
    profilesCount,
    filteredProfilesCount
  } = usePortfolioSearch()

  // Hook per ottenere gli artisti seguiti
  const { followedArtistIds } = useFollowedArtists()

  // Gestisci parametri URL al caricamento iniziale
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    const locationFromUrl = searchParams.get('location') || ''
    
    if (searchFromUrl || locationFromUrl) {
      search(searchFromUrl, locationFromUrl)
      setSearchSource('search-bar')
    }
  }, [searchParams, search])

  const handleSearch = useCallback((searchTerm: string, location: string) => {
    setSearchSource('search-bar')
    search(searchTerm, location)
  }, [search])

  const handleCategoryChange = useCallback((category: string) => {
    setSearchSource('category')
    search(category, locationFilter)
  }, [search, locationFilter])

  const handleFlashFilterChange = useCallback((filter: 'all' | 'flash' | 'realizzati') => {
    setFlashFilter(filter)
  }, [setFlashFilter])

  const handleViewModeChange = useCallback((mode: 'portfolio' | 'artists') => {
    toggleViewMode(mode)
  }, [toggleViewMode])

  const handleArtistProfileOpen = useCallback((artistId: string) => {
    // Se l'artista cliccato è l'utente corrente, vai al profilo personale
    if (profile && profile.user_id === artistId) {
      navigate('/profile')
    } else {
      navigate(`/artist/${artistId}`)
    }
  }, [navigate, profile])

  const handleLogoClick = useCallback(() => {
    window.location.reload()
  }, [])

  const handleAuthRequired = useCallback(() => {
    setShowAuthOverlay(true)
  }, [])

  const handleContactArtist = useCallback((artistId: string) => {
    navigate(`/messages/${artistId}`)
  }, [navigate])

  const handleShowFeaturedWorks = useCallback(() => {
    navigate('/featured')
  }, [navigate])

  const handleShowFollowedWorks = useCallback(() => {
    navigate('/following')
  }, [navigate])

  const handleShowRecentWorks = useCallback(() => {
    navigate('/recent')
  }, [navigate])

  // Memoized list of items sorted by likes for featured section
  const featuredItems = useMemo(() => {
    return [...portfolioItems].sort((a, b) => {
      const aLikes = a.like_count ?? 0
      const bLikes = b.like_count ?? 0
      return bLikes - aLikes // Sort descending (most likes first)
    })
  }, [portfolioItems])

  // Memoized list of items from followed artists, sorted by creation date
  const followedArtistsItems = useMemo(() => {
    return getFollowedArtistsItems(followedArtistIds)
  }, [getFollowedArtistsItems, followedArtistIds])

  // Memoized list of all items sorted by most recent
  const recentItems = useMemo(() => {
    return [...portfolioItems].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime()
      const bDate = new Date(b.created_at).getTime()
      return bDate - aDate // Sort descending (most recent first)
    })
  }, [portfolioItems])


  return (
    <div className="app">
      {/* Mobile layout: Logo + Search */}
      <div className="mobile-header">
        <div className="mobile-logo" onClick={handleLogoClick}>
          <span className="mobile-logo-text">SKUNK</span>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} onLogoClick={handleLogoClick} />
      <CategoryBar 
        onCategoryChange={handleCategoryChange}
        onViewModeChange={handleViewModeChange}
        viewMode={viewMode}
        searchSource={searchSource}
      />
      
      <main className="main-content">
        {/* Show horizontal sections when no search is active and in portfolio mode */}
        {!searchTerm && !locationFilter && viewMode === 'portfolio' && flashFilter === 'all' && (
          <>
            {/* Featured Portfolio Section */}
            <HorizontalPortfolioSection
              title="In evidenza"
              items={featuredItems}
              onArtistClick={handleArtistProfileOpen}
              onAuthRequired={handleAuthRequired}
              onContactArtist={handleContactArtist}
              onShowMore={handleShowFeaturedWorks}
            />
            
            {/* Following Artists Section - Only for authenticated users */}
            {user && (
              <HorizontalPortfolioSection
                title="Artisti che segui"
                items={followedArtistsItems}
                onArtistClick={handleArtistProfileOpen}
                onAuthRequired={handleAuthRequired}
                onContactArtist={handleContactArtist}
                onShowMore={handleShowFollowedWorks}
              />
            )}
            
            {/* Recent Works Section */}
            <HorizontalPortfolioSection
              title="Uscite recentemente"
              items={recentItems}
              onArtistClick={handleArtistProfileOpen}
              onAuthRequired={handleAuthRequired}
              onContactArtist={handleContactArtist}
              onShowMore={handleShowRecentWorks}
            />
          </>
        )}
        
        {/* Show traditional grids when searching or in artist mode */}
        {(searchTerm || locationFilter || viewMode === 'artists' || flashFilter !== 'all') && (
          <>
            {viewMode === 'portfolio' ? (
              <PortfolioGrid 
                items={portfolioItems}
                loading={loading}
                error={error}
                searchTerm={searchTerm}
                locationFilter={locationFilter}
                flashFilter={flashFilter}
                totalCount={totalCount}
                filteredCount={filteredCount}
                onArtistClick={handleArtistProfileOpen}
                onFlashFilterChange={handleFlashFilterChange}
                onAuthRequired={handleAuthRequired}
                onContactArtist={handleContactArtist}
              />
            ) : (
              <ArtistGrid 
                profiles={artistProfiles}
                loading={loading}
                error={error}
                searchTerm={searchTerm}
                locationFilter={locationFilter}
                totalCount={profilesCount}
                filteredCount={filteredProfilesCount}
                onArtistClick={handleArtistProfileOpen}
                onAuthRequired={handleAuthRequired}
                onContactArtist={handleContactArtist}
              />
            )}
          </>
        )}
      </main>
      
      {showAuthOverlay && (
        <Suspense fallback={<div className="loading-state"><LoadingSpinner /></div>}>
          <AuthOverlay 
            isOpen={showAuthOverlay} 
            onClose={() => setShowAuthOverlay(false)} 
          />
        </Suspense>
      )}
    </div>
  )
}