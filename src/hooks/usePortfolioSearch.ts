import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { PortfolioItem, ArtistProfile, ViewMode, DatabasePortfolioItem, DatabaseProfile } from '../types/portfolio'

interface PortfolioItemWithProfile extends DatabasePortfolioItem {
  profiles: DatabaseProfile
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
            location
          )
        `)
        .eq('profiles.profile_type', 'artist')
        .order('created_at', { ascending: false })
        .limit(50)

      if (portfolioError) {
        throw portfolioError
      }

      // Transform the joined data
      const transformedData: PortfolioItem[] = portfolioData?.map((item: PortfolioItemWithProfile) => {
        const profile = item.profiles
        
        return {
          ...item,
          profiles: undefined, // Remove the nested profiles object
          description: item.description ?? '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          image_url: item.image_url ?? '',
          artist_name: profile?.full_name ?? profile?.username ?? '',
          full_name: profile?.full_name ?? null,
          location: profile?.location ?? item.location ?? null
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
          updated_at
        `)
        .eq('profile_type', 'artist')
        .order('created_at', { ascending: false })
        .limit(100) // Add reasonable limit

      if (profilesError) {
        throw profilesError
      }

      setArtistProfiles((profilesData as ArtistProfile[]) || [])
      
    } catch {
      console.warn('Failed to fetch artist profiles')
      setArtistProfiles([]) // Ensure state is reset on error
      // Don't set global error since portfolio items might still work
    }
  }, [])

  // Memoize filtered items for better performance
  const filteredItems = useMemo(() => {
    let items = portfolioItems

    // Apply flash filter first
    if (flashFilter === 'flash') {
      items = items.filter(item => item.is_flash === true)
    } else if (flashFilter === 'realizzati') {
      items = items.filter(item => item.is_flash === false)
    }

    // Always show all items if no search/location term
    if (!searchTerm.trim() && !locationFilter.trim()) {
      return items
    }

    const searchLower = searchTerm.toLowerCase().trim()
    const locationLower = locationFilter.toLowerCase().trim()

    return items.filter(item => {
      // Search in title, description, and tags
      const matchesSearch = !searchLower || 
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        (Array.isArray(item.tags) && item.tags.some(tag => 
          tag?.toLowerCase().includes(searchLower)
        )) ||
        (item.artist_name && item.artist_name.toLowerCase().includes(searchLower))

      // Location filter matches location field from profile or item
      const matchesLocation = !locationLower ||
        (item.location && item.location.toLowerCase().includes(locationLower))

      return matchesSearch && matchesLocation
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
    refetch: useCallback(() => {
      setDataFetched(false) // Reset cache to allow refetch
      setError(null)
      setLoading(true)
    }, []),
    totalCount: portfolioItems.length,
    filteredCount: filteredItems.length,
    profilesCount: artistProfiles.length,
    filteredProfilesCount: filteredProfiles.length
  }
}