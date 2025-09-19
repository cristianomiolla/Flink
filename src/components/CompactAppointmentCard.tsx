import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AppointmentDetailsOverlay } from './AppointmentDetailsOverlay'
import { ReviewFormOverlay } from './ReviewFormOverlay'
import './CompactAppointmentCard.css'

interface BookingRequestData {
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
  appointment_date?: string
  appointment_duration?: number
  deposit_amount?: number
  total_amount?: number
  artist_notes?: string
  status?: string
  client_id?: string
  artist_id?: string
}

interface ReviewData {
  id: string
  rating: number
  comment?: string
  created_at: string
}

interface CompactAppointmentCardProps {
  bookingId: string
  participantName?: string
  refreshTrigger?: number
  onBookingUpdated?: () => void
  showParticipants?: boolean
}

export function CompactAppointmentCard({
  bookingId,
  participantName,
  refreshTrigger,
  onBookingUpdated,
  showParticipants = false
}: CompactAppointmentCardProps) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [fullBookingData, setFullBookingData] = useState<BookingRequestData | null>(null)
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!user || !bookingId) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle()

        if (data) {
          setFullBookingData({
            subject: data.subject,
            tattoo_style: data.tattoo_style,
            body_area: data.body_area,
            size_category: data.size_category,
            color_preferences: data.color_preferences,
            meaning: data.meaning,
            budget_min: data.budget_min,
            budget_max: data.budget_max,
            reference_images: data.reference_images,
            created_at: data.created_at,
            appointment_date: data.appointment_date,
            appointment_duration: data.appointment_duration,
            deposit_amount: data.deposit_amount,
            total_amount: data.total_amount,
            artist_notes: data.artist_notes,
            status: data.status,
            client_id: data.client_id,
            artist_id: data.artist_id
          })

          // Se il booking è completato, cerca la recensione
          if (data.status === 'completed') {
            const { data: review } = await supabase
              .from('reviews')
              .select('id, rating, comment, created_at')
              .eq('booking_id', bookingId)
              .maybeSingle()

            setReviewData(review)
          } else {
            setReviewData(null)
          }
        } else {
          setFullBookingData(null)
          setReviewData(null)
        }
      } catch {
        setFullBookingData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [bookingId, user, refreshTrigger])

  const formatAppointmentDate = () => {
    if (!fullBookingData?.appointment_date) return ''
    const date = new Date(fullBookingData.appointment_date)
    return {
      date: date.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }),
      time: date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatDuration = () => {
    if (!fullBookingData?.appointment_duration) return ''
    const hours = Math.floor(fullBookingData.appointment_duration / 60)
    const minutes = fullBookingData.appointment_duration % 60
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${minutes}min`
    }
  }

  const handleCardClick = () => {
    setShowDetailsOverlay(true)
  }

  const handleAddReview = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setShowReviewForm(true)
  }

  const handleReviewSubmitted = () => {
    // Refresh the booking data to get the new review
    if (onBookingUpdated) {
      onBookingUpdated()
    }
    // Force a refetch by updating the refresh trigger
    setFullBookingData(null)
    setReviewData(null)
    setLoading(true)
  }

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const isArtistAppointment = !!(fullBookingData?.appointment_date || fullBookingData?.deposit_amount || fullBookingData?.total_amount)

  if (loading) {
    return (
      <div className="compact-appointment-card loading">
        <div className="loading-content">
          <div className="loading-line"></div>
          <div className="loading-line short"></div>
        </div>
      </div>
    )
  }

  const appointmentDateTime = formatAppointmentDate()

  return (
    <>
      <div className="compact-appointment-card clickable" onClick={handleCardClick}>
        {/* Desktop Layout */}
        <div className="desktop-layout">
          <div className="appointment-main">
            {/* Date and Time - Most prominent */}
            {isArtistAppointment && appointmentDateTime && (
              <div className="appointment-datetime">
                <div className="appointment-date">{appointmentDateTime.date}</div>
                <div className="appointment-time">{appointmentDateTime.time}</div>
                {fullBookingData?.appointment_duration && (
                  <div className="appointment-duration">⏱ {formatDuration()}</div>
                )}
              </div>
            )}

            {/* Subject and participant */}
            <div className="appointment-info">
              {participantName && (
                <div className="participant-name">
                  {profile?.profile_type === 'artist' ? participantName : `con ${participantName}`}
                </div>
              )}
              {fullBookingData && (
                <div className="appointment-subject">{fullBookingData.subject}</div>
              )}
            </div>
          </div>

          {/* Secondary details - smaller, less prominent */}
          <div className="appointment-details">
            <div className="appointment-details-row">
              {isArtistAppointment ? (
                <div className="appointment-meta">
                  {(fullBookingData?.total_amount || fullBookingData?.deposit_amount) && (
                    <div className="pricing-summary">
                      {fullBookingData?.deposit_amount && (
                        <div className="pricing-row">
                          <span className="pricing-label">Acconto</span>
                          <span className="pricing-value">€{fullBookingData.deposit_amount}</span>
                        </div>
                      )}
                      {fullBookingData?.total_amount && (
                        <div className="pricing-row total">
                          <span className="pricing-label total">Totale</span>
                          <span className="pricing-value total">€{fullBookingData.total_amount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="appointment-meta">
                  {fullBookingData?.body_area && (
                    <span className="detail-item">📍 {fullBookingData.body_area}</span>
                  )}
                  {fullBookingData?.size_category && (
                    <span className="detail-item">📏 {fullBookingData.size_category}</span>
                  )}
                </div>
              )}

              {/* Review Section - shown only for completed appointments */}
              {fullBookingData?.status === 'completed' && (
                <div className="appointment-review">
                  {reviewData ? (
                    <div className="review-content">
                      <div className="review-rating">
                        <span className="stars">{renderStars(reviewData.rating)}</span>
                        <span className="rating-number">({reviewData.rating}/5)</span>
                      </div>
                      {reviewData.comment && (
                        <div className="review-comment">"{reviewData.comment}"</div>
                      )}
                    </div>
                  ) : (
                    <div className="review-missing">
                      {profile?.profile_type === 'client' ? (
                        <button
                          className="review-cta-button"
                          onClick={handleAddReview}
                          title="Lascia una recensione"
                        >
                          ⭐ Recensisci
                        </button>
                      ) : (
                        <span className="review-text">Nessuna recensione</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="mobile-layout">
          {/* Header con participant e data/ora */}
          <div className="mobile-appointment-header">
            {participantName && (
              <div className="mobile-participant">
                {profile?.profile_type === 'artist' ? participantName : `con ${participantName}`}
              </div>
            )}

            {isArtistAppointment && appointmentDateTime && (
              <div className="mobile-datetime">
                <div className="mobile-date">{appointmentDateTime.date}</div>
                <div className="mobile-time">{appointmentDateTime.time}</div>
                {fullBookingData?.appointment_duration && (
                  <div className="mobile-duration">⏱ {formatDuration()}</div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          {fullBookingData && (
            <div className="mobile-subject">{fullBookingData.subject}</div>
          )}

          {/* Bottom section con prezzi e recensioni */}
          <div className="mobile-bottom-section">
            <div className="mobile-details">
              {isArtistAppointment ? (
                <>
                  {(fullBookingData?.total_amount || fullBookingData?.deposit_amount) && (
                    <div className="mobile-pricing-summary">
                      {fullBookingData?.deposit_amount && (
                        <div className="mobile-pricing-row">
                          <span className="mobile-pricing-label">Acconto</span>
                          <span className="mobile-pricing-value">€{fullBookingData.deposit_amount}</span>
                        </div>
                      )}
                      {fullBookingData?.total_amount && (
                        <div className="mobile-pricing-row total">
                          <span className="mobile-pricing-label total">Totale</span>
                          <span className="mobile-pricing-value total">€{fullBookingData.total_amount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {fullBookingData?.body_area && (
                    <span className="mobile-detail">📍 {fullBookingData.body_area}</span>
                  )}
                  {fullBookingData?.size_category && (
                    <span className="mobile-detail">📏 {fullBookingData.size_category}</span>
                  )}
                </>
              )}
            </div>

            {/* Review section */}
            {fullBookingData?.status === 'completed' && (
              <div className="mobile-review">
                {reviewData ? (
                  <div className="mobile-review-content">
                    <div className="mobile-review-rating">
                      <span className="mobile-stars">{renderStars(reviewData.rating)}</span>
                      <span className="mobile-rating">({reviewData.rating}/5)</span>
                    </div>
                    {reviewData.comment && (
                      <div className="mobile-review-comment">"{reviewData.comment}"</div>
                    )}
                  </div>
                ) : (
                  <div className="mobile-no-review">
                    {profile?.profile_type === 'client' ? (
                      <button
                        className="mobile-review-cta-button"
                        onClick={handleAddReview}
                        title="Lascia una recensione"
                      >
                        ⭐ Recensisci
                      </button>
                    ) : (
                      <span className="mobile-review-text">Nessuna recensione</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewFormOverlay
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        bookingId={bookingId}
        artistName={profile?.profile_type === 'client' ? participantName : undefined}
        artistId={fullBookingData?.artist_id}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <AppointmentDetailsOverlay
        isOpen={showDetailsOverlay}
        onClose={() => setShowDetailsOverlay(false)}
        userType={profile?.profile_type === 'artist' ? 'artist' : 'client'}
        artistName={profile?.profile_type === 'client' ? participantName : undefined}
        clientName={profile?.profile_type === 'artist' ? participantName : undefined}
        bookingId={bookingId}
        showParticipants={showParticipants}
        onBookingUpdated={() => {
          if (onBookingUpdated) {
            onBookingUpdated()
          }
        }}
      />
    </>
  )
}