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
  readonly artist_avatar_url?: string | null
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

export interface DatabaseFollower {
  id: string
  follower_id: string
  following_id: string
  created_at: string
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
  price_min_range: number | null
  price_max_range: number | null
  is_price_range: boolean
  fixed_price: number | null
  discount_percentage: number | null
  image_url: string | null
  created_at: string
  updated_at: string
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