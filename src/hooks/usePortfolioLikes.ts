import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface PortfolioLike {
  id: string
  portfolio_item_id: string
  user_id: string
  created_at: string
}

export function usePortfolioLikes(portfolioItemId: string) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [tableExists, setTableExists] = useState(false)

  useEffect(() => {
    if (portfolioItemId) {
      checkTableAndFetchData()
    }
  }, [portfolioItemId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkTableAndFetchData = async () => {
    // First check if the table exists by making a simple query
    try {
      const { error } = await supabase
        .from('portfolio_likes')
        .select('id', { count: 'exact', head: true })
        .limit(1)

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          console.warn('Portfolio likes table not configured yet - likes feature disabled')
          setTableExists(false)
          return
        }
      }
      
      setTableExists(true)
      fetchLikeData()
    } catch (error) {
      console.warn('Portfolio likes table not available:', error)
      setTableExists(false)
    }
  }

  const fetchLikeData = async () => {
    try {
      // Combine count and user like check into a single optimized query
      if (user) {
        // For authenticated users, get both count and user's like status in one query
        const [{ count }, { data: userLike, error: userLikeError }] = await Promise.all([
          supabase
            .from('portfolio_likes')
            .select('*', { count: 'exact', head: true })
            .eq('portfolio_item_id', portfolioItemId),
          supabase
            .from('portfolio_likes')
            .select('id')
            .eq('portfolio_item_id', portfolioItemId)
            .eq('user_id', user.id)
            .maybeSingle()
        ])

        // Handle any policy errors
        if (userLikeError && (userLikeError.code === 'PGRST116' || userLikeError.message?.includes('406') || userLikeError.code === '42501')) {
          console.warn('Portfolio likes: RLS policies not configured correctly, using fallback')
          setLikeCount(0)
          setIsLiked(false)
          return
        }

        setLikeCount(count || 0)
        setIsLiked(!!userLike)
      } else {
        // For anonymous users, only get the count
        const { count, error: countError } = await supabase
          .from('portfolio_likes')
          .select('*', { count: 'exact', head: true })
          .eq('portfolio_item_id', portfolioItemId)

        if (countError) {
          if (countError.code === 'PGRST116' || countError.message?.includes('406') || countError.code === '42501') {
            console.warn('Portfolio likes: RLS policies not configured correctly, using fallback')
            setLikeCount(0)
            setIsLiked(false)
            return
          }
          throw countError
        }

        setLikeCount(count || 0)
        setIsLiked(false)
      }
    } catch (error) {
      console.error('Error fetching like data:', error)
      setLikeCount(0)
      setIsLiked(false)
    }
  }

  const toggleLike = async () => {
    if (!user) {
      throw new Error('Authentication required')
    }

    if (!tableExists) {
      throw new Error('Portfolio likes table not configured. Please run the SQL setup script.')
    }

    setLoading(true)
    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('portfolio_likes')
          .delete()
          .eq('portfolio_item_id', portfolioItemId)
          .eq('user_id', user.id)

        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('406')) {
            throw new Error('Portfolio likes table not configured. Please run the SQL setup script.')
          }
          throw error
        }

        setIsLiked(false)
        setLikeCount(prev => prev - 1)
      } else {
        // Add like
        const { error } = await supabase
          .from('portfolio_likes')
          .insert({
            portfolio_item_id: portfolioItemId,
            user_id: user.id
          })

        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('406')) {
            throw new Error('Portfolio likes table not configured. Please run the SQL setup script.')
          }
          throw error
        }

        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    isLiked,
    likeCount,
    toggleLike,
    loading,
    tableExists
  }
}