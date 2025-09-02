import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { useAuth } from '../hooks/useAuth'
import { useFollowers } from '../hooks/useFollowers'
import LoadingSpinner from './LoadingSpinner'
import { Avatar } from './Avatar'
import { PortfolioCard } from './PortfolioCard'
import { ActionButton, UploadIcon } from './ActionButton'
import { ConfirmationModal } from './ConfirmationModal'
import { supabase } from '../lib/supabase'
import './PersonalProfile.css'
import type { TabType, PortfolioItem } from '../types/portfolio'

export function PersonalProfile() {
  const navigate = useNavigate()
  const { user, profile, loading, refreshProfile } = useAuth()
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Redirect clients to home page - only artists can access personal profile
  useEffect(() => {
    if (!loading && profile && profile.profile_type === 'client') {
      navigate('/')
    }
  }, [profile, loading, navigate])
  const { fetchFollowerStats, getFollowerStats } = useFollowers()
  const [showEditOverlay, setShowEditOverlay] = useState(false)
  const [showUploadOverlay, setShowUploadOverlay] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('portfolio')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    location: profile?.location || '',
    avatar_url: profile?.avatar_url || ''
  })
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    image_url: '',
    tags: '',
    is_flash: false,
    price: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [filePreview, setFilePreview] = useState<string | null>(null)

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
        full_name: profile.full_name || profile.username || 'Tu',
        artist_avatar_url: profile.avatar_url
      }))

      setPortfolioItems(portfolioData)
    } catch (error) {
      console.error('Error fetching portfolio items:', error)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    if (!user?.id || !profile?.user_id) throw new Error('User not authenticated')
    
    try {
      // Genera un nome file unico
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Carica il file su Supabase Storage
      const { error } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw error
      }

      // Ottieni l'URL pubblico
      const { data: urlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleUploadPortfolio = async () => {
    if (!user || !profile) return
    
    setIsSubmitting(true)
    try {
      let imageUrl = uploadData.image_url.trim() || null
      
      // Se c'è un file selezionato, caricalo
      if (selectedFile) {
        try {
          imageUrl = await uploadImage(selectedFile)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          alert('Errore durante il caricamento dell\'immagine. Riprova.')
          setIsSubmitting(false)
          return
        }
      }
      
      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: profile.user_id,
          title: uploadData.title.trim(),
          description: uploadData.description.trim() || null,
          image_url: imageUrl,
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
      let avatarUrl = formData.avatar_url

      // Carica avatar se selezionato
      if (avatarFile) {
        try {
          const timestamp = Date.now()
          const fileExt = avatarFile.name.split('.').pop()
          const fileName = `${user.id}/avatar_${timestamp}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Error uploading avatar:', uploadError)
            
            // Handle specific storage errors
            if (uploadError.message?.includes('Bucket not found')) {
              alert('Errore: Il bucket per gli avatar non è configurato. Esegui il file fix-avatars-policies.sql nel database.')
            } else if (uploadError.message?.includes('The resource already exists')) {
              alert('Avatar con questo nome già esistente. Riprova.')
            } else if (uploadError.message?.includes('row-level security policy') || uploadError.message?.includes('RLS')) {
              alert('Errore di permessi: Le politiche RLS per gli avatar non sono configurate correttamente. Esegui il file fix-avatars-policies.sql nel database.')
            } else {
              alert(`Errore durante il caricamento dell'avatar: ${uploadError.message}`)
            }
            return
          }

          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(uploadData.path)
            
          avatarUrl = data.publicUrl
        } catch (error) {
          console.error('Network error uploading avatar:', error)
          alert('Errore di rete. Verifica la connessione internet e riprova.')
          return
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio.trim(),
          location: formData.location.trim(),
          avatar_url: avatarUrl,
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
      
      // Reset avatar states
      setAvatarFile(null)
      setAvatarPreview('')
      setShowEditOverlay(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Errore durante l\'aggiornamento del profilo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Seleziona un file immagine valido (JPG, PNG, GIF, WebP)')
        return
      }
      
      // Verifica dimensione file (5MB max)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        alert('Il file è troppo grande. Dimensione massima: 5MB')
        return
      }
      
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
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
    setSelectedFile(null)
    setFilePreview(null)
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Seleziona un file immagine valido (JPG, PNG, GIF, WebP)')
        return
      }
      
      // Verifica dimensione file (2MB max per avatar)
      const maxSize = 2 * 1024 * 1024 // 2MB in bytes
      if (file.size > maxSize) {
        alert('Il file è troppo grande. Dimensione massima: 2MB')
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatarPreview = () => {
    setAvatarFile(null)
    setAvatarPreview('')
    // Se c'è un avatar esistente, lo rimuoviamo anche dal form data
    if (formData.avatar_url) {
      setFormData(prev => ({ ...prev, avatar_url: '' }))
    }
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
        location: profile.location || '',
        avatar_url: profile.avatar_url || ''
      })
      // Load portfolio items when profile loads
      fetchPortfolioItems()
    }
  }, [profile])

  // Block body scroll when overlays are open
  useEffect(() => {
    if (showEditOverlay || showUploadOverlay || showConfirmationModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Clean up on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showEditOverlay, showUploadOverlay, showConfirmationModal])

  // Get follower stats for this user  
  const followerStats = profile ? getFollowerStats(profile.user_id) : null
  const followerCount = followerStats?.follower_count || 0

  // Fetch follower stats when profile loads
  useEffect(() => {
    if (profile?.user_id) {
      fetchFollowerStats([profile.user_id])
    }
  }, [profile?.user_id, fetchFollowerStats])

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate('/')
    }
  }, [user, profile, loading, navigate])

  // Funzione per eliminare un portfolio item - mostra modal di conferma
  const handleDeletePortfolioItem = (itemId: string) => {
    setItemToDelete(itemId)
    setShowConfirmationModal(true)
  }

  // Conferma eliminazione
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemToDelete)

      if (error) {
        console.error('Error deleting portfolio item:', error)
        alert('Errore durante l\'eliminazione dell\'elemento')
        return
      }

      // Rimuovi l'elemento dalla lista locale
      setPortfolioItems(prev => prev.filter(item => item.id !== itemToDelete))
      
      // Segnala che i portfolio items sono stati modificati
      localStorage.setItem('portfolioItemsUpdated', Date.now().toString())
      
      // Chiudi il modal
      setShowConfirmationModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting portfolio item:', error)
      alert('Errore durante l\'eliminazione dell\'elemento')
    }
  }

  // Annulla eliminazione
  const cancelDeleteItem = () => {
    setShowConfirmationModal(false)
    setItemToDelete(null)
  }

  if (loading) {
    return (
      <div className="artist-profile">
        <SearchBar onSearch={handleSearch} onLogoClick={handleLogoClick} hideOnMobile={true} />
        <div className="loading-state">
          <LoadingSpinner size="large" />
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user || !profile) {
    return null
  }

  // Check if profile is incomplete (missing bio or location)
  const isProfileIncomplete = !profile?.bio || !profile?.location

  return (
    <div className="artist-profile">
      <SearchBar onSearch={handleSearch} onLogoClick={handleLogoClick} hideOnMobile={true} />
      
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                  className={`tab-button ${activeTab === 'flash' ? 'active' : ''}`}
                  onClick={() => setActiveTab('flash')}
                >
                  FLASH
                </button>
                <button 
                  className={`tab-button ${activeTab === 'servizi' ? 'active' : ''}`}
                  onClick={() => setActiveTab('servizi')}
                >
                  SERVIZI
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
                            showDeleteButton={true}
                            onDelete={handleDeletePortfolioItem}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-portfolio">
                        <div className="empty-state">
                          <h4>Portfolio vuoto</h4>
                          <p>I tuoi lavori appariranno qui una volta che inizierai a caricarli.</p>
                          <ActionButton
                            icon={<UploadIcon />}
                            text="Aggiungi Lavoro"
                            onClick={() => setShowUploadOverlay(true)}
                          />
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
                            showDeleteButton={true}
                            onDelete={handleDeletePortfolioItem}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-portfolio">
                        <div className="empty-state">
                          <h4>Nessun flash disponibile</h4>
                          <p>I tuoi disegni flash appariranno qui una volta che inizierai a caricarli.</p>
                          <ActionButton
                            icon={<UploadIcon />}
                            text="Aggiungi Flash"
                            onClick={() => {
                              setUploadData(prev => ({ ...prev, is_flash: true }))
                              setShowUploadOverlay(true)
                            }}
                          />
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
            {/* Sticky Header with Close Button */}
            <div className="auth-header-sticky">
              <button className="auth-close-btn" onClick={() => setShowEditOverlay(false)}>
                ×
              </button>
            </div>
            
            <div className="auth-modal-header">
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
                {/* Avatar Field */}
                <div className="form-group">
                  <label htmlFor="avatar" className="form-label">
                    FOTO PROFILO
                  </label>
                  <div className="avatar-upload-section">
                    <div className="current-avatar">
                      {avatarPreview ? (
                        <div className="avatar avatar-md avatar-default">
                          <img 
                            src={avatarPreview} 
                            alt="Anteprima avatar" 
                            className="avatar-image"
                          />
                        </div>
                      ) : formData.avatar_url ? (
                        <div className="avatar avatar-md avatar-default">
                          <img 
                            src={formData.avatar_url} 
                            alt="Avatar attuale" 
                            className="avatar-image"
                          />
                        </div>
                      ) : (
                        <div className="avatar avatar-md avatar-default">
                          <div className="avatar-placeholder">
                            {(profile?.full_name || profile?.username || user?.email || 'U').split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="avatar-upload-controls">
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="file-input"
                        style={{ display: 'none' }}
                      />
                      <ActionButton
                        icon={<UploadIcon />}
                        text={formData.avatar_url || avatarPreview ? 'Cambia foto' : 'Carica foto'}
                        onClick={() => document.getElementById('avatar')?.click()}
                      />
                      {(avatarPreview || formData.avatar_url) && (
                        <ActionButton
                          icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          }
                          text="Rimuovi"
                          onClick={removeAvatarPreview}
                          variant="secondary"
                        />
                      )}
                    </div>
                  </div>
                  <div className="form-help">
                    Formati supportati: JPG, PNG, GIF, WebP. Dimensione massima: 2MB
                  </div>
                </div>

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
                    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    <span className="action-text">Annulla</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleCompleteProfile}
                    disabled={isSubmitting || (!formData.bio.trim() || !formData.location.trim())}
                  >
                    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
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
            {/* Sticky Header with Close Button */}
            <div className="auth-header-sticky">
              <button className="auth-close-btn" onClick={() => {setShowUploadOverlay(false); resetUploadForm()}}>
                ×
              </button>
            </div>
            
            <div className="auth-modal-header">
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

                {/* Image Upload Field */}
                <div className="form-group">
                  <label htmlFor="image_file" className="form-label">
                    IMMAGINE
                  </label>
                  <input
                    type="file"
                    id="image_file"
                    className="form-input file-input"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <div className="form-help">
                    Formati supportati: JPG, PNG, GIF, WebP (max 5MB)
                  </div>
                  {filePreview && (
                    <div className="image-preview">
                      <img src={filePreview} alt="Anteprima" className="preview-image" />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => {
                          setSelectedFile(null)
                          setFilePreview(null)
                          const input = document.getElementById('image_file') as HTMLInputElement
                          if (input) input.value = ''
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
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
                    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    <span className="action-text">Annulla</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleUploadPortfolio}
                    disabled={isSubmitting || !uploadData.title.trim()}
                  >
                    <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 5v14m7-7l-7-7-7 7"/>
                    </svg>
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

      {/* Modal di conferma eliminazione */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        title="Elimina elemento"
        message="Sei sicuro di voler eliminare questo elemento dal portfolio? Questa azione non può essere annullata."
        confirmText="Elimina"
        cancelText="Annulla"
        onConfirm={confirmDeleteItem}
        onCancel={cancelDeleteItem}
      />
    </div>
  )
}