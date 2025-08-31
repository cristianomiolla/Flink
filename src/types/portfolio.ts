export interface DatabasePortfolioItem {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  tags: string[] | null
  is_flash: boolean
  price: number | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface PortfolioItem extends DatabasePortfolioItem {
  artist_name?: string
  full_name?: string | null
}

export interface DatabaseProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  username: string | null
  profile_type: 'client' | 'artist'
  bio: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  created_at: string
  updated_at: string
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