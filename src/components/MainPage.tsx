import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { CategoryBar } from './CategoryBar'
import { PortfolioGrid } from './PortfolioGrid'
import { ArtistGrid } from './ArtistGrid'
import { AuthOverlay } from './AuthOverlay'
import { usePortfolioSearch } from '../hooks/usePortfolioSearch'

export function MainPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
    navigate(`/artist/${artistId}`)
  }, [navigate])

  const handleLogoClick = useCallback(() => {
    window.location.reload()
  }, [])

  const handleAuthRequired = useCallback(() => {
    setShowAuthOverlay(true)
  }, [])

  const handleContactArtist = useCallback((artistId: string) => {
    navigate(`/messages/${artistId}`)
  }, [navigate])

  return (
    <div className="app">
      <SearchBar onSearch={handleSearch} onLogoClick={handleLogoClick} />
      <CategoryBar 
        onCategoryChange={handleCategoryChange}
        onViewModeChange={handleViewModeChange}
        viewMode={viewMode}
        searchSource={searchSource}
      />
      
      <main className="main-content">
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
      </main>
      
      <AuthOverlay 
        isOpen={showAuthOverlay} 
        onClose={() => setShowAuthOverlay(false)} 
      />
    </div>
  )
}