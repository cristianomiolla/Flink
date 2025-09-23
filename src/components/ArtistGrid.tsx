import { useEffect, useMemo, memo, useState } from 'react'
import './ArtistGrid.css'
import { HorizontalArtistSection } from './HorizontalArtistSection'
import { ArtistCard } from './ArtistCard'
import { useFollowers } from '../hooks/useFollowers'
import { useUserLocation } from '../hooks/useUserLocation'
import { DataStateHandler } from './DataStateHandler'
import { GridHeader, GridSearchInfo } from './GridHeader'
import { getBatchCoordinates } from '../services/geocoding'
import { filterAndSortByDistance, type Coordinates } from '../services/distance'
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
  onShowMoreNearby?: () => void
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
  onShowMoreRecent,
  onShowMoreNearby
}: ArtistGridProps) {
  const { fetchFollowerStats } = useFollowers()
  const { location: userLocation, requestLocation, error: locationError } = useUserLocation()
  const [nearbyArtistsWithDistance, setNearbyArtistsWithDistance] = useState<Array<ArtistProfile & { distance: number }>>([])
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false)

  // Check if user has granted location permission
  const hasLocationPermission = userLocation !== null && locationError?.code !== 1

  const hasSearchTerms = searchTerm.trim() || locationFilter.trim()

  // Fetch follower stats for all displayed artists
  useEffect(() => {
    if (profiles.length > 0) {
      const artistUserIds = profiles.map(p => p.user_id)
      fetchFollowerStats(artistUserIds)
    }
  }, [profiles, fetchFollowerStats])

  // Request user location on mount if not already available
  useEffect(() => {
    if (!userLocation) {
      requestLocation()
    }
  }, [userLocation, requestLocation])

  // Calculate nearby artists when user location or profiles change
  useEffect(() => {
    const calculateNearbyArtists = async () => {
      if (!userLocation || profiles.length === 0 || hasSearchTerms) {
        setNearbyArtistsWithDistance([])
        return
      }

      setIsCalculatingDistances(true)

      try {
        // Get unique cities from artists
        const uniqueCities = Array.from(
          new Set(
            profiles
              .map(p => p.location)
              .filter((location): location is string => Boolean(location?.trim()))
          )
        )


        if (uniqueCities.length === 0) {
          setNearbyArtistsWithDistance([])
          setIsCalculatingDistances(false)
          return
        }

        // Batch geocode all cities
        const cityCoordinates = await getBatchCoordinates(uniqueCities)

        // Create artists with coordinates
        const artistsWithCoordinates = profiles
          .map(artist => {
            const coords = artist.location ? cityCoordinates.get(artist.location) : null
            return coords ? {
              ...artist,
              coordinates: {
                latitude: coords.latitude,
                longitude: coords.longitude
              } as Coordinates
            } : null
          })
          .filter((artist): artist is ArtistProfile & { coordinates: Coordinates } => artist !== null)

        // Filter and sort by distance (within 100km)
        const userCoords = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }

        const nearbyWithDistance = filterAndSortByDistance(
          artistsWithCoordinates,
          userCoords,
          250 // 250km radius - increased for better coverage
        )

        setNearbyArtistsWithDistance(nearbyWithDistance.slice(0, 12))

      } catch (error) {
        console.warn('Error calculating nearby artists:', error)
        setNearbyArtistsWithDistance([])
      } finally {
        setIsCalculatingDistances(false)
      }
    }

    calculateNearbyArtists()
  }, [userLocation, profiles, hasSearchTerms])

  // Separate artists into popular, recent and nearby sections
  const { popularArtists, recentArtists, nearbyArtists } = useMemo(() => {
    if (hasSearchTerms) {
      // If there are search terms, show all results distributed across sections
      return {
        popularArtists: profiles.slice(0, 12),
        recentArtists: profiles.slice(12, 24),
        nearbyArtists: profiles.slice(24, 36)
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

    // Use calculated nearby artists with distance (fallback to empty if no location-based data)
    const nearby = nearbyArtistsWithDistance

    return {
      popularArtists: popular,
      recentArtists: recent,
      nearbyArtists: nearby
    }
  }, [profiles, hasSearchTerms, nearbyArtistsWithDistance])

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

        {hasLocationPermission && (nearbyArtists.length > 0 || isCalculatingDistances) && (
          <HorizontalArtistSection
            title={
              isCalculatingDistances
                ? "Artisti vicini (calcolando...)"
                : nearbyArtists.length > 0
                  ? `Vicini a te`
                  : "Artisti vicini"
            }
            artists={nearbyArtists}
            onArtistClick={onArtistClick}
            onAuthRequired={onAuthRequired}
            onContactArtist={onContactArtist}
            onShowMore={onShowMoreNearby}
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