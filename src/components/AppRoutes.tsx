import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainPage } from './MainPage'
import LoadingSpinner from './LoadingSpinner'

// Lazy load heavy route components
const ArtistProfile = lazy(() => import('./ArtistProfile').then(m => ({ default: m.ArtistProfile })))
const PersonalProfile = lazy(() => import('./PersonalProfile').then(m => ({ default: m.PersonalProfile })))
const MessagesPage = lazy(() => import('./MessagesPage').then(m => ({ default: m.MessagesPage })))
const SavedItemsPage = lazy(() => import('./SavedItemsPage').then(m => ({ default: m.SavedItemsPage })))
const FeaturedWorksPage = lazy(() => import('./FeaturedWorksPage').then(m => ({ default: m.FeaturedWorksPage })))
const FeaturedArtistsPage = lazy(() => import('./FeaturedArtistsPage').then(m => ({ default: m.FeaturedArtistsPage })))
const NearbyArtistsPage = lazy(() => import('./NearbyArtistsPage').then(m => ({ default: m.NearbyArtistsPage })))
const RecentArtistsPage = lazy(() => import('./RecentArtistsPage').then(m => ({ default: m.RecentArtistsPage })))
const RecentWorksPage = lazy(() => import('./RecentWorksPage').then(m => ({ default: m.RecentWorksPage })))
const FollowedArtistsWorksPage = lazy(() => import('./FollowedArtistsWorksPage').then(m => ({ default: m.FollowedArtistsWorksPage })))
const BecomeArtistPage = lazy(() => import('./BecomeArtistPage').then(m => ({ default: m.BecomeArtistPage })))
const MobileProfilePage = lazy(() => import('./MobileProfilePage').then(m => ({ default: m.MobileProfilePage })))
const SettingsPage = lazy(() => import('./SettingsPage').then(m => ({ default: m.SettingsPage })))
const ResetPasswordPage = lazy(() => import('./ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const AppointmentsPage = lazy(() => import('./AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
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
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <LoadingSpinner />
      </div>
    }>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/artist/:artistId" element={<ArtistProfile />} />
        <Route path="/profile" element={<PersonalProfile />} />
        <Route path="/profile-menu" element={<MobileProfilePage />} />
        <Route path="/saved" element={<SavedItemsPage onLogoClick={handleLogoClick} onArtistClick={handleArtistClick} />} />
        <Route path="/featured" element={<FeaturedWorksPage onLogoClick={handleLogoClick} />} />
        <Route path="/featured-artists" element={<FeaturedArtistsPage onLogoClick={handleLogoClick} />} />
        <Route path="/nearby-artists" element={<NearbyArtistsPage onLogoClick={handleLogoClick} />} />
        <Route path="/recent-artists" element={<RecentArtistsPage onLogoClick={handleLogoClick} />} />
        <Route path="/recent" element={<RecentWorksPage onLogoClick={handleLogoClick} />} />
        <Route path="/following" element={<FollowedArtistsWorksPage onLogoClick={handleLogoClick} />} />
        
        {/* Messages Routes */}
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:artistId" element={<MessagesPage />} />
        
        {/* Appointments Route */}
        <Route path="/appointments" element={<AppointmentsPage />} />

        <Route path="/settings" element={<SettingsPage onLogoClick={handleLogoClick} />} />
        <Route path="/become-artist" element={<BecomeArtistPage onLogoClick={handleLogoClick} />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </Suspense>
  )
}