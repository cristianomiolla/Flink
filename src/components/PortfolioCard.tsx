import { useState, memo } from 'react'
import './PortfolioCard.css'
import { PortfolioModal } from './PortfolioModal'
import { Avatar } from './Avatar'
import { useSavedTattoos } from '../hooks/useSavedTattoos'
import { usePortfolioLikes } from '../hooks/usePortfolioLikes'
import { ActionButton, BookmarkIcon, HeartIcon } from './ActionButton'
import { handleImageError, getSafeImageUrl } from '../lib/imageUtils'
import type { PortfolioItem } from '../types/portfolio'

interface PortfolioCardProps {
  item: PortfolioItem
  onArtistClick?: (artistId: string) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
  showDeleteButton?: boolean
  onDelete?: (itemId: string) => void
}

export function PortfolioCard({ item, onArtistClick, onAuthRequired, onContactArtist, showDeleteButton, onDelete }: PortfolioCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toggleSave, isTattooSaved } = useSavedTattoos()
  const { isLiked, likeCount, toggleLike, loading, tableExists } = usePortfolioLikes(item.id)
  
  // Badge basato sui dati del database
  const badge = item.is_flash ? 'FLASH' : 'REALIZZATO';
  const price = item.price;

  // Use full_name first, then artist_name, then fallback
  const displayName = item.full_name || item.artist_name || 'Unknown Artist';

  const handleArtistNameClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Previene l'apertura del modal
    const artistId = item.user_id || item.id
    if (onArtistClick && artistId) {
      onArtistClick(artistId)
    }
  }

  const handleAvatarClick = () => {
    const artistId = item.user_id || item.id
    if (onArtistClick && artistId) {
      onArtistClick(artistId)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on portfolio-actions
    const target = e.target as HTMLElement
    if (target.closest('.portfolio-actions')) {
      return
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleLike()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Previene l'apertura del modal
    if (onDelete) {
      onDelete(item.id)
    }
  }

  return (
    <>
      <article className="card portfolio-card" onClick={handleCardClick}>
        {/* Delete Button - solo nel profilo personale */}
        {showDeleteButton && (
          <button 
            className="modal-close-btn delete-portfolio-btn" 
            onClick={handleDelete}
            title="Elimina elemento"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}
        {/* Image Section */}
      <div className="image-section">
        {item.image_url ? (
          <img 
            src={getSafeImageUrl(item.image_url)} 
            alt={item.title || 'Portfolio Item'} 
            className="portfolio-image"
            onError={handleImageError}
          />
        ) : (
          <div className="image-placeholder">
            <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span className="placeholder-text">Immagine non disponibile</span>
          </div>
        )}
        
        {/* Overlays */}
        {badge && (
          <span className={`badge ${badge.toLowerCase()}`}>
            {badge}
          </span>
        )}
        {price && (
          <span className="price">
            €{price}
          </span>
        )}
      </div>

      {/* Action Buttons - Moved to be directly under image */}
      <div className="portfolio-actions">
        {tableExists && (
          <ActionButton
            icon={<HeartIcon />}
            text={likeCount > 0 ? `Mi piace (${likeCount})` : "Mi piace"}
            variant="portfolio"
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
          variant="portfolio"
          active={isTattooSaved(item.id)}
          requiresAuth={true}
          onAuthRequired={onAuthRequired}
          onClick={(e) => {
            e.stopPropagation()
            toggleSave(item.id)
          }}
        />
      </div>

      {/* Content Section */}
      <div className="content-section">
        {/* Artist Info */}
        <div className="artist-info">
          <Avatar
            src={item.artist_avatar_url}
            name={displayName}
            alt={`Avatar di ${displayName}`}
            size="sm"
            variant="default"
            onClick={handleAvatarClick}
          />
          <span 
            className="artist-name"
            onClick={handleArtistNameClick}
            style={{ cursor: 'pointer' }}
          >
            {displayName}
          </span>
        </div>

        {/* Title */}
        <h3 className="portfolio-title">
          {item.title || 'Senza titolo'}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="portfolio-description">
            {item.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="meta-info">
          <span className="meta-date">
            <span className="meta-icon">📅</span>
            {new Date(item.created_at).toLocaleDateString('it-IT')}
          </span>
          {item.location && (
            <span className="meta-location">
              <span className="meta-icon">📍</span>
              {item.location}
            </span>
          )}
        </div>

      </div>
    </article>

      {/* Portfolio Modal */}
      <PortfolioModal 
        item={item}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onArtistClick={onArtistClick}
        onAuthRequired={onAuthRequired}
        onContactArtist={onContactArtist}
      />
    </>
  )
}

export default memo(PortfolioCard)