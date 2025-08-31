/**
 * Image utilities for handling image loading and fallbacks
 */

/**
 * Handle image loading errors by hiding the image
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget
  img.style.display = 'none'
}

/**
 * Check if an image URL might be blocked by tracking prevention
 */
export const isThirdPartyImage = (url: string): boolean => {
  if (!url) return false
  
  const blockedDomains = [
    'pinimg.com',
    'pinterest.com',
    'instagram.com',
    'facebook.com'
  ]
  
  return blockedDomains.some(domain => url.includes(domain))
}

/**
 * Get a safe image URL with fallback handling
 */
export const getSafeImageUrl = (url: string | null): string => {
  if (!url) {
    return ''
  }
  return url
}