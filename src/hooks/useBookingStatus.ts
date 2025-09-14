import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

type BookingStatus = 'pending' | 'expired' | 'rejected' | 'scheduled' | 'rescheduled' | 'cancelled' | 'completed'

interface BookingData {
  id: string
  client_id: string
  artist_id: string
  status: BookingStatus
  subject: string
  created_at: string
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
  isPendingExpired: boolean
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
      console.error('Error fetching booking status:', err)
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

  // Determina se una richiesta pending è scaduta (15 giorni) SE non c'è appointment_date
  const EXPIRY_TIME = 15 * 24 * 60 * 60 * 1000 // 15 giorni in millisecondi
  const isPendingExpired = Boolean(
    bookingData && 
    bookingData.status === 'pending' && 
    (Date.now() - new Date(bookingData.created_at).getTime()) > EXPIRY_TIME &&
    !bookingData.appointment_date
  )

  // Determina se c'è una prenotazione attiva
  // Una richiesta pending scaduta non è considerata attiva
  const hasActiveBooking = Boolean(
    bookingData && 
    !['expired', 'rejected', 'cancelled'].includes(bookingData.status) &&
    !isPendingExpired
  )

  // Determina se mostrare il progress tracker
  // Nascondi il tracker se:
  // 1. La richiesta è expired
  // 2. La richiesta pending è scaduta (7 giorni)
  // 3. È completata da più di 3 giorni
  const showProgressTracker = Boolean(
    bookingData && 
    !['expired'].includes(bookingData.status) && 
    !isPendingExpired &&
    !(bookingData.status === 'completed' && 
      new Date(bookingData.created_at).getTime() < Date.now() - (3 * 24 * 60 * 60 * 1000))
  )

  // Determina se mostrare il pinned action button
  // Mostra se:
  // 1. Non c'è booking attivo, O
  // 2. Non c'è progress tracker da mostrare (incluso pending scaduto), O
  // 3. È un artista con booking pending (deve sempre vedere "Fissa appuntamento")
  const showPinnedAction = !hasActiveBooking || !showProgressTracker || 
    (profile?.profile_type === 'artist' && bookingData?.status === 'pending')

  return {
    bookingData,
    loading,
    error,
    refreshBookingStatus,
    hasActiveBooking,
    showProgressTracker,
    showPinnedAction,
    isPendingExpired
  }
}