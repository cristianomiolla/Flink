import { useEffect } from 'react'
import './ArtistGrid.css'
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
}

export function ArtistGrid({ 
  profiles, 
  loading, 
  error, 
  searchTerm, 
  locationFilter,
  totalCount,
  filteredCount,
  onArtistClick,
  onAuthRequired,
  onContactArtist
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
            subtitle={hasSearchTerms ? (
              filteredCount === 1 ? '1 risultato' : `${filteredCount} risultati`
            ) : (
              totalCount === 1 ? '1 artista totale' : `${totalCount} artisti totali`
            )}
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
              />
            ))}
          </div>
        </div>
      </section>
    </DataStateHandler>
  )
}