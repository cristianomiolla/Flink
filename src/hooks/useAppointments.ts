import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

type BookingStatus = 'pending' | 'expired' | 'scheduled' | 'rescheduled' | 'cancelled' | 'completed'

export interface AppointmentData {
  id: string
  client_id: string
  artist_id: string
  status: BookingStatus
  subject: string
  tattoo_style?: string
  body_area?: string
  size_category?: string
  color_preferences?: string
  meaning?: string
  budget_min?: number
  budget_max?: number
  reference_images?: string[] | null
  created_at: string
  expires_at: string | null
  appointment_date: string | null
  client_profile?: {
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
  artist_profile?: {
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

interface UseAppointmentsReturn {
  appointments: AppointmentData[]
  loading: boolean
  error: string | null
  refreshAppointments: () => Promise<void>
}

export function useAppointments(): UseAppointmentsReturn {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    if (!user || !profile) {
      setAppointments([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First, get bookings without profile data
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter based on user type and exclude pending appointments
      if (profile.profile_type === 'artist') {
        query = query.eq('artist_id', user.id).neq('status', 'pending')
      } else {
        query = query.eq('client_id', user.id).neq('status', 'pending')
      }

      const { data: bookingsData, error: bookingsError } = await query

      if (bookingsError) {
        throw bookingsError
      }

      if (!bookingsData || bookingsData.length === 0) {
        setAppointments([])
        return
      }

      // Get unique user IDs to fetch profiles
      const userIds = new Set<string>()
      bookingsData.forEach(booking => {
        userIds.add(booking.client_id)
        userIds.add(booking.artist_id)
      })

      // Fetch profiles for all users involved
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', Array.from(userIds))

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError)
        // Continue without profile data
        setAppointments(bookingsData)
        return
      }

      // Create a map of user_id to profile
      const profilesMap = new Map()
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile)
      })

      // Combine bookings with profile data
      const enrichedAppointments = bookingsData.map(booking => ({
        ...booking,
        client_profile: profilesMap.get(booking.client_id),
        artist_profile: profilesMap.get(booking.artist_id)
      }))

      setAppointments(enrichedAppointments)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento degli appuntamenti')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  useEffect(() => {
    if (user && profile) {
      fetchAppointments()
    } else {
      setAppointments([])
    }
  }, [fetchAppointments])

  const refreshAppointments = useCallback(async () => {
    await fetchAppointments()
  }, [fetchAppointments])

  return {
    appointments,
    loading,
    error,
    refreshAppointments
  }
}