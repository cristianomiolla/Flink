import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import './ReviewFormOverlay.css'

interface ReviewFormOverlayProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  artistName?: string
  artistId?: string
  onReviewSubmitted?: () => void
}

export function ReviewFormOverlay({
  isOpen,
  onClose,
  bookingId,
  artistName,
  artistId,
  onReviewSubmitted
}: ReviewFormOverlayProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !rating) return

    setIsSubmitting(true)

    try {
      // Get the authenticated user session to ensure we have the correct ID
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        throw new Error('User not authenticated')
      }

      // If artistId is not provided, fetch it from the booking
      let finalArtistId = artistId
      if (!finalArtistId) {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('artist_id')
          .eq('id', bookingId)
          .single()

        finalArtistId = bookingData?.artist_id
      }

      if (!finalArtistId) {
        throw new Error('Artist ID not found')
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          client_id: authUser.id,
          artist_id: finalArtistId,
          rating,
          comment: comment.trim() || null
        })

      if (error) throw error

      // Success
      onReviewSubmitted?.()
      onClose()
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setRating(0)
    setHoverRating(0)
    setComment('')
    onClose()
  }

  const handleClose = () => {
    // Reset form state when closing
    setRating(0)
    setHoverRating(0)
    setComment('')
    onClose()
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const isFilled = starValue <= (hoverRating || rating)

      return (
        <button
          key={index}
          type="button"
          className={`star-button ${isFilled ? 'filled' : ''}`}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(starValue)}
        >
          ★
        </button>
      )
    })
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content auth-modal">
        <div className="auth-header-sticky">
          <button className="modal-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="auth-modal-header"></div>

        <div className="auth-content">
          <div className="header-card">
            <h2>LASCIA UNA RECENSIONE</h2>
            <p>
              {artistName
                ? `Condividi la tua esperienza con ${artistName}`
                : 'Condividi la tua esperienza'
              }
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                VALUTAZIONE <span className="required-indicator">*</span>
              </label>
              <div className="rating-section">
                <div className="star-rating">
                  {renderStars()}
                </div>
                <div className="rating-text">
                  {rating > 0 && (
                    <span className="rating-value">
                      {rating} {rating === 1 ? 'stella' : 'stelle'}
                    </span>
                  )}
                </div>
              </div>
              <div className="form-help">
                Clicca sulle stelle per assegnare una valutazione
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="review-comment" className="form-label">
                COMMENTO
              </label>
              <textarea
                id="review-comment"
                className="form-textarea"
                placeholder="Descrivi la tua esperienza, la qualità del lavoro, la professionalità..."
                rows={4}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="bio-suggestions">
                <p className="suggestions-title">💡 Cosa includere nella recensione:</p>
                <ul className="suggestions-list">
                  <li className="suggestion-item">Qualità del tatuaggio realizzato</li>
                  <li className="suggestion-item">Professionalità e cortesia dell'artista</li>
                  <li className="suggestion-item">Pulizia e igiene dello studio</li>
                  <li className="suggestion-item">Rispetto dei tempi concordati</li>
                  <li className="suggestion-item">Consigli per la cura post-tatuaggio</li>
                </ul>
              </div>
              <div className="char-count">{comment.length}/1000 caratteri</div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="action-btn"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
                <span className="action-text">Annulla</span>
              </button>

              <button
                type="submit"
                className="action-btn"
                disabled={!rating || isSubmitting}
              >
                <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span className="action-text">
                  {isSubmitting ? 'Invio...' : 'Invia Recensione'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}