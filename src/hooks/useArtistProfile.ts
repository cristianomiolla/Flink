import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ArtistProfile, DatabasePortfolioItem, ArtistService } from '../types/portfolio'

export function useArtistProfile(artistId: string) {
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<DatabasePortfolioItem[]>([])
  const [services, setServices] = useState<ArtistService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArtistProfile = useCallback(async () => {
    if (!artistId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Use Promise.allSettled for parallel queries with better error handling
      const [profileResult, portfolioResult, servicesResult] = await Promise.allSettled([
        // Fetch artist profile
        supabase
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
          .eq('user_id', artistId)
          .eq('profile_type', 'artist')
          .single(),

        // Fetch artist's portfolio items
        supabase
          .from('portfolio_items')
          .select(`
            id,
            user_id,
            title,
            description,
            image_url,
            tags,
            is_flash,
            price,
            location,
            created_at,
            updated_at
          `)
          .eq('user_id', artistId)
          .order('created_at', { ascending: false }),

        // Fetch artist services (if table exists)
        supabase
          .from('artist_services')
          .select('*')
          .eq('user_id', artistId)
          .order('created_at', { ascending: true })
      ])

      // Handle profile data
      if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
        setProfile(profileResult.value.data as ArtistProfile)
      } else {
        const error = profileResult.status === 'rejected' 
          ? profileResult.reason 
          : profileResult.value.error
        throw new Error(`Profile not found: ${error.message}`)
      }

      // Handle portfolio data
      if (portfolioResult.status === 'fulfilled' && !portfolioResult.value.error) {
        setPortfolioItems((portfolioResult.value.data as DatabasePortfolioItem[]) || [])
      } else {
        // Failed to fetch portfolio items
        setPortfolioItems([])
      }

      // Handle services data
      if (servicesResult.status === 'fulfilled' && !servicesResult.value.error) {
        setServices((servicesResult.value.data as ArtistService[]) || [])
      } else {
        // Failed to fetch artist services
        setServices([])
      }
      
    } catch (err) {
      const error = err as Error
      setError(error.message)
      setProfile(null)
      setPortfolioItems([])
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [artistId])

  useEffect(() => {
    fetchArtistProfile()
  }, [fetchArtistProfile])

  return {
    profile,
    portfolioItems,
    services,
    loading,
    error,
    refetch: fetchArtistProfile
  }
}