import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { CategoryBar } from './CategoryBar'
import { PortfolioGrid } from './PortfolioGrid'
import { ArtistGrid } from './ArtistGrid'
import { usePortfolioSearch } from '../hooks/usePortfolioSearch'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

// Lazy load heavy modal component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

export function MainPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
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
    totalCount,
    filteredCount,
    profilesCount,
    filteredProfilesCount
  } = usePortfolioSearch()

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

  // Memoize props to prevent unnecessary re-renders
  const portfolioGridProps = useMemo(() => ({
    items: portfolioItems,
    loading,
    error,
    searchTerm,
    locationFilter,
    flashFilter,
    totalCount,
    filteredCount,
    onArtistClick: handleArtistProfileOpen,
    onFlashFilterChange: handleFlashFilterChange,
    onAuthRequired: handleAuthRequired,
    onContactArtist: handleContactArtist
  }), [portfolioItems, loading, error, searchTerm, locationFilter, flashFilter, totalCount, filteredCount, handleArtistProfileOpen, handleFlashFilterChange, handleAuthRequired, handleContactArtist])

  const artistGridProps = useMemo(() => ({
    profiles: artistProfiles,
    loading,
    error,
    searchTerm,
    locationFilter,
    totalCount: profilesCount,
    filteredCount: filteredProfilesCount,
    onArtistClick: handleArtistProfileOpen,
    onAuthRequired: handleAuthRequired,
    onContactArtist: handleContactArtist
  }), [artistProfiles, loading, error, searchTerm, locationFilter, profilesCount, filteredProfilesCount, handleArtistProfileOpen, handleAuthRequired, handleContactArtist])

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
        {viewMode === 'portfolio' ? (
          <PortfolioGrid {...portfolioGridProps} />
        ) : (
          <ArtistGrid {...artistGridProps} />
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