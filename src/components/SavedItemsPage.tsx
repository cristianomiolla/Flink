import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import './SavedItemsPage.css'
import './PortfolioGrid.css'
import { SearchBar } from './SearchBar'
import { PageHeader } from './PageHeader'
import LoadingSpinner from './LoadingSpinner'
import { PortfolioCard } from './PortfolioCard'
import { useSavedTattoos } from '../hooks/useSavedTattoos'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { PortfolioItem } from '../types/portfolio'

// Lazy load AuthOverlay component
const AuthOverlay = lazy(() => import('./AuthOverlay').then(module => ({ default: module.AuthOverlay })))

interface SavedItemsPageProps {
  onLogoClick?: () => void
  onArtistClick?: (artistId: string) => void
}

export function SavedItemsPage({ onLogoClick, onArtistClick }: SavedItemsPageProps) {
  const { user } = useAuth()
  const { savedTattoos, loading: savedLoading, refreshSavedTattoos } = useSavedTattoos()
  const [savedItems, setSavedItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)

  const handleAuthRequired = useCallback(() => {
    setShowAuthOverlay(true)
  }, [])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Load full portfolio items for saved tattoos
  useEffect(() => {
    const loadSavedItems = async () => {
      // If user is not authenticated, set loading to false immediately
      if (!user) {
        setSavedItems([])
        setLoading(false)
        return
      }
      
      if (savedLoading || savedTattoos.size === 0) {
        setSavedItems([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const savedIds = Array.from(savedTattoos)
        
        // First get the saved tattoos with their save dates
        const { data: savedData, error: savedError } = await supabase
          .from('saved_tattoos')
          .select('portfolio_item_id, created_at')
          .in('portfolio_item_id', savedIds)
          .order('created_at', { ascending: false })

        if (savedError) {
          setError('Errore nel caricamento degli elementi salvati')
          console.error('Error loading saved items:', savedError.message)
          return
        }

        // Then get the portfolio items with artist info
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio_items')
          .select(`
            *,
            profiles!inner(
              user_id,
              full_name,
              username,
              profile_type,
              bio,
              location
            )
          `)
          .in('id', savedIds)

        if (portfolioError) {
          setError('Errore nel caricamento degli elementi salvati')
          console.error('Error loading portfolio items:', portfolioError.message)
          return
        }

        // Create a map of portfolio items
        const portfolioMap = new Map(portfolioData.map(item => [item.id, item]))

        // Transform and sort by save date
        const transformedData: PortfolioItem[] = savedData
          .map(savedItem => {
            const portfolioItem = portfolioMap.get(savedItem.portfolio_item_id)
            if (!portfolioItem) return null
            
            return {
              ...portfolioItem,
              artist_name: portfolioItem.profiles.full_name || portfolioItem.profiles.username || 'Unknown',
              full_name: portfolioItem.profiles.full_name,
              username: portfolioItem.profiles.username,
              profile_type: portfolioItem.profiles.profile_type,
              bio: portfolioItem.profiles.bio,
              artist_location: portfolioItem.profiles.location
            }
          })
          .filter(item => item !== null) as PortfolioItem[]

        setSavedItems(transformedData)
        setError(null)
      } catch (err) {
        setError('Errore nel caricamento degli elementi salvati')
        console.error('Error loading saved items:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSavedItems()
  }, [savedTattoos, savedLoading, user])


  if (loading || savedLoading) {
    return (
      <div className="page-container">
        <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
        <div className="page-loading">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
      
      <div className="container">
        {/* Empty state - outside page-content */}
        {!error && savedItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">💾</div>
              <h2 className="empty-title">
                {!user ? 'Accedi per visualizzare i tatuaggi salvati' : 'Nessun tatuaggio salvato'}
              </h2>
              <p className="empty-description">
                {!user 
                  ? 'Effettua il login per vedere i tatuaggi che hai salvato e gestire la tua collezione personale.'
                  : 'Inizia a esplorare i portfolio degli artisti e salva i tatuaggi che ti piacciono.'
                }
              </p>
              <button 
                className="action-btn" 
                onClick={!user ? handleAuthRequired : onLogoClick}
                style={{ marginTop: '1.5rem' }}
              >
                {!user ? 'Accedi' : 'Esplora Portfolio'}
              </button>
            </div>
          </div>
        )}

        {/* Content area only when there are items or errors */}
        {(savedItems.length > 0 || error) && (
          <div className="page-content">
          {/* Header - solo se ci sono elementi salvati */}
          {savedItems.length > 0 && (
            <PageHeader 
              title="ELEMENTI SALVATI"
              subtitle={savedItems.length === 1 ? (
                '1 elemento salvato'
              ) : (
                `${savedItems.length} elementi salvati`
              )}
            />
          )}

          {error && (
            <div className="error-state">
              <div className="error-content">
                <p className="error-message">{error}</p>
                <button 
                  className="btn btn-accent retry-btn" 
                  onClick={() => refreshSavedTattoos()}
                  style={{ marginTop: '1.5rem' }}
                >
                  Riprova
                </button>
              </div>
            </div>
          )}


          {/* Grid */}
          {!error && savedItems.length > 0 && (
            <div className="portfolio-grid">
              {savedItems.map(item => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  onArtistClick={onArtistClick}
                />
              ))}
            </div>
          )}
          </div>
        )}
      </div>
      
      {/* Auth Overlay */}
      {showAuthOverlay && (
        <Suspense fallback={<div />}>
          <AuthOverlay
            isOpen={showAuthOverlay}
            onClose={() => setShowAuthOverlay(false)}
          />
        </Suspense>
      )}
    </div>
  )
}