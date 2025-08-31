import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { FollowerStats } from '../types/portfolio'

export function useFollowers() {
  const { user } = useAuth()
  const [followerStats, setFollowerStats] = useState<Map<string, FollowerStats>>(new Map())
  const [loading, setLoading] = useState(false)

  const fetchFollowerStats = useCallback(async (artistUserIds: string[]) => {
    if (artistUserIds.length === 0) return

    setLoading(true)
    try {
      // Get follower counts for all artists
      const { data: followerCounts, error: countError } = await supabase
        .from('followers')
        .select('following_id')
        .in('following_id', artistUserIds)

      if (countError) throw countError

      // Count followers per artist
      const counts = artistUserIds.reduce((acc, userId) => {
        acc[userId] = followerCounts?.filter((f: { following_id: string }) => f.following_id === userId).length || 0
        return acc
      }, {} as Record<string, number>)

      // Get current user's following status if authenticated
      let followingStatus: Record<string, boolean> = {}
      if (user) {
        const { data: userFollowing, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', artistUserIds)

        if (followingError) throw followingError

        followingStatus = artistUserIds.reduce((acc, userId) => {
          acc[userId] = userFollowing?.some((f: { following_id: string }) => f.following_id === userId) || false
          return acc
        }, {} as Record<string, boolean>)
      }

      // Update state
      const newStats = new Map<string, FollowerStats>()
      artistUserIds.forEach(userId => {
        newStats.set(userId, {
          user_id: userId,
          follower_count: counts[userId] || 0,
          is_following: followingStatus[userId] || false
        })
      })

      setFollowerStats(newStats)
    } catch (error) {
      console.error('Error fetching follower stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const followArtist = useCallback(async (artistUserId: string) => {
    if (!user) return { error: 'Authentication required' }

    try {
      const { error } = await supabase
        .from('followers')
        .insert({ 
          follower_id: user.id, 
          following_id: artistUserId 
        })

      if (error) throw error

      // Update local state optimistically
      setFollowerStats(prev => {
        const newStats = new Map(prev)
        const current = newStats.get(artistUserId)
        if (current) {
          newStats.set(artistUserId, {
            ...current,
            follower_count: current.follower_count + 1,
            is_following: true
          })
        }
        return newStats
      })

      return { success: true }
    } catch (error) {
      console.error('Error following artist:', error)
      return { error: 'Failed to follow artist' }
    }
  }, [user])

  const unfollowArtist = useCallback(async (artistUserId: string) => {
    if (!user) return { error: 'Authentication required' }

    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', artistUserId)

      if (error) throw error

      // Update local state optimistically
      setFollowerStats(prev => {
        const newStats = new Map(prev)
        const current = newStats.get(artistUserId)
        if (current) {
          newStats.set(artistUserId, {
            ...current,
            follower_count: Math.max(0, current.follower_count - 1),
            is_following: false
          })
        }
        return newStats
      })

      return { success: true }
    } catch (error) {
      console.error('Error unfollowing artist:', error)
      return { error: 'Failed to unfollow artist' }
    }
  }, [user])

  const toggleFollow = useCallback(async (artistUserId: string) => {
    const stats = followerStats.get(artistUserId)
    if (stats?.is_following) {
      return await unfollowArtist(artistUserId)
    } else {
      return await followArtist(artistUserId)
    }
  }, [followerStats, followArtist, unfollowArtist])

  const getFollowerStats = useCallback((artistUserId: string): FollowerStats => {
    return followerStats.get(artistUserId) || {
      user_id: artistUserId,
      follower_count: 0,
      is_following: false
    }
  }, [followerStats])

  return {
    followerStats,
    loading,
    fetchFollowerStats,
    followArtist,
    unfollowArtist,
    toggleFollow,
    getFollowerStats
  }
}