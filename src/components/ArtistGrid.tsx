import './ArtistGrid.css'
import { ArtistCard } from './ArtistCard'
import LoadingSpinner from './LoadingSpinner'
import type { ArtistProfile } from '../types/portfolio'

interface ArtistGridProps {
  profiles: ArtistProfile[]
  loading: boolean
  error: string | null
  searchTerm: string
  locationFilter: string
  totalCount: number
  filteredCount: number
  onArtistClick?: (artistId: string) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
}

export function ArtistGrid({ 
  profiles, 
  loading, 
  error, 
  searchTerm, 
  locationFilter,
  totalCount,
  filteredCount,
  onArtistClick,
  onAuthRequired,
  onContactArtist
}: ArtistGridProps) {
  if (loading) {
    return (
      <section className="grid-container">
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="grid-container">
        <div className="container">
          <div className="error-state">
            <div className="error-card">
              <h2 className="error-title">Errore di caricamento</h2>
              <p className="error-message">{error}</p>
              <button className="btn btn-accent retry-btn" onClick={() => window.location.reload()}>
                Riprova
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const hasSearchTerms = searchTerm.trim() || locationFilter.trim()

  return (
    <section className="grid-container">
      <div className="container">
        <div className="grid-header">
          <div className="header-card">
            <h2 className="grid-title">Artisti</h2>
            <div className="grid-stats">
              <span className="stat-count">{hasSearchTerms ? filteredCount : totalCount}</span>
              <span className="stat-label">{hasSearchTerms ? 'risultati' : 'artisti totali'}</span>
            </div>
            {hasSearchTerms && (
              <div className="search-info">
                {searchTerm && <span className="search-term">"{searchTerm}"</span>}
                {locationFilter && <span className="location-term">{locationFilter}</span>}
              </div>
            )}
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-card">
              <h3 className="empty-title">Nessun artista</h3>
              <p className="empty-message">
                {hasSearchTerms 
                  ? 'Nessun artista trovato per i criteri selezionati' 
                  : 'Non ci sono ancora artisti registrati'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="artist-grid">
            {profiles.map((profile) => (
              <ArtistCard 
                key={profile.id} 
                profile={profile}
                onArtistClick={onArtistClick}
                onAuthRequired={onAuthRequired}
                onContactArtist={onContactArtist}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}