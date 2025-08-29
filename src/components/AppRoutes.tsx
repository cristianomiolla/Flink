import { Routes, Route } from 'react-router-dom'
import { MainPage } from './MainPage'
import { ArtistProfile } from './ArtistProfile'
import { SavedItemsPage } from './SavedItemsPage'
import { MessagesPage } from './MessagesPage'
import { useNavigate } from 'react-router-dom'

export function AppRoutes() {
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`)
  }

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/artist/:artistId" element={<ArtistProfile />} />
      <Route path="/saved" element={<SavedItemsPage onLogoClick={handleLogoClick} onArtistClick={handleArtistClick} />} />
      <Route path="/messages" element={<MessagesPage onLogoClick={handleLogoClick} />} />
      <Route path="/messages/:artistId" element={<MessagesPage onLogoClick={handleLogoClick} />} />
    </Routes>
  )
}