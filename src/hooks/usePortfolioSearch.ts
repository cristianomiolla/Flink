import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { APP_CONSTANTS } from '../constants/app'
import type { PortfolioItem, ArtistProfile, ViewMode, DatabasePortfolioItem, DatabaseProfile } from '../types/portfolio'

interface PortfolioItemWithProfile extends DatabasePortfolioItem {
  profiles: DatabaseProfile | null
  portfolio_likes: { id: string }[] | null
}

export function usePortfolioSearch() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [artistProfiles, setArtistProfiles] = useState<ArtistProfile[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [flashFilter, setFlashFilter] = useState<'all' | 'flash' | 'realizzati'>('all')

  const fetchPortfolioItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use Supabase JOIN for better performance - single query instead of multiple
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select(`
          *,
          profiles!inner(
            user_id,
            full_name,
            username,
            profile_type,
            bio,
            avatar_url,
            location
          ),
          portfolio_likes!left(id)
        `)
        .eq('profiles.profile_type', 'artist')
        .order('created_at', { ascending: false })
        .limit(APP_CONSTANTS.PORTFOLIO_ITEMS_LIMIT)

      if (portfolioError) {
        throw portfolioError
      }

      // Transform the joined data
      const transformedData: PortfolioItem[] = portfolioData?.map((item: PortfolioItemWithProfile) => {
        const profile = item.profiles
        const likeCount = item.portfolio_likes?.length || 0
        
        
        return {
          ...item,
          profiles: undefined, // Remove the nested profiles object
          portfolio_likes: undefined, // Remove the nested portfolio_likes object
          description: item.description ?? '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          image_url: item.image_url ?? '',
          artist_name: profile?.profile_type === 'client'
            ? (profile?.full_name ?? '')
            : (profile?.username ?? profile?.full_name ?? ''),
          full_name: profile?.username ?? profile?.full_name ?? null,
          username: profile?.username ?? null,
          profile_type: profile?.profile_type,
          artist_avatar_url: profile?.avatar_url ?? null,
          location: profile?.location ?? item.location ?? null,
          like_count: likeCount
        }
      }) || []

      setPortfolioItems(transformedData)
      
    } catch (err) {
      const errorObj = err as Error
      setError(`Database error: ${errorObj.message}`)
      setPortfolioItems([]) // Ensure state is reset on error
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchArtistProfiles = useCallback(async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          full_name,
          username,
          profile_type,
          bio,
          avatar_url,
          phone,
          location,
          created_at,
          updated_at,
          followers!followers_following_id_fkey(id)
        `)
        .eq('profile_type', 'artist')
        .order('created_at', { ascending: false })
        .limit(APP_CONSTANTS.ARTIST_PROFILES_LIMIT)

      if (profilesError) {
        throw profilesError
      }

      // Transform data to include follower_count
      const transformedProfiles: ArtistProfile[] = profilesData?.map((profile: any) => ({
        ...profile,
        follower_count: Array.isArray(profile.followers) ? profile.followers.length : 0,
        followers: undefined // Remove the nested followers array
      } as ArtistProfile)) || []

      setArtistProfiles(transformedProfiles)
      
    } catch {
      // Failed to fetch artist profiles - don't set global error since portfolio items might still work
      setArtistProfiles([]) // Ensure state is reset on error
    }
  }, [])

  // Memoize filtered items for better performance with early exits
  const filteredItems = useMemo(() => {
    // Early return for empty data
    if (portfolioItems.length === 0) return []

    let items = portfolioItems

    // Apply flash filter first (most selective)
    if (flashFilter === 'flash') {
      items = items.filter(item => item.is_flash === true)
    } else if (flashFilter === 'realizzati') {
      items = items.filter(item => item.is_flash === false)
    }

    // Early return if no search filters
    const hasSearchTerm = searchTerm.trim()
    const hasLocationFilter = locationFilter.trim()
    if (!hasSearchTerm && !hasLocationFilter) {
      return items
    }

    const searchLower = hasSearchTerm ? searchTerm.toLowerCase().trim() : ''
    const locationLower = hasLocationFilter ? locationFilter.toLowerCase().trim() : ''
    const searchKeywords = hasSearchTerm ? searchLower.split(/\s+/).filter(keyword => keyword.length > 0) : []

    return items.filter(item => {
      // Location filter (most specific, check first)
      if (hasLocationFilter) {
        const itemLocation = item.location?.toLowerCase()
        if (!itemLocation || !itemLocation.includes(locationLower)) {
          return false
        }
      }

      // Search filter
      if (hasSearchTerm && searchKeywords.length > 0) {
        // Build searchable text only when needed
        const searchableFields = [
          item.title?.toLowerCase() || '',
          item.description?.toLowerCase() || '',
          item.artist_name?.toLowerCase() || '',
          ...(Array.isArray(item.tags) ? item.tags.map(tag => tag?.toLowerCase() || '') : [])
        ].join(' ')

        // Early exit if any keyword is not found
        for (const keyword of searchKeywords) {
          if (!searchableFields.includes(keyword)) {
            return false
          }
        }
      }

      return true
    })
  }, [portfolioItems, searchTerm, locationFilter, flashFilter])

  // Memoize filtered profiles for better performance
  const filteredProfiles = useMemo(() => {
    // Always show all profiles if no search term
    if (!searchTerm.trim() && !locationFilter.trim()) {
      return artistProfiles
    }

    const searchLower = searchTerm.toLowerCase().trim()
    const locationLower = locationFilter.toLowerCase().trim()

    return artistProfiles.filter(profile => {
      // Search in full_name, username, bio, and email
      const matchesSearch = !searchLower || 
        profile.full_name?.toLowerCase().includes(searchLower) ||
        profile.username?.toLowerCase().includes(searchLower) ||
        profile.bio?.toLowerCase().includes(searchLower) ||
        profile.email?.toLowerCase().includes(searchLower)

      // Location filter matches location field
      const matchesLocation = !locationLower ||
        profile.location?.toLowerCase().includes(locationLower)

      return matchesSearch && matchesLocation
    })
  }, [artistProfiles, searchTerm, locationFilter])

  const search = (newSearchTerm: string, newLocationFilter: string) => {
    setSearchTerm(newSearchTerm)
    setLocationFilter(newLocationFilter)
  }

  const resetSearch = () => {
    setSearchTerm('')
    setLocationFilter('')
  }

  const setFlashFilterValue = (filter: 'all' | 'flash' | 'realizzati') => {
    setFlashFilter(filter)
  }

  const toggleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  // Cache key for preventing unnecessary refetches
  const [dataFetched, setDataFetched] = useState(false)

  // Fetch all portfolio items and artist profiles on mount (only once)
  useEffect(() => {
    if (!dataFetched) {
      Promise.all([fetchPortfolioItems(), fetchArtistProfiles()])
        .then(() => setDataFetched(true))
        .catch(() => setDataFetched(true)) // Still mark as fetched to prevent infinite retries
    }
  }, [fetchPortfolioItems, fetchArtistProfiles, dataFetched])

  // Simplified refresh mechanism - only on explicit refetch
  const handleRefetch = useCallback(() => {
    setDataFetched(false)
    setError(null) 
    setLoading(true)
  }, [])

  // Method to get portfolio items from followed artists only
  const getFollowedArtistsItems = useCallback((followedArtistIds: string[]) => {
    if (followedArtistIds.length === 0) {
      return []
    }

    return portfolioItems
      .filter(item => followedArtistIds.includes(item.user_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Sort by creation date, newest first
  }, [portfolioItems])

  // No longer need useEffect for filtering since we're using useMemo

  return {
    portfolioItems: filteredItems,
    allItems: portfolioItems,
    artistProfiles: filteredProfiles,
    allProfiles: artistProfiles,
    viewMode,
    loading,
    error,
    searchTerm,
    locationFilter,
    flashFilter,
    search,
    resetSearch,
    setFlashFilter: setFlashFilterValue,
    toggleViewMode,
    refetch: handleRefetch,
    getFollowedArtistsItems,
    totalCount: portfolioItems.length,
    filteredCount: filteredItems.length,
    profilesCount: artistProfiles.length,
    filteredProfilesCount: filteredProfiles.length
  }
}