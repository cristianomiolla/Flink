import { useState, useEffect } from 'react'
import { SearchBar } from './SearchBar'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './BecomeArtistPage.css'
import './AuthOverlay.css'

interface BecomeArtistPageProps {
  onLogoClick?: () => void
}

export function BecomeArtistPage({ onLogoClick }: BecomeArtistPageProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const navigate = useNavigate()

  const handleUpgradeToArtist = async () => {
    if (!user || !profile) {
      setError('Devi essere autenticato per diventare un artista')
      return
    }

    if (profile.profile_type === 'artist') {
      setError('Il tuo profilo è già un profilo artista')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_type: 'artist' })
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      // Refresh the profile to get updated data
      await refreshProfile()
      setSuccess(true)

      // Redirect to personal profile after 2 seconds
      setTimeout(() => {
        navigate('/profile')
      }, 2000)

    } catch (err) {
      const errorObj = err as Error
      setError(`Errore durante l'aggiornamento: ${errorObj.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Block body scroll when confirmation overlay is open
  useEffect(() => {
    if (showConfirmation) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Clean up on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showConfirmation])

  return (
    <div className="become-artist-page">
      <SearchBar onLogoClick={onLogoClick} hideOnMobile={true} />
      
      <div className="become-artist-container">
        <div className="hero-section">
          <h1 className="hero-title">DIVENTA UN ARTISTA</h1>
          <p className="hero-subtitle">Trasforma la tua passione in una carriera professionale</p>
          
          <div className="hero-cta">
            {success ? (
              <div className="success-message">
                <h2>BENVENUTO TRA GLI ARTISTI!</h2>
                <p>Il tuo profilo è stato aggiornato con successo. Verrai reindirizzato alla home page...</p>
              </div>
            ) : (
              <>
                {error && <div className="error-message">{error}</div>}
                
                <button 
                  className={`hero-cta-button ${loading ? 'loading' : ''}`}
                  onClick={() => setShowConfirmation(true)}
                  disabled={loading || !user}
                >
                  {loading ? 'AGGIORNAMENTO IN CORSO...' : 'DIVENTA ARTISTA ORA'}
                </button>

                {!user && (
                  <p className="auth-notice">
                    Devi essere autenticato per diventare un artista. 
                    <button className="auth-link" onClick={() => navigate('/')}>
                      Torna alla home per accedere
                    </button>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="benefits-section">
          <div className="benefit-card">
            <div className="benefit-icon">📸</div>
            <h3 className="benefit-title">PUBBLICA I TUOI LAVORI</h3>
            <p className="benefit-description">
              Mostra il tuo portfolio e raggiungi migliaia di potenziali clienti. 
              Carica le tue opere, organizza per categorie e attira nuovi clienti.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">📊</div>
            <h3 className="benefit-title">GESTIONALE PERSONALE</h3>
            <p className="benefit-description">
              Accedi a strumenti avanzati per organizzare le tue opere, gestire le vendite 
              e monitorare le performance del tuo business artistico.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">📋</div>
            <h3 className="benefit-title">ADEMPIMENTI LEGALI</h3>
            <p className="benefit-description">
              Strumenti integrati per gestire fatturazione, contratti, consensi 
              e tutti gli aspetti burocratici dell'attività artistica.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">💬</div>
            <h3 className="benefit-title">COMUNICAZIONE DIRETTA</h3>
            <p className="benefit-description">
              Sistema di messaggistica integrato per comunicare direttamente con i clienti, 
              gestire appuntamenti e follow-up post-tatuaggio.
            </p>
          </div>
        </div>
      </div>
      
      {/* Confirmation Overlay */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowConfirmation(false)}>
          <div className="modal-content auth-modal">
            <div className="auth-header-sticky">
              <button className="modal-close-btn" onClick={() => setShowConfirmation(false)}>
                ×
              </button>
            </div>
            <div className="auth-modal-header">
              {/* Empty header section to maintain layout consistency */}
            </div>
            <div className="auth-content">
              <div className="header-card">
                <h2>CONFERMA UPGRADE</h2>
                <p>
                  Sei sicuro di voler diventare un artista? Questa azione cambierà il tuo profilo 
                  da cliente ad artista
                </p>
                <p className="confirmation-note">
                  <strong>Nota:</strong> Potrai sempre tornare indietro dalle impostazioni del profilo
                </p>
              </div>
              
              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setShowConfirmation(false); handleUpgradeToArtist(); }}>
                <div className="form-actions">
                  <button 
                    type="button"
                    className="action-btn"
                    onClick={() => setShowConfirmation(false)}
                  >
                    <span className="action-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </span>
                    <span className="action-text">Annulla</span>
                  </button>
                  <button 
                    type="submit"
                    className={`action-btn ${loading ? 'disabled' : ''}`}
                    disabled={loading}
                >
                  <span className="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </span>
                  <span className="action-text">{loading ? 'AGGIORNAMENTO...' : 'CONFERMA'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}