/**
 * Image utilities for handling image loading and fallbacks
 */

// Default placeholder image (you can replace with your own)
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVMMTc1IDEyNUgxMjVIMTAwSDc1TDEyNSA3NVoiIGZpbGw9IiNEREREREQiLz4KPC9zdmc+'

/**
 * Handle image loading errors by providing fallbacks
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget
  if (img.src !== DEFAULT_PLACEHOLDER) {
    console.warn(`Image failed to load: ${img.src}`)
    img.src = DEFAULT_PLACEHOLDER
  }
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
  if (!url || isThirdPartyImage(url)) {
    return DEFAULT_PLACEHOLDER
  }
  return url
}