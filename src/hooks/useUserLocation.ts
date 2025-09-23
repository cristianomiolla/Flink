import { useState, useEffect, useCallback } from 'react'

export interface UserLocation {
  latitude: number
  longitude: number
}

export interface LocationError {
  code: number
  message: string
}

export interface UseUserLocationReturn {
  location: UserLocation | null
  loading: boolean
  error: LocationError | null
  requestLocation: () => void
  clearError: () => void
}

const LOCATION_CACHE_KEY = 'user_location'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<LocationError | null>(null)

  // Load cached location on mount
  useEffect(() => {
    const cachedData = sessionStorage.getItem(LOCATION_CACHE_KEY)
    if (cachedData) {
      try {
        const { location: cachedLocation, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Check if cache is still valid (within 1 hour)
        if (now - timestamp < CACHE_DURATION) {
          setLocation(cachedLocation)
          return
        } else {
          // Remove expired cache
          sessionStorage.removeItem(LOCATION_CACHE_KEY)
        }
      } catch {
        // Invalid cache data, remove it
        sessionStorage.removeItem(LOCATION_CACHE_KEY)
      }
    }
  }, [])

  const requestLocation = useCallback(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError({
        code: -1,
        message: 'Geolocalizzazione non supportata dal browser'
      })
      return
    }

    setLoading(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy: false, // Use network location for faster response
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // Accept 5-minute-old position
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }

        setLocation(userLocation)
        setLoading(false)

        // Cache the location with timestamp
        const cacheData = {
          location: userLocation,
          timestamp: Date.now()
        }
        sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData))
      },
      (err) => {
        setLoading(false)

        let errorMessage: string
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Accesso alla posizione negato. Abilita la geolocalizzazione nelle impostazioni del browser.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Posizione non disponibile. Controlla la connessione.'
            break
          case err.TIMEOUT:
            errorMessage = 'Timeout nella richiesta di posizione. Riprova.'
            break
          default:
            errorMessage = 'Errore sconosciuto nella geolocalizzazione.'
            break
        }

        setError({
          code: err.code,
          message: errorMessage
        })
      },
      options
    )
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    location,
    loading,
    error,
    requestLocation,
    clearError
  }
}