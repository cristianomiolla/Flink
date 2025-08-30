import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'
import { Avatar } from './Avatar'
import { PortfolioCard } from './PortfolioCard'
import { supabase } from '../lib/supabase'
import './PersonalProfile.css'
import type { TabType, PortfolioItem } from '../types/portfolio'

export function PersonalProfile() {
  const navigate = useNavigate()
  const { user, profile, loading, refreshProfile } = useAuth()
  const [showEditOverlay, setShowEditOverlay] = useState(false)
  const [showUploadOverlay, setShowUploadOverlay] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('portfolio')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    location: profile?.location || ''
  })
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    image_url: '',
    tags: '',
    is_flash: false,
    price: ''
  })

  const handleSearch = (searchTerm: string, location: string) => {
    navigate(`/?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`)
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  const fetchPortfolioItems = async () => {
    if (!profile?.user_id) return
    
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching portfolio items:', error)
        return
      }

      const portfolioData: PortfolioItem[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        image_url: item.image_url,
        tags: item.tags || [],
        is_flash: item.is_flash || false,
        price: item.price,
        location: item.location,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id,
        artist_name: profile.full_name || profile.username || 'Tu',
        full_name: profile.full_name || profile.username || 'Tu'
      }))

      setPortfolioItems(portfolioData)
    } catch (error) {
      console.error('Error fetching portfolio items:', error)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const handleUploadPortfolio = async () => {
    if (!user || !profile) return
    
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: profile.user_id,
          title: uploadData.title.trim(),
          description: uploadData.description.trim() || null,
          image_url: uploadData.image_url.trim() || null,
          tags: uploadData.tags ? uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          is_flash: uploadData.is_flash,
          price: uploadData.price ? parseFloat(uploadData.price) : null,
          location: profile.location || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error uploading portfolio item:', error)
        alert('Errore durante il caricamento del lavoro')
        return
      }

      // Reset form and refresh data
      resetUploadForm()
      
      await fetchPortfolioItems()
      setShowUploadOverlay(false)
    } catch (error) {
      console.error('Error uploading portfolio item:', error)
      alert('Errore durante il caricamento del lavoro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteProfile = async () => {
    if (!user || !profile) return
    
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio.trim(),
          location: formData.location.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Errore durante l\'aggiornamento del profilo')
        return
      }

      // Refresh profile data
      if (refreshProfile) {
        await refreshProfile()
      }
      
      setShowEditOverlay(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Errore durante l\'aggiornamento del profilo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetUploadForm = () => {
    setUploadData({
      title: '',
      description: '',
      image_url: '',
      tags: '',
      is_flash: false,
      price: ''
    })
  }

  const bioSuggestions = [
    "Racconta la tua storia come tatuatore",
    "Descrivi il tuo stile artistico preferito", 
    "Menziona gli anni di esperienza",
    "Parla delle tue specializzazioni",
    "Condividi la tua filosofia sull'arte del tatuaggio"
  ]

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        location: profile.location || ''
      })
      // Load portfolio items when profile loads
      fetchPortfolioItems()
    }
  }, [profile])

  if (loading) {
    return (
      <div className="artist-profile">
        <SearchBar onSearch={handleSearch} onLogoClick={handleLogoClick} />
        <div className="loading-state">
          <LoadingSpinner size="large" />
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    navigate('/')
    return null
  }

  // Placeholder follower count
  const followerCount = 1247

  // Check if profile is incomplete (missing bio or location)
  const isProfileIncomplete = !profile?.bio || !profile?.location

  return (
    <div className="artist-profile">
      <SearchBar onSearch={handleSearch} onLogoClick={handleLogoClick} />
      
      <main className="artist-profile-content">
        <div className="container">
          <div className="artist-profile-main">
            {/* Sezione Alta - Informazioni Profilo */}
            <section className="artist-profile-header">
              <div className="profile-info">
                {/* Avatar */}
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name}
                  alt={`Avatar di ${profile.full_name || profile.username || 'Utente'}`}
                  size="lg"
                  variant="bordered"
                />

                {/* Informazioni */}
                <div className="profile-details">
                  <h1 className="profile-name">
                    {profile.full_name || profile.username || 'Nome non disponibile'}
                  </h1>
                  
                  {profile.location && (
                    <p className="profile-location">
                      📍 {profile.location}
                    </p>
                  )}

                  {profile.bio && (
                    <p className="profile-bio">
                      {profile.bio}
                    </p>
                  )}

                  <div className="profile-stats">
                    <span className="follower-count">
                      <strong>{followerCount.toLocaleString()}</strong> follower
                    </span>
                  </div>

                  {/* Edit Profile Button */}
                  <div className="profile-actions">
                    <button 
                      className="action-btn"
                      onClick={() => setShowEditOverlay(true)}
                    >
                      <span className="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </span>
                      <span className="action-text">
                        {isProfileIncomplete ? 'Completa il profilo' : 'Modifica Profilo'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Sezione Bassa - Tabs Interattive */}
            <section className="artist-profile-tabs">
              {/* Tab Navigation */}
              <div className="tabs-navigation">
                <button 
                  className={`tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
                  onClick={() => setActiveTab('portfolio')}
                >
                  PORTFOLIO
                </button>
                <button 
                  className={`tab-button ${activeTab === 'servizi' ? 'active' : ''}`}
                  onClick={() => setActiveTab('servizi')}
                >
                  SERVIZI
                </button>
                <button 
                  className={`tab-button ${activeTab === 'flash' ? 'active' : ''}`}
                  onClick={() => setActiveTab('flash')}
                >
                  FLASH
                </button>
                <button 
                  className={`tab-button ${activeTab === 'recensioni' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recensioni')}
                >
                  RECENSIONI
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'portfolio' && (
                  <div className="tab-panel portfolio-panel">
                    <h3>GALLERIA LAVORI ({portfolioItems.filter(item => !item.is_flash).length})</h3>
                    {portfolioLoading ? (
                      <div className="portfolio-loading">
                        <LoadingSpinner size="large" />
                        <p>Caricamento portfolio...</p>
                      </div>
                    ) : portfolioItems.filter(item => !item.is_flash).length > 0 ? (
                      <div className="artist-portfolio-grid">
                        {portfolioItems.filter(item => !item.is_flash).map((item) => (
                          <PortfolioCard
                            key={item.id}
                            item={item}
                            onArtistClick={() => {
                              // No artist navigation for own portfolio
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-portfolio">
                        <div className="empty-state">
                          <h4>Portfolio vuoto</h4>
                          <p>I tuoi lavori appariranno qui una volta che inizierai a caricarli.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'servizi' && (
                  <div className="tab-panel servizi-panel">
                    <h3>I MIEI SERVIZI</h3>
                    <div className="empty-portfolio">
                      <div className="empty-state">
                        <h4>Nessun servizio pubblicato</h4>
                        <p>Aggiungi i tuoi servizi per far conoscere ai clienti cosa offri.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'flash' && (
                  <div className="tab-panel flash-panel">
                    <h3>DISEGNI FLASH DISPONIBILI ({portfolioItems.filter(item => item.is_flash).length})</h3>
                    {portfolioLoading ? (
                      <div className="portfolio-loading">
                        <LoadingSpinner size="large" />
                        <p>Caricamento flash...</p>
                      </div>
                    ) : portfolioItems.filter(item => item.is_flash).length > 0 ? (
                      <div className="artist-portfolio-grid">
                        {portfolioItems.filter(item => item.is_flash).map((item) => (
                          <PortfolioCard
                            key={item.id}
                            item={item}
                            onArtistClick={() => {
                              // No artist navigation for own portfolio
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-portfolio">
                        <div className="empty-state">
                          <h4>Nessun flash disponibile</h4>
                          <p>I tuoi disegni flash appariranno qui una volta che inizierai a caricarli.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recensioni' && (
                  <div className="tab-panel recensioni-panel">
                    <h3>LE MIE RECENSIONI</h3>
                    <div className="empty-portfolio">
                      <div className="empty-state">
                        <h4>Nessuna recensione</h4>
                        <p>Le recensioni dei tuoi clienti appariranno qui.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Profile Completion Overlay */}
      {showEditOverlay && (
        <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditOverlay(false)}>
          <div className="auth-modal complete-profile-modal">
            <div className="auth-modal-header">
              <button className="auth-close-btn" onClick={() => setShowEditOverlay(false)}>
                ×
              </button>
            </div>
            
            <div className="complete-profile-content">
              <h2 className="complete-profile-title">
                {isProfileIncomplete ? 'COMPLETA IL TUO PROFILO' : 'MODIFICA PROFILO'}
              </h2>
              <p className="complete-profile-description">
                {isProfileIncomplete 
                  ? 'Aggiungi le informazioni mancanti per completare il tuo profilo'
                  : 'Modifica le informazioni del tuo profilo'
                }
              </p>

              <form className="complete-profile-form" onSubmit={(e) => e.preventDefault()}>
                {/* Bio Field */}
                <div className="form-group">
                  <label htmlFor="bio" className="form-label">
                    BIO {!profile?.bio && <span className="required-indicator">*</span>}
                  </label>
                  <textarea
                    id="bio"
                    className="form-textarea"
                    placeholder="Raccontaci qualcosa su di te..."
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    maxLength={500}
                  />
                  <div className="bio-suggestions">
                    <p className="suggestions-title">💡 Suggerimenti per la bio:</p>
                    <ul className="suggestions-list">
                      {bioSuggestions.map((suggestion, index) => (
                        <li key={index} className="suggestion-item">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="char-count">
                    {formData.bio.length}/500 caratteri
                  </div>
                </div>

                {/* Location Field */}
                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    LOCALITÀ {!profile?.location && <span className="required-indicator">*</span>}
                  </label>
                  <input
                    type="text"
                    id="location"
                    className="form-input"
                    placeholder="Es. Milano, Italia"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    maxLength={100}
                  />
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => setShowEditOverlay(false)}
                    disabled={isSubmitting}
                  >
                    <span className="action-text">Annulla</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleCompleteProfile}
                    disabled={isSubmitting || (!formData.bio.trim() || !formData.location.trim())}
                  >
                    <span className="action-text">
                      {isSubmitting ? 'Salvando...' : (isProfileIncomplete ? 'Completa Profilo' : 'Salva Modifiche')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Upload Overlay */}
      {showUploadOverlay && (
        <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && (setShowUploadOverlay(false), resetUploadForm())}>
          <div className="auth-modal upload-portfolio-modal">
            <div className="auth-modal-header">
              <button className="auth-close-btn" onClick={() => {setShowUploadOverlay(false); resetUploadForm()}}>
                ×
              </button>
            </div>
            
            <div className="upload-portfolio-content">
              <h2 className="upload-portfolio-title">AGGIUNGI LAVORO</h2>
              <p className="upload-portfolio-description">
                Carica un nuovo lavoro nel tuo portfolio
              </p>

              <form className="upload-portfolio-form" onSubmit={(e) => e.preventDefault()}>
                {/* Title Field */}
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    TITOLO <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="form-input"
                    placeholder="Es. Tatuaggio Tribale"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    maxLength={100}
                  />
                </div>

                {/* Description Field */}
                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    DESCRIZIONE
                  </label>
                  <textarea
                    id="description"
                    className="form-textarea"
                    placeholder="Descrivi il lavoro, tecnica utilizzata, significato..."
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={500}
                  />
                  <div className="char-count">
                    {uploadData.description.length}/500 caratteri
                  </div>
                </div>

                {/* Image URL Field */}
                <div className="form-group">
                  <label htmlFor="image_url" className="form-label">
                    URL IMMAGINE
                  </label>
                  <input
                    type="url"
                    id="image_url"
                    className="form-input"
                    placeholder="https://esempio.com/immagine.jpg"
                    value={uploadData.image_url}
                    onChange={(e) => setUploadData(prev => ({ ...prev, image_url: e.target.value }))}
                  />
                </div>

                {/* Tags Field */}
                <div className="form-group">
                  <label htmlFor="tags" className="form-label">
                    TAG
                  </label>
                  <input
                    type="text"
                    id="tags"
                    className="form-input"
                    placeholder="Es. tribale, braccio, nero"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                  />
                  <div className="form-help">
                    Separa i tag con virgole
                  </div>
                </div>

                {/* Flash Checkbox */}
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={uploadData.is_flash}
                      onChange={(e) => setUploadData(prev => ({ ...prev, is_flash: e.target.checked }))}
                    />
                    <span className="checkbox-text">È un disegno flash disponibile</span>
                  </label>
                </div>

                {/* Price Field (only for flash) */}
                {uploadData.is_flash && (
                  <div className="form-group">
                    <label htmlFor="price" className="form-label">
                      PREZZO (€)
                    </label>
                    <input
                      type="number"
                      id="price"
                      className="form-input"
                      placeholder="120"
                      min="0"
                      step="0.01"
                      value={uploadData.price}
                      onChange={(e) => setUploadData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => {setShowUploadOverlay(false); resetUploadForm()}}
                    disabled={isSubmitting}
                  >
                    <span className="action-text">Annulla</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleUploadPortfolio}
                    disabled={isSubmitting || !uploadData.title.trim()}
                  >
                    <span className="action-text">
                      {isSubmitting ? 'Caricando...' : 'Aggiungi Lavoro'}
                    </span>
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