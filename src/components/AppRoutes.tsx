import { Routes, Route } from 'react-router-dom'
import { MainPage } from './MainPage'
import { ArtistProfile } from './ArtistProfile'
import { PersonalProfile } from './PersonalProfile'
import { SavedItemsPage } from './SavedItemsPage'
import { FeaturedWorksPage } from './FeaturedWorksPage'
import { FeaturedArtistsPage } from './FeaturedArtistsPage'
import { RecentArtistsPage } from './RecentArtistsPage'
import { RecentWorksPage } from './RecentWorksPage'
import { FollowedArtistsWorksPage } from './FollowedArtistsWorksPage'
import { MessagesPage } from './MessagesPage'
import { BecomeArtistPage } from './BecomeArtistPage'
import { MobileProfilePage } from './MobileProfilePage'
import { SettingsPage } from './SettingsPage'
import { ResetPasswordPage } from './ResetPasswordPage'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AppRoutes() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleArtistClick = (artistId: string) => {
    // Se l'artista cliccato è l'utente corrente, vai al profilo personale
    if (profile && profile.user_id === artistId) {
      navigate('/profile')
    } else {
      navigate(`/artist/${artistId}`)
    }
  }

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/artist/:artistId" element={<ArtistProfile />} />
      <Route path="/profile" element={<PersonalProfile />} />
      <Route path="/profile-menu" element={<MobileProfilePage />} />
      <Route path="/saved" element={<SavedItemsPage onLogoClick={handleLogoClick} onArtistClick={handleArtistClick} />} />
      <Route path="/featured" element={<FeaturedWorksPage onLogoClick={handleLogoClick} />} />
      <Route path="/featured-artists" element={<FeaturedArtistsPage onLogoClick={handleLogoClick} />} />
      <Route path="/recent-artists" element={<RecentArtistsPage onLogoClick={handleLogoClick} />} />
      <Route path="/recent" element={<RecentWorksPage onLogoClick={handleLogoClick} />} />
      <Route path="/following" element={<FollowedArtistsWorksPage onLogoClick={handleLogoClick} />} />
      
      {/* Messages Routes */}
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:artistId" element={<MessagesPage />} />
      
      <Route path="/settings" element={<SettingsPage onLogoClick={handleLogoClick} />} />
      <Route path="/become-artist" element={<BecomeArtistPage onLogoClick={handleLogoClick} />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  )
}