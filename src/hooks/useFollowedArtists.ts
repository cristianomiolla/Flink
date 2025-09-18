import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFollowedArtists() {
  const { user } = useAuth()
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchFollowedArtists()
    } else {
      setFollowedArtistIds([])
      setLoading(false)
    }
  }, [user])

  const fetchFollowedArtists = async () => {
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
    } catch (err) {
      setFollowedArtistIds([])
    } finally {
      setLoading(false)
    }
  }

  return {
    followedArtistIds,
    loading
  }
}