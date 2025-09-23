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
import { useUserLocation } from '../hooks/useUserLocation'
import { getBatchCoordinates } from '../services/geocoding'
import { filterAndSortByDistance, formatDistance, type Coordinates } from '../services/distance'
import EmptyState from './EmptyState'
import type { ArtistProfile } from '../types/portfolio'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

interface NearbyArtistsPageProps {
  onLogoClick?: () => void
}

export function NearbyArtistsPage({ onLogoClick }: NearbyArtistsPageProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { artistProfiles, loading, error } = usePortfolioSearch()
  const { fetchFollowerStats } = useFollowers()
  const { location: userLocation, requestLocation, error: locationError } = useUserLocation()
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  const [nearbyArtists, setNearbyArtists] = useState<Array<ArtistProfile & { distance: number }>>([])
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false)

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

  // Request user location on mount if not already available
  useEffect(() => {
    if (!userLocation && !locationError) {
      requestLocation()
    }
  }, [userLocation, locationError, requestLocation])

  // Fetch follower stats for all artists
  useEffect(() => {
    if (artistProfiles.length > 0) {
      const artistUserIds = artistProfiles.map(p => p.user_id)
      fetchFollowerStats(artistUserIds)
    }
  }, [artistProfiles, fetchFollowerStats])

  // Calculate nearby artists when user location or profiles change
  useEffect(() => {
    const calculateNearbyArtists = async () => {
      if (!userLocation || artistProfiles.length === 0) {
        setNearbyArtists([])
        return
      }

      setIsCalculatingDistances(true)

      try {
        // Get unique cities from artists
        const uniqueCities = Array.from(
          new Set(
            artistProfiles
              .map(p => p.location)
              .filter((location): location is string => Boolean(location?.trim()))
          )
        )

        if (uniqueCities.length === 0) {
          setNearbyArtists([])
          setIsCalculatingDistances(false)
          return
        }

        // Batch geocode all cities
        const cityCoordinates = await getBatchCoordinates(uniqueCities)

        // Create artists with coordinates
        const artistsWithCoordinates = artistProfiles
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

        // Filter and sort by distance (within 250km)
        const userCoords = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }

        const nearbyWithDistance = filterAndSortByDistance(
          artistsWithCoordinates,
          userCoords,
          250 // 250km radius
        )

        setNearbyArtists(nearbyWithDistance)

      } catch (error) {
        console.warn('Error calculating nearby artists:', error)
        setNearbyArtists([])
      } finally {
        setIsCalculatingDistances(false)
      }
    }

    calculateNearbyArtists()
  }, [userLocation, artistProfiles])

  // Check if user has location permission
  const hasLocationPermission = userLocation !== null && locationError?.code !== 1
  const isLocationDenied = locationError?.code === 1

  // Memoized subtitle
  const subtitle = useMemo(() => {
    if (isCalculatingDistances) {
      return 'Calcolando distanze...'
    }
    if (nearbyArtists.length === 0) {
      return 'Nessun artista trovato nelle vicinanze'
    }
    if (nearbyArtists.length === 1) {
      return '1 artista nelle vicinanze'
    }
    return `${nearbyArtists.length} artisti nelle vicinanze`
  }, [nearbyArtists.length, isCalculatingDistances])

  if (loading || isCalculatingDistances) {
    return (
      <div className="page-container">
        <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
        <div className="page-loading">
          <LoadingSpinner />
          {isCalculatingDistances && (
            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
              Calcolando artisti nelle vicinanze...
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="saved-items-page">
      <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />

      <div className="container">
        {/* Empty state for location permission denied */}
        {isLocationDenied && (
          <EmptyState
            icon="📍"
            title="Posizione non disponibile"
            description="Per vedere gli artisti vicini a te, abilita la geolocalizzazione nelle impostazioni del browser."
            action={
              <button
                className="action-btn"
                onClick={requestLocation}
                style={{ marginTop: '1.5rem' }}
              >
                Riprova geolocalizzazione
              </button>
            }
          />
        )}

        {/* Empty state for no location */}
        {!error && !isLocationDenied && !hasLocationPermission && (
          <EmptyState
            icon="🗺️"
            title="Geolocalizzazione richiesta"
            description="Per scoprire gli artisti vicini a te, autorizza l'accesso alla tua posizione."
            action={
              <button
                className="action-btn"
                onClick={requestLocation}
                style={{ marginTop: '1.5rem' }}
              >
                Autorizza posizione
              </button>
            }
          />
        )}

        {/* Empty state for no nearby artists */}
        {!error && hasLocationPermission && nearbyArtists.length === 0 && !isCalculatingDistances && (
          <EmptyState
            icon="🎨"
            title="Nessun artista nelle vicinanze"
            description="Non ci sono artisti entro 250km dalla tua posizione. Prova ad esplorare gli artisti in evidenza."
            action={
              <button
                className="action-btn"
                onClick={() => navigate('/featured-artists')}
                style={{ marginTop: '1.5rem' }}
              >
                Esplora tutti gli artisti
              </button>
            }
          />
        )}

        {/* Content area */}
        {hasLocationPermission && (nearbyArtists.length > 0 || error) && (
          <div className="page-content">
            {/* Header */}
            {nearbyArtists.length > 0 && (
              <div className="header-card">
                <PageHeader
                  title="ARTISTI VICINI"
                  subtitle={subtitle}
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
            {!error && nearbyArtists.length > 0 && (
              <div className="artist-grid">
                {nearbyArtists.map(artist => (
                  <div key={artist.id} className="artist-card-with-distance">
                    <ArtistCard
                      profile={artist}
                      onArtistClick={handleArtistProfileOpen}
                      onAuthRequired={handleAuthRequired}
                      onContactArtist={handleContactArtist}
                    />
                    <div className="distance-badge">
                      📍 {formatDistance(artist.distance)}
                    </div>
                  </div>
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