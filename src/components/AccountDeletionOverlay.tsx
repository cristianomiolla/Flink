import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import './FormOverlay.css'

interface AccountDeletionOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountDeletionOverlay({ isOpen, onClose }: AccountDeletionOverlayProps) {
  const { user, signOut } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || isDeleting) return

    setIsDeleting(true)

    try {
      // Delete all user-related data from the database
      // Delete portfolio items first (due to foreign key constraints)
      const { error: portfolioError } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('user_id', user.id)
      if (portfolioError) throw new Error(`Portfolio deletion failed: ${portfolioError.message}`)

      // Delete saved tattoos
      const { error: savedError } = await supabase
        .from('saved_tattoos')
        .delete()
        .eq('user_id', user.id)
      if (savedError) throw new Error(`Saved tattoos deletion failed: ${savedError.message}`)

      // Delete follower relationships (where user is follower or following)
      // follower_id references auth.users(id), following_id references profiles(user_id)
      const { error: followersError } = await supabase
        .from('followers')
        .delete()
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
      if (followersError) throw new Error(`Followers deletion failed: ${followersError.message}`)

      // Delete messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      if (messagesError) throw new Error(`Messages deletion failed: ${messagesError.message}`)

      // Delete artist services
      const { error: servicesError } = await supabase
        .from('artist_services')
        .delete()
        .eq('user_id', user.id)
      if (servicesError) throw new Error(`Services deletion failed: ${servicesError.message}`)

      // Delete bookings (where user is client or artist)
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .or(`client_id.eq.${user.id},artist_id.eq.${user.id}`)
      if (bookingsError) throw new Error(`Bookings deletion failed: ${bookingsError.message}`)

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id)
      if (profileError) throw new Error(`Profile deletion failed: ${profileError.message}`)

      // Sign out the user (auth account will be handled by backend or manual deletion)
      await signOut()

    } catch (error) {
      console.error('Error deleting account:', error)
      alert(`Errore durante l'eliminazione dell'account: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content confirmation-modal">
        <button className="modal-close-btn" onClick={onClose}>×</button>

        <div className="auth-content">
          <div className="header-card">
            <h2>Elimina Account</h2>
            <p>Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione non può essere annullata.</p>
          </div>

          <form className="auth-form" onSubmit={handleAccountDeletion}>
            <div className="bio-suggestions">
              <p className="suggestions-title">⚠️ Attenzione:</p>
              <ul className="suggestions-list">
                <li className="suggestion-item">Tutti i tuoi dati personali</li>
                <li className="suggestion-item">Portfolio e immagini caricate</li>
                <li className="suggestion-item">Messaggi e conversazioni</li>
                <li className="suggestion-item">Prenotazioni e appuntamenti</li>
                <li className="suggestion-item">Liste di tatuaggi salvati</li>
              </ul>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="action-btn"
                onClick={onClose}
                disabled={isDeleting}
              >
                <span className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </span>
                <span className="action-text">Annulla</span>
              </button>

              <button
                type="submit"
                className="action-btn"
                disabled={isDeleting}
              >
                <span className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </span>
                <span className="action-text">
                  {isDeleting ? 'Eliminando...' : 'Elimina'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}