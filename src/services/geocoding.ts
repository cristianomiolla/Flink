export interface CityCoordinates {
  latitude: number
  longitude: number
  displayName: string
}

export interface GeocodingError {
  message: string
  status?: number
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
}

const GEOCODING_CACHE_KEY = 'geocoding_cache'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const API_DELAY = 1100 // Nominatim rate limit: 1 request per second + buffer

// Rate limiting - simple queue to respect 1 req/sec limit
let lastRequestTime = 0

class GeocodingService {
  private cache: Map<string, { coordinates: CityCoordinates; timestamp: number }>

  constructor() {
    this.cache = new Map()
    this.loadCache()
  }

  private loadCache(): void {
    try {
      const cachedData = localStorage.getItem(GEOCODING_CACHE_KEY)
      if (cachedData) {
        const parsedData = JSON.parse(cachedData)
        const now = Date.now()

        // Filter out expired entries
        Object.entries(parsedData as Record<string, { coordinates: CityCoordinates; timestamp: number }>).forEach(([city, data]) => {
          if (now - data.timestamp < CACHE_DURATION) {
            this.cache.set(city.toLowerCase(), data)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load geocoding cache:', error)
      localStorage.removeItem(GEOCODING_CACHE_KEY)
    }
  }

  private saveCache(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache)
      localStorage.setItem(GEOCODING_CACHE_KEY, JSON.stringify(cacheObject))
    } catch (error) {
      console.warn('Failed to save geocoding cache:', error)
    }
  }

  private async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime

    if (timeSinceLastRequest < API_DELAY) {
      const delayNeeded = API_DELAY - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, delayNeeded))
    }

    lastRequestTime = Date.now()
    return fetch(url)
  }

  async getCityCoordinates(cityName: string): Promise<CityCoordinates> {
    if (!cityName || typeof cityName !== 'string') {
      throw new Error('Nome città non valido')
    }

    const normalizedCity = cityName.trim().toLowerCase()

    // Check cache first
    const cached = this.cache.get(normalizedCity)
    if (cached) {
      return cached.coordinates
    }

    try {
      // Build search query - prioritize Italian cities
      const searchQuery = encodeURIComponent(`${cityName}, Italia`)
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${searchQuery}&` +
        `format=json&` +
        `limit=1&` +
        `countrycodes=it&` +
        `addressdetails=1&` +
        `accept-language=it`

      const response = await this.rateLimitedFetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: NominatimResponse[] = await response.json()

      if (!data || data.length === 0) {
        throw new Error(`Città "${cityName}" non trovata`)
      }

      const result = data[0]
      const coordinates: CityCoordinates = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name
      }

      // Validate coordinates
      if (isNaN(coordinates.latitude) || isNaN(coordinates.longitude)) {
        throw new Error(`Coordinate non valide per "${cityName}"`)
      }


      // Cache the result
      this.cache.set(normalizedCity, {
        coordinates,
        timestamp: Date.now()
      })
      this.saveCache()

      return coordinates

    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Errore nel geocoding per "${cityName}": ${error}`)
    }
  }

  // Batch geocoding for multiple cities
  async getBatchCoordinates(cities: string[]): Promise<Map<string, CityCoordinates | null>> {
    const results = new Map<string, CityCoordinates | null>()

    for (const city of cities) {
      try {
        const coordinates = await this.getCityCoordinates(city)
        results.set(city, coordinates)
      } catch (error) {
        console.warn(`Geocoding failed for "${city}":`, error)
        results.set(city, null)
      }
    }

    return results
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((value, key) => {
      if (now - value.timestamp >= CACHE_DURATION) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
    this.saveCache()
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([city, data]) => ({
        city,
        coordinates: data.coordinates,
        cachedAt: new Date(data.timestamp).toLocaleString('it-IT')
      }))
    }
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear()
    localStorage.removeItem(GEOCODING_CACHE_KEY)
    console.log('Geocoding cache cleared')
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()

// Convenience function for single city lookup
export async function getCityCoordinates(cityName: string): Promise<CityCoordinates> {
  return geocodingService.getCityCoordinates(cityName)
}

// Convenience function for batch lookup
export async function getBatchCoordinates(cities: string[]): Promise<Map<string, CityCoordinates | null>> {
  return geocodingService.getBatchCoordinates(cities)
}