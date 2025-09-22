import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ReviewWithClient, ReviewStats } from '../types/portfolio'

export function useReviews(artistId: string) {
  const [reviews, setReviews] = useState<ReviewWithClient[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!artistId) return

    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch reviews first
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            booking_id,
            client_id,
            artist_id,
            rating,
            comment,
            created_at
          `)
          .eq('artist_id', artistId)
          .order('created_at', { ascending: false })

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError)

          // Check if table doesn't exist - gracefully handle this case
          if (reviewsError.message?.includes('relation "public.reviews" does not exist')) {
            console.warn('Reviews table does not exist yet. Using empty state.')
            setReviews([])
            setStats({
              average_rating: 0,
              total_reviews: 0,
              rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            })
            setLoading(false)
            return
          }

          setError('Errore nel caricamento delle recensioni')
          return
        }

        // Get client profiles for all reviews
        let formattedReviews: ReviewWithClient[] = []

        if (reviewsData && reviewsData.length > 0) {
          // Extract unique client IDs
          const clientIds = [...new Set(reviewsData.map(review => review.client_id))]

          // Fetch client profiles
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, avatar_url')
            .in('user_id', clientIds)

          if (profilesError) {
            console.error('Error fetching client profiles:', profilesError)
          }

          // Create a map of user_id to profile for easy lookup
          const profilesMap = new Map()
          if (profilesData) {
            profilesData.forEach(profile => {
              profilesMap.set(profile.user_id, profile)
            })
          }

          // Combine reviews with client profiles
          formattedReviews = reviewsData.map(review => ({
            id: review.id,
            booking_id: review.booking_id,
            client_id: review.client_id,
            artist_id: review.artist_id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            client_profile: profilesMap.get(review.client_id) || null
          }))
        }

        setReviews(formattedReviews)

        // Calculate stats
        if (formattedReviews.length > 0) {
          const totalRating = formattedReviews.reduce((sum, review) => sum + review.rating, 0)
          const averageRating = totalRating / formattedReviews.length

          // Calculate rating distribution
          const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          formattedReviews.forEach(review => {
            distribution[review.rating] = (distribution[review.rating] || 0) + 1
          })

          setStats({
            average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            total_reviews: formattedReviews.length,
            rating_distribution: distribution
          })
        } else {
          setStats({
            average_rating: 0,
            total_reviews: 0,
            rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          })
        }

      } catch (err) {
        console.error('Error in fetchReviews:', err)
        setError('Errore nel caricamento delle recensioni')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [artistId])

  return {
    reviews,
    stats,
    loading,
    error
  }
}