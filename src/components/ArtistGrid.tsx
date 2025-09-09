import { useEffect, useMemo, memo } from 'react'
import './ArtistGrid.css'
import { HorizontalArtistSection } from './HorizontalArtistSection'
import { ArtistCard } from './ArtistCard'
import { useFollowers } from '../hooks/useFollowers'
import { DataStateHandler } from './DataStateHandler'
import { GridHeader, GridSearchInfo } from './GridHeader'
import type { ArtistProfile } from '../types/portfolio'

interface ArtistGridProps {
  profiles: ArtistProfile[]
  loading: boolean
  error: string | null
  searchTerm: string
  locationFilter: string
  totalCount: number
  filteredCount: number
  onArtistClick?: (artistId: string) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
  onShowMoreFeatured?: () => void
  onShowMoreRecent?: () => void
}

const ArtistGrid = memo(function ArtistGrid({ 
  profiles, 
  loading, 
  error, 
  searchTerm, 
  locationFilter,
  filteredCount,
  onArtistClick,
  onAuthRequired,
  onContactArtist,
  onShowMoreFeatured,
  onShowMoreRecent
}: ArtistGridProps) {
  const { fetchFollowerStats } = useFollowers()
  
  // Fetch follower stats for all displayed artists
  useEffect(() => {
    if (profiles.length > 0) {
      const artistUserIds = profiles.map(p => p.user_id)
      fetchFollowerStats(artistUserIds)
    }
  }, [profiles, fetchFollowerStats])
  
  const hasSearchTerms = searchTerm.trim() || locationFilter.trim()
  
  // Separate artists into popular and recent sections
  const { popularArtists, recentArtists } = useMemo(() => {
    if (hasSearchTerms) {
      // If there are search terms, show all results distributed across sections
      return {
        popularArtists: profiles.slice(0, 12),
        recentArtists: profiles.slice(12, 24)
      }
    }
    
    // For non-search view, separate by creation date and followers
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    // Recent artists (last 30 days)
    const recent = profiles.filter(profile => 
      new Date(profile.created_at) > thirtyDaysAgo
    ).slice(0, 12)
    
    // All artists sorted by follower count for popular section
    // Use follower_count directly from the profile data (loaded with the profiles)
    const sortedByFollowers = [...profiles].sort((a, b) => {
      const aFollowers = a.follower_count || 0
      const bFollowers = b.follower_count || 0
      
      if (bFollowers !== aFollowers) {
        return bFollowers - aFollowers
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    const popular = sortedByFollowers.slice(0, 12)
    
    return {
      popularArtists: popular,
      recentArtists: recent
    }
  }, [profiles, hasSearchTerms])

  // Show traditional grid when there are search terms
  if (hasSearchTerms) {
    return (
      <DataStateHandler
        loading={loading}
        error={error}
        data={profiles}
        searchTerm={searchTerm}
        locationFilter={locationFilter}
        emptyTitle="Nessun artista"
        searchEmptyMessage="Nessun artista trovato per i criteri selezionati"
        fallbackEmptyMessage="Non ci sono ancora artisti registrati"
      >
        <section className="grid-container">
          <div className="container">
            <GridHeader 
              title="ARTISTI"
              subtitle={filteredCount === 1 ? '1 risultato' : `${filteredCount} risultati`}
              searchInfo={
                <GridSearchInfo
                  searchTerm={searchTerm}
                  locationFilter={locationFilter}
                />
              }
            />

            <div className="artist-grid">
              {profiles.map((profile) => (
                <ArtistCard 
                  key={profile.id} 
                  profile={profile}
                  onArtistClick={onArtistClick}
                  onAuthRequired={onAuthRequired}
                  onContactArtist={onContactArtist}
                  isHorizontal={true}
                />
              ))}
            </div>
          </div>
        </section>
      </DataStateHandler>
    )
  }

  // Show horizontal sections when no search terms
  return (
    <DataStateHandler
      loading={loading}
      error={error}
      data={profiles}
      searchTerm={searchTerm}
      locationFilter={locationFilter}
      emptyTitle="Nessun artista"
      searchEmptyMessage="Nessun artista trovato per i criteri selezionati"
      fallbackEmptyMessage="Non ci sono ancora artisti registrati"
    >
      <div>
        {popularArtists.length > 0 && (
          <HorizontalArtistSection
            title="In evidenza"
            artists={popularArtists}
            onArtistClick={onArtistClick}
            onAuthRequired={onAuthRequired}
            onContactArtist={onContactArtist}
            onShowMore={onShowMoreFeatured}
          />
        )}

        {recentArtists.length > 0 && (
          <HorizontalArtistSection
            title="New entry"
            artists={recentArtists}
            onArtistClick={onArtistClick}
            onAuthRequired={onAuthRequired}
            onContactArtist={onContactArtist}
            onShowMore={onShowMoreRecent}
          />
        )}
      </div>
    </DataStateHandler>
  )
})

export { ArtistGrid }