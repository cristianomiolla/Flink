import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFollowedArtists() {
  const { user } = useAuth()
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFollowedArtists = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data, error: followersError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)

      if (followersError) {
        throw followersError
      }

      const artistIds = data?.map(follow => follow.following_id) || []
      setFollowedArtistIds(artistIds)
    } catch {
      setFollowedArtistIds([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchFollowedArtists()
    } else {
      setFollowedArtistIds([])
      setLoading(false)
    }
  }, [user, fetchFollowedArtists])

  return {
    followedArtistIds,
    loading
  }
}