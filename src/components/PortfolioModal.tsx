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
  onEdit?: (itemId: string) => void
  onDelete?: (itemId: string) => void
}

export function PortfolioModal({ item, isOpen, onClose, onArtistClick, onAuthRequired, onContactArtist, onEdit, onDelete }: PortfolioModalProps) {
  const { profile } = useAuth()
  const { toggleSave, isTattooSaved } = useSavedTattoos()
  const { isLiked, likeCount, toggleLike, loading, tableExists } = usePortfolioLikes(item.id)
  
  // Check if current user owns this post
  const isOwnPost = profile?.user_id === item.user_id
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

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item.id)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id)
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
          {/* Action Buttons */}
          <div className="modal-portfolio-actions">
            {/* Always show like and save buttons */}
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
            
            {/* Show edit/delete buttons for own posts */}
            {isOwnPost && (
              <>
                <ActionButton
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m18,2l4,4l-14,14h-4v-4L18,2z"></path>
                    <path d="m13,7l4,4"></path>
                  </svg>}
                  text="Modifica"
                  variant="modal"
                  requiresAuth={true}
                  onAuthRequired={onAuthRequired}
                  onClick={handleEdit}
                />
                <ActionButton
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>}
                  text="Elimina"
                  variant="modal"
                  requiresAuth={true}
                  onAuthRequired={onAuthRequired}
                  onClick={handleDelete}
                />
              </>
            )}
            
            {/* Show contact button only for other users' posts */}
            {!isOwnPost && (
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

          {/* Artist Info */}
          <div className="modal-artist-info">
            <Avatar
              src={item.artist_avatar_url}
              name={displayName}
              alt={`Avatar di ${displayName}`}
              size="md"
              variant="default"
              onClick={handleArtistNameClick}
            />
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
          
          {/* Spacer element for bottom spacing */}
          <div className="modal-bottom-spacer"></div>
        </div>
      </div>
    </div>
  )
}