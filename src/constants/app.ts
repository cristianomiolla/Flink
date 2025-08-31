// Application constants
export const APP_CONSTANTS = {
  // Pagination limits
  PORTFOLIO_ITEMS_LIMIT: 50,
  ARTIST_PROFILES_LIMIT: 100,
  
  // Form validation
  MAX_BIO_LENGTH: 500,
  MAX_TITLE_LENGTH: 100,
  MAX_LOCATION_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  
  // Responsive breakpoints
  BREAKPOINTS: {
    MOBILE_MAX: '767px',
    TABLET_MIN: '768px',
    DESKTOP_MIN: '1024px',
    LARGE_MIN: '1536px'
  },
  
  // Default values
  DEFAULT_FOLLOWER_COUNT: 1247,
  
  // Routes
  ROUTES: {
    HOME: '/',
    PROFILE: '/profile',
    SAVED: '/saved',
    MESSAGES: '/messages',
    ARTIST: '/artist',
    BECOME_ARTIST: '/become-artist'
  }
} as const

export type AppConstants = typeof APP_CONSTANTS