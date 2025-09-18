import { memo, useEffect } from 'react'
import './ArtistCard.css'
import { Avatar } from './Avatar'
import { ActionButton } from './ActionButton'
import { useAuth } from '../hooks/useAuth'
import { useFollowers } from '../hooks/useFollowers'
import type { DatabaseProfile } from '../types/portfolio'

interface ArtistCardProps {
  profile: DatabaseProfile
  onArtistClick?: (artistId: string) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
  onFollowUpdate?: (artistId: string, isFollowing: boolean) => void
  isHorizontal?: boolean
}

export function ArtistCard({ profile, onArtistClick, onAuthRequired, onContactArtist, onFollowUpdate, isHorizontal = false }: ArtistCardProps) {
  const { user, profile: currentUserProfile } = useAuth()
  const { getFollowerStats, toggleFollow, fetchFollowerStats } = useFollowers()
  const displayName = profile.profile_type === 'client'
    ? (profile.full_name || 'Unknown User')
    : (profile.username || profile.full_name || 'Unknown Artist')
  
  const followerStats = getFollowerStats(profile.user_id)
  const isFollowing = followerStats?.is_following || false
  
  // Check if this is the user's own profile
  const isOwnProfile = !!(currentUserProfile && profile.user_id === currentUserProfile.user_id)

  // Load follower stats when component mounts to ensure we have current data
  useEffect(() => {
    fetchFollowerStats([profile.user_id])
  }, [profile.user_id, fetchFollowerStats])

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

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Don't allow following own profile
    if (isOwnProfile) return
    
    if (!user && onAuthRequired) {
      onAuthRequired()
      return
    }
    
    if (user) {
      const result = await toggleFollow(profile.user_id)
      if (result.success && onFollowUpdate) {
        onFollowUpdate(profile.user_id, !isFollowing)
      }
    }
  }

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Don't allow contacting own profile
    if (isOwnProfile) return
    
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
          <h3 className="artist-card-name">{displayName}</h3>
          {!isHorizontal && profile.location && (
            <span className="artist-location">📍 {profile.location}</span>
          )}
      </div>

      <p className="artist-bio">{profile.bio || ' '}</p>

      <div className="artist-meta">
        {isHorizontal && (
          <span className="join-date">
            <span className="join-icon">📍</span>
            {profile.location || ' '}
          </span>
        )}
        <span className="join-date">
          <span className="join-icon">📅</span>
          Iscritto dal {new Date(profile.created_at).toLocaleDateString('it-IT')}
        </span>
      </div>

      <div className={isHorizontal ? "portfolio-actions" : "artist-actions"}>
        {isHorizontal ? (
          <>
            <ActionButton
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              }
              text={isFollowing ? 'Seguito' : 'Segui'}
              variant="portfolio"
              active={isFollowing}
              disabled={isOwnProfile}
              requiresAuth={true}
              onAuthRequired={onAuthRequired}
              onClick={handleFollowClick}
            />
            <ActionButton
              icon={
                isOwnProfile ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                )
              }
              text="Contatta"
              variant="portfolio"
              disabled={isOwnProfile}
              requiresAuth={true}
              onAuthRequired={onAuthRequired}
              onClick={handleContactClick}
            />
          </>
        ) : (
          <>
            <button className={`action-btn ${isFollowing ? 'active' : ''} ${isOwnProfile ? 'disabled' : ''}`} onClick={handleFollowClick}>
              <span className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </span>
              <span className="action-text">{isFollowing ? 'Seguito' : 'Segui'}</span>
            </button>
            <button className={`action-btn ${isOwnProfile ? 'disabled' : ''}`} onClick={handleContactClick}>
              <span className="action-icon">
                {isOwnProfile ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                )}
              </span>
              <span className="action-text">Contatta</span>
            </button>
          </>
        )}
      </div>
    </article>
  )
}

export default memo(ArtistCard)