import { useState } from 'react'
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
}

export function PortfolioCard({ item, onArtistClick, onAuthRequired, onContactArtist }: PortfolioCardProps) {
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

  return (
    <>
      <article className="card portfolio-card" onClick={handleCardClick}>
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

      {/* Content Section */}
      <div className="content-section">
        {/* Artist Info */}
        <div className="artist-info">
          <div onClick={handleArtistNameClick} style={{ cursor: 'pointer' }}>
            <Avatar
              src={null}
              name={displayName}
              alt={`Avatar di ${displayName}`}
              size="sm"
              variant="default"
            />
          </div>
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

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="portfolio-tags">
            {item.tags.map((tag, index) => (
              <span key={index} className="portfolio-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

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

        {/* Action Buttons */}
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