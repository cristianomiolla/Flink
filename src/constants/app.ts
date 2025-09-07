// Application constants
export const APP_CONSTANTS = {
  // Pagination limits
  PORTFOLIO_ITEMS_LIMIT: 50,
  ARTIST_PROFILES_LIMIT: 100,
  
  // UI constants
  POLLING_INTERVAL: 3000, // Message polling interval in ms
  DEBOUNCE_DELAY: 300, // Search debounce delay in ms
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB max image size
  
  // Mobile breakpoint
  MOBILE_BREAKPOINT: 767,
  
  // Animation durations
  MODAL_ANIMATION_DURATION: 300,
  
  // Z-index layers
  Z_INDEX: {
    MODAL: 1000,
    DROPDOWN: 100,
    MOBILE_NAV: 1001,
    MODAL_OVERLAY: 1050,
  }
} as const

export type AppConstants = typeof APP_CONSTANTS