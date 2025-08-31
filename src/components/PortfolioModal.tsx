import { useEffect } from 'react'
import './PortfolioModal.css'
import { Avatar } from './Avatar'
import { useSavedTattoos } from '../hooks/useSavedTattoos'
import { usePortfolioLikes } from '../hooks/usePortfolioLikes'
import { useAuth } from '../hooks/useAuth'
import { ActionButton, BookmarkIcon, HeartIcon, MessageIcon } from './ActionButton'
import { handleImageError, getSafeImageUrl } from '../lib/imageUtils'
import type { PortfolioItem } from '../types/portfolio'

interface PortfolioModalProps {
  item: PortfolioItem
  isOpen: boolean
  onClose: () => void
  onArtistClick?: (artistId: string) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
}

export function PortfolioModal({ item, isOpen, onClose, onArtistClick, onAuthRequired, onContactArtist }: PortfolioModalProps) {
  const { profile } = useAuth()
  const { toggleSave, isTattooSaved } = useSavedTattoos()
  const { isLiked, likeCount, toggleLike, loading, tableExists } = usePortfolioLikes(item.id)
  // Block scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Clean up on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const badge = item.is_flash ? 'FLASH' : 'REALIZZATO'
  const displayName = item.full_name || item.artist_name || 'Unknown Artist'

  const handleArtistNameClick = () => {
    const artistId = item.user_id || item.id
    if (onArtistClick && artistId) {
      onClose() // Chiude il modal prima di navigare
      onArtistClick(artistId)
    }
  }

  const handleLike = async () => {
    try {
      await toggleLike()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="portfolio-modal-overlay" onClick={handleBackdropClick}>
      <div className="portfolio-modal-content">
        {/* Sticky Header with Close Button */}
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Image Section */}
        <div className="modal-image-section">
          {item.image_url && (
            <img 
              src={getSafeImageUrl(item.image_url)} 
              alt={item.title || 'Portfolio Item'} 
              className="modal-portfolio-image"
              onError={handleImageError}
            />
          )}
          
          {/* Badge and Price Overlays */}
          {badge && (
            <span className={`modal-badge ${badge.toLowerCase()}`}>
              {badge}
            </span>
          )}
          {item.price && (
            <span className="modal-price">
              €{item.price}
            </span>
          )}
        </div>

        {/* Details Section */}
        <div className="modal-details-section">
          {/* Artist Info */}
          <div className="modal-artist-info">
            <div onClick={handleArtistNameClick} style={{ cursor: 'pointer' }}>
              <Avatar
                src={null}
                name={displayName}
                alt={`Avatar di ${displayName}`}
                size="lg"
                variant="default"
              />
            </div>
            <span 
              className="modal-artist-name"
              onClick={handleArtistNameClick}
              style={{ cursor: 'pointer' }}
            >
              {displayName}
            </span>
          </div>

          {/* Title */}
          <h2 className="modal-portfolio-title">
            {item.title || 'Senza titolo'}
          </h2>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="modal-portfolio-tags">
              {item.tags.map((tag, index) => (
                <span key={index} className="modal-portfolio-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="modal-description-section">
              <h3 className="modal-section-title">Descrizione</h3>
              <p className="modal-portfolio-description">
                {item.description}
              </p>
            </div>
          )}

          {/* Meta Info */}
          <div className="modal-meta-info">
            <div className="modal-meta-item">
              <span className="modal-meta-icon">📅</span>
              <span className="modal-meta-label">Creato il:</span>
              <span className="modal-meta-value">
                {new Date(item.created_at).toLocaleDateString('it-IT')}
              </span>
            </div>
            {item.location && (
              <div className="modal-meta-item">
                <span className="modal-meta-icon">📍</span>
                <span className="modal-meta-label">Posizione:</span>
                <span className="modal-meta-value">{item.location}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-portfolio-actions">
            {tableExists && (
              <ActionButton
                icon={<HeartIcon />}
                text={likeCount > 0 ? `Mi piace (${likeCount})` : "Mi piace"}
                variant="modal"
                active={isLiked}
                disabled={loading}
                requiresAuth={true}
                onAuthRequired={onAuthRequired}
                onClick={handleLike}
              />
            )}
            <ActionButton
              icon={<BookmarkIcon />}
              text={isTattooSaved(item.id) ? 'Salvato' : 'Salva'}
              variant="modal"
              active={isTattooSaved(item.id)}
              requiresAuth={true}
              onAuthRequired={onAuthRequired}
              onClick={() => toggleSave(item.id)}
            />
            {/* Non mostrare "Contatta artista" se l'elemento appartiene all'utente corrente */}
            {profile?.user_id !== item.user_id && (
              <ActionButton
                icon={<MessageIcon />}
                text="Contatta artista"
                variant="modal"
                requiresAuth={true}
                onAuthRequired={onAuthRequired}
                onClick={() => onContactArtist && onContactArtist(item.user_id)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}