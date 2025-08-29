import './ArtistCard.css'
import { Avatar } from './Avatar'
import { useAuth } from '../hooks/useAuth'
import type { ArtistProfile } from '../types/portfolio'

interface ArtistCardProps {
  profile: ArtistProfile
  onArtistClick?: (artistId: string) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
}

export function ArtistCard({ profile, onArtistClick, onAuthRequired, onContactArtist }: ArtistCardProps) {
  const { user } = useAuth()
  const displayName = profile.full_name || profile.username || 'Unknown Artist'

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open profile if clicking on artist-actions
    const target = e.target as HTMLElement
    if (target.closest('.artist-actions')) {
      return
    }
    
    if (onArtistClick) {
      onArtistClick(profile.user_id)
    }
  }

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user && onAuthRequired) {
      onAuthRequired()
    }
    // TODO: Add actual functionality for follow when authenticated
  }

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user && onAuthRequired) {
      onAuthRequired()
      return
    }
    if (onContactArtist) {
      onContactArtist(profile.user_id)
    }
  }

  return (
    <article className="card artist-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="artist-header">
        <Avatar
          src={profile.avatar_url}
          name={displayName}
          alt={`Avatar di ${displayName}`}
          size="md"
          variant="card"
        />
        
        <div className="artist-info">
          <h3 className="artist-name">{displayName}</h3>
          {profile.location && (
            <span className="artist-location">📍 {profile.location}</span>
          )}
        </div>
      </div>

      <p className="artist-bio">{profile.bio || ''}</p>

      <div className="artist-meta">
        <span className="join-date">
          <span className="join-icon">📅</span>
          Iscritto dal {new Date(profile.created_at).toLocaleDateString('it-IT')}
        </span>
      </div>

      <div className="artist-actions">
        <button className="action-btn" onClick={handleFollowClick}>
          Segui
        </button>
        <button className="action-btn" onClick={handleContactClick}>
          Contatta
        </button>
      </div>
    </article>
  )
}