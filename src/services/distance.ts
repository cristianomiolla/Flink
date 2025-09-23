export interface Coordinates {
  latitude: number
  longitude: number
}

export interface DistanceResult {
  distance: number // in kilometers
  unit: 'km'
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 *
 * @param coord1 First coordinate (latitude, longitude)
 * @param coord2 Second coordinate (latitude, longitude)
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  // Earth's radius in kilometers
  const EARTH_RADIUS_KM = 6371

  // Convert latitude and longitude from degrees to radians
  const lat1Rad = toRadians(coord1.latitude)
  const lon1Rad = toRadians(coord1.longitude)
  const lat2Rad = toRadians(coord2.latitude)
  const lon2Rad = toRadians(coord2.longitude)

  // Differences
  const deltaLat = lat2Rad - lat1Rad
  const deltaLon = lon2Rad - lon1Rad

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Distance in kilometers
  const distance = EARTH_RADIUS_KM * c


  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate distance with additional metadata
 */
export function calculateDistanceWithResult(coord1: Coordinates, coord2: Coordinates): DistanceResult {
  const distance = calculateDistance(coord1, coord2)

  return {
    distance,
    unit: 'km'
  }
}

/**
 * Check if a location is within a certain radius of another location
 */
export function isWithinRadius(
  center: Coordinates,
  target: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, target)
  return distance <= radiusKm
}

/**
 * Sort an array of items by distance from a reference point
 */
export function sortByDistance<T extends { coordinates: Coordinates }>(
  items: T[],
  referencePoint: Coordinates
): Array<T & { distance: number }> {
  return items
    .map(item => ({
      ...item,
      distance: calculateDistance(referencePoint, item.coordinates)
    }))
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Filter items within a radius and sort by distance
 */
export function filterAndSortByDistance<T extends { coordinates: Coordinates }>(
  items: T[],
  referencePoint: Coordinates,
  maxDistanceKm: number
): Array<T & { distance: number }> {
  return sortByDistance(items, referencePoint)
    .filter(item => item.distance <= maxDistanceKm)
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`
  } else {
    return `${Math.round(distanceKm)}km`
  }
}

/**
 * Get distance category for UI purposes
 */
export function getDistanceCategory(distanceKm: number): 'very-close' | 'close' | 'medium' | 'far' {
  if (distanceKm <= 5) return 'very-close'
  if (distanceKm <= 25) return 'close'
  if (distanceKm <= 100) return 'medium'
  return 'far'
}