export interface DatabasePortfolioItem {
  readonly id: string
  readonly user_id: string
  title: string
  description: string | null
  image_url: string | null
  tags: readonly string[] | null
  is_flash: boolean
  price: number | null
  location: string | null
  readonly created_at: string
  readonly updated_at: string
}

export interface PortfolioItem extends DatabasePortfolioItem {
  readonly artist_name?: string
  readonly full_name?: string | null
  readonly username?: string | null
  readonly profile_type?: 'client' | 'artist'
  readonly artist_avatar_url?: string | null
  readonly like_count?: number
}

export interface DatabaseProfile {
  readonly id: string
  readonly user_id: string
  readonly email: string
  full_name: string | null
  username: string | null
  readonly profile_type: 'client' | 'artist'
  bio: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  readonly created_at: string
  readonly updated_at: string
}

export interface ArtistProfile extends DatabaseProfile {
  profile_type: 'artist'
  follower_count?: number
}

export interface FollowerStats {
  user_id: string
  follower_count: number
  is_following: boolean
}

export interface ArtistService {
  id: string
  user_id: string
  name: string
  description: string | null
  body_area: string | null
  size_category: string | null
  pricing_type: 'fixed' | 'range'
  fixed_price: number | null
  price_min: number | null
  price_max: number | null
  discount_percentage: number | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateServiceData {
  name: string
  description: string
  body_area: string
  size_category: string
  pricing_type: 'fixed' | 'range'
  fixed_price: number | null
  price_min: number | null
  price_max: number | null
  discount_percentage: number | null
  image_url: string
}

export type ViewMode = 'portfolio' | 'artists'
export type TabType = 'portfolio' | 'servizi' | 'flash' | 'recensioni'
export type FlashFilter = 'all' | 'flash' | 'realizzati'

// Optimized interfaces for performance
export interface PortfolioSearchFilters {
  readonly searchTerm: string
  readonly locationFilter: string
  readonly flashFilter: FlashFilter
}

export interface GridCallbacks {
  readonly onArtistClick?: (artistId: string) => void
  readonly onFlashFilterChange?: (filter: FlashFilter) => void
  readonly onAuthRequired?: () => void
  readonly onContactArtist?: (artistId: string) => void
}

export interface GridStats {
  readonly totalCount: number
  readonly filteredCount: number
}

// Utility types for better type safety
export type PortfolioItemId = string
export type UserId = string
export type ConversationId = `${UserId}__${UserId}`

// Common props interfaces to reduce duplication
export interface CommonPageProps {
  onLogoClick?: () => void
  onArtistClick?: (artistId: string) => void
}

export interface AuthRequiredProps {
  onAuthRequired: () => void
}

// Booking request message types
export interface BookingRequestData {
  subject: string
  tattoo_style: string
  body_area: string
  size_category: string
  color_preferences: string
  meaning?: string
  budget_min?: number
  budget_max?: number
  reference_images?: string[] | null
  created_at: string
}

export interface BookingRequestMessage {
  type: 'booking_request'
  booking_id: string
}

export type MessageType = 'text' | 'booking_request'

export interface DatabaseMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
  deleted_at: string | null
}

// Review interfaces
export interface DatabaseReview {
  readonly id: string
  readonly booking_id: string
  readonly client_id: string
  readonly artist_id: string
  rating: number
  comment: string | null
  readonly created_at: string
}

export interface ReviewWithClient extends DatabaseReview {
  readonly client_profile: {
    readonly full_name: string | null
    readonly username: string | null
    readonly avatar_url: string | null
  } | null
}

export interface ReviewStats {
  readonly average_rating: number
  readonly total_reviews: number
  readonly rating_distribution: {
    readonly [key: number]: number
  }
}


