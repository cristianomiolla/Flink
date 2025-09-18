import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

type BookingStatus = 'pending' | 'expired' | 'scheduled' | 'rescheduled' | 'cancelled' | 'completed'

interface BookingData {
  id: string
  client_id: string
  artist_id: string
  status: BookingStatus
  subject: string
  created_at: string
  updated_at: string
  expires_at: string | null
  appointment_date: string | null
}

interface UseBookingStatusReturn {
  bookingData: BookingData | null
  loading: boolean
  error: string | null
  refreshBookingStatus: () => Promise<void>
  hasActiveBooking: boolean
  showProgressTracker: boolean
  showPinnedAction: boolean
}

export function useBookingStatus(participantId: string | null): UseBookingStatusReturn {
  const { user, profile } = useAuth()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookingStatus = useCallback(async () => {
    if (!user || !participantId || !profile) {
      setBookingData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Query per ottenere l'ultima prenotazione tra i due utenti
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select('*')
        .or(`and(client_id.eq.${user.id},artist_id.eq.${participantId}),and(client_id.eq.${participantId},artist_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (queryError) {
        throw queryError
      }

      setBookingData(data || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dello stato booking')
      setBookingData(null)
    } finally {
      setLoading(false)
    }
  }, [user, participantId, profile])

  useEffect(() => {
    if (participantId) {
      fetchBookingStatus()
    } else {
      setBookingData(null)
    }
  }, [fetchBookingStatus, participantId])

  const refreshBookingStatus = useCallback(async () => {
    await fetchBookingStatus()
  }, [fetchBookingStatus])

  // Appointment completion and expiration are now handled server-side by Edge Functions

  // Determina se c'è una prenotazione attiva
  const hasActiveBooking = Boolean(
    bookingData &&
    !['expired', 'cancelled'].includes(bookingData.status)
  )

  // Determina se mostrare il progress tracker
  // Nascondi il tracker se:
  // 1. La richiesta è expired
  // 2. È completata da più di 1 giorno dalla data dell'appuntamento
  // 3. È cancellata da più di 1 giorno (basandosi su updated_at)
  const showProgressTracker = Boolean(
    bookingData &&
    !['expired'].includes(bookingData.status) &&
    !(bookingData.status === 'completed' && bookingData.appointment_date &&
      new Date(bookingData.appointment_date).getTime() < Date.now() - (1 * 24 * 60 * 60 * 1000)) &&
    !(bookingData.status === 'cancelled' &&
      new Date(bookingData.updated_at).getTime() < Date.now() - (1 * 24 * 60 * 60 * 1000))
  )

  // Determina se mostrare il pinned action button
  // NON mostrare se:
  // - C'è un progress tracker visibile per un appuntamento cancellato o completato
  // Mostra se:
  // 1. Non c'è booking attivo, O
  // 2. Non c'è progress tracker da mostrare, O
  // 3. È un artista con booking pending (deve sempre vedere "Fissa appuntamento")
  const showPinnedAction = !(showProgressTracker && (bookingData?.status === 'cancelled' || bookingData?.status === 'completed')) &&
    (!hasActiveBooking || !showProgressTracker ||
    (profile?.profile_type === 'artist' && bookingData?.status === 'pending'))

  return {
    bookingData,
    loading,
    error,
    refreshBookingStatus,
    hasActiveBooking,
    showProgressTracker,
    showPinnedAction
  }
}