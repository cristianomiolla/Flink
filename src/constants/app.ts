// Application constants
export const APP_CONSTANTS = {
  // Pagination limits
  PORTFOLIO_ITEMS_LIMIT: 50,
  ARTIST_PROFILES_LIMIT: 100,
} as const

export type AppConstants = typeof APP_CONSTANTS