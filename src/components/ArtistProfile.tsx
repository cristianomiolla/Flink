import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { useArtistProfile } from '../hooks/useArtistProfile'
import { useFollowers } from '../hooks/useFollowers'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'
import { PortfolioCard } from './PortfolioCard'
import { Avatar } from './Avatar'
import './ArtistProfile.css'
import './TabHeader.css'
import './TabsNavigation.css'
import type { TabType } from '../types/portfolio'

export function ArtistProfile() {
  const { artistId } = useParams<{ artistId: string }>()
  const navigate = useNavigate()
  const { profile: currentUserProfile } = useAuth()
  const { profile, portfolioItems, services, loading, error } = useArtistProfile(artistId || '')
  const { fetchFollowerStats, getFollowerStats, toggleFollow } = useFollowers()
  const [activeTab, setActiveTab] = useState<TabType>('portfolio')
  
  // Get follower stats for this artist
  const followerStats = profile ? getFollowerStats(profile.user_id) : null
  const followerCount = followerStats?.follower_count || 0
  const isFollowing = followerStats?.is_following || false

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fetch follower stats when profile loads
  useEffect(() => {
    if (profile?.user_id) {
      fetchFollowerStats([profile.user_id])
    }
  }, [profile?.user_id, fetchFollowerStats])
  
  // Redirect to personal profile if user is viewing their own profile
  useEffect(() => {
    if (currentUserProfile && artistId && currentUserProfile.user_id === artistId) {
      navigate('/profile', { replace: true })
      return
    }
  }, [currentUserProfile, artistId, navigate])
  
  if (!artistId) {
    navigate('/')
    return null
  }

  // Filter portfolio items
  const regularPortfolioItems = portfolioItems.filter(item => !item.is_flash)
  const flashItems = portfolioItems.filter(item => item.is_flash)

  const handleSearch = (searchTerm: string, location: string) => {
    // Naviga alla home con parametri di ricerca
    navigate(`/?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`)
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleContactArtist = () => {
    if (artistId) {
      navigate(`/messages/${artistId}`)
    }
  }

  const handleFollowClick = async () => {
    if (profile?.user_id) {
      await toggleFollow(profile.user_id)
    }
  }

  return (
    <div className="artist-profile">
      <SearchBar onSearch={handleSearch} onLogoClick={handleLogoClick} hideOnMobile={true} />
      
      <main className="artist-profile-content">
        <div className="container">
          
          {loading ? (
            <div className="loading-state">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="error-state">
              <h2>Errore nel caricamento del profilo</h2>
              <p>{error}</p>
            </div>
          ) : profile ? (
            <div className="artist-profile-main">
              {/* Sezione Alta - Informazioni Profilo */}
              <section className="artist-profile-header">
                <div className="profile-info">
                  {/* Avatar */}
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.full_name || profile.username}
                    alt={`Avatar di ${profile.full_name || profile.username || 'Artista'}`}
                    size="lg"
                    variant="bordered"
                  />

                  {/* Informazioni */}
                  <div className="profile-details">
                    <h1 className="profile-name">
                      {profile.full_name || profile.username || 'Artista Sconosciuto'}
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

                    {/* Action Buttons */}
                    <div className="artist-actions">
                      <button className={`action-btn ${isFollowing ? 'active' : ''}`} onClick={handleFollowClick}>
                        <span className="action-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                          </svg>
                        </span>
                        <span className="action-text">{isFollowing ? 'Seguito' : 'Segui'}</span>
                      </button>
                      <button className="action-btn" onClick={handleContactArtist}>
                        <span className="action-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                        </span>
                        <span className="action-text">Contatta</span>
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
                    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span className="tab-text">PORTFOLIO</span>
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'flash' ? 'active' : ''}`}
                    onClick={() => setActiveTab('flash')}
                  >
                    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                    </svg>
                    <span className="tab-text">FLASH</span>
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'servizi' ? 'active' : ''}`}
                    onClick={() => setActiveTab('servizi')}
                  >
                    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    <span className="tab-text">SERVIZI</span>
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'recensioni' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recensioni')}
                  >
                    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                    </svg>
                    <span className="tab-text">RECENSIONI</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                  {activeTab === 'portfolio' && (
                    <div className="tab-panel portfolio-panel">
                      <h3>Realizzati</h3>
                      {loading ? (
                        <div className="portfolio-loading">
                          <LoadingSpinner size="large" />
                          <p>Caricamento portfolio...</p>
                        </div>
                      ) : regularPortfolioItems.length > 0 ? (
                        <div className="portfolio-grid">
                          {regularPortfolioItems.map((item) => (
                            <PortfolioCard
                              key={item.id}
                              item={{
                                id: item.id,
                                title: item.title,
                                description: item.description || '',
                                image_url: item.image_url,
                                tags: item.tags || [],
                                is_flash: item.is_flash,
                                price: item.price,
                                location: item.location,
                                created_at: item.created_at,
                                updated_at: item.updated_at,
                                user_id: item.user_id,
                                artist_name: profile?.full_name || profile?.username || 'Artista',
                                full_name: profile?.full_name || profile?.username || 'Artista'
                              }}
                              onArtistClick={() => {
                                // Handle artist navigation
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="empty-portfolio">
                          <div className="empty-state">
                            <h4>Nessun lavoro pubblicato</h4>
                            <p>Questo artista non ha ancora caricato lavori personalizzati nel suo portfolio.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'servizi' && (
                    <div className="tab-panel servizi-panel">
                      <h3>SERVIZI OFFERTI {!loading && services.length > 0 && `(${services.length})`}</h3>
                      {loading ? (
                        <div className="portfolio-loading">
                          <LoadingSpinner size="large" />
                          <p>Caricamento servizi...</p>
                        </div>
                      ) : services.length > 0 ? (
                        <div className="services-list">
                          {services.map((service) => (
                            <div key={service.id} className="service-item">
                              {service.image_url && (
                                <div className="service-image">
                                  <img 
                                    src={service.image_url} 
                                    alt={service.name}
                                    className="service-img"
                                  />
                                </div>
                              )}
                              <div className="service-info">
                                <h4>{service.name}</h4>
                                <p>{service.description || ''}</p>
                                <div className="service-details">
                                  {service.body_area && service.body_area !== 'N/A' && (
                                    <span className="service-detail">
                                      <strong>Zona:</strong> {service.body_area}
                                    </span>
                                  )}
                                  {service.size_category && service.size_category !== 'N/A' && (
                                    <span className="service-detail">
                                      <strong>Dimensione:</strong> {service.size_category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="service-price">
                                {service.discount_percentage ? (
                                  <div className="price-with-discount">
                                    <span className="original-price">
                                      {service.pricing_type === 'range' 
                                        ? `€${service.price_min}-${service.price_max}`
                                        : service.pricing_type === 'fixed' 
                                        ? `€${service.fixed_price}`
                                        : 'Su consultazione'
                                      }
                                    </span>
                                    <span className="discounted-price">
                                      {service.pricing_type === 'range' 
                                        ? `€${Math.round(service.price_min! * (100 - service.discount_percentage) / 100)}-${Math.round(service.price_max! * (100 - service.discount_percentage) / 100)}`
                                        : service.pricing_type === 'fixed' 
                                        ? `€${Math.round(service.fixed_price! * (100 - service.discount_percentage) / 100)}`
                                        : 'Su consultazione'
                                      }
                                    </span>
                                  </div>
                                ) : (
                                  <span>
                                    {service.pricing_type === 'range' 
                                      ? `€${service.price_min}-${service.price_max}`
                                      : service.pricing_type === 'fixed' 
                                      ? `€${service.fixed_price}`
                                      : 'Su consultazione'
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-portfolio">
                          <div className="empty-state">
                            <h4>Nessun servizio disponibile</h4>
                            <p>Questo artista non ha ancora pubblicato i suoi servizi.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'flash' && (
                    <div className="tab-panel flash-panel">
                      <h3>Flash</h3>
                      {loading ? (
                        <div className="portfolio-loading">
                          <LoadingSpinner size="large" />
                          <p>Caricamento flash...</p>
                        </div>
                      ) : flashItems.length > 0 ? (
                        <div className="portfolio-grid">
                          {flashItems.map((item) => (
                            <PortfolioCard
                              key={item.id}
                              item={{
                                id: item.id,
                                title: item.title,
                                description: item.description || '',
                                image_url: item.image_url,
                                tags: item.tags || [],
                                is_flash: item.is_flash,
                                price: item.price,
                                location: item.location,
                                created_at: item.created_at,
                                updated_at: item.updated_at,
                                user_id: item.user_id,
                                artist_name: profile?.full_name || profile?.username || 'Artista',
                                full_name: profile?.full_name || profile?.username || 'Artista'
                              }}
                              onArtistClick={() => {
                                // Handle artist navigation
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="empty-portfolio">
                          <div className="empty-state">
                            <h4>Nessun flash disponibile</h4>
                            <p>Questo artista non ha ancora caricato disegni flash disponibili.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'recensioni' && (
                    <div className="tab-panel recensioni-panel">
                      <h3>RECENSIONI CLIENTI</h3>
                      <div className="reviews-list">
                        <div className="review-item">
                          <div className="review-header">
                            <div className="reviewer-info">
                              <strong>Marco R.</strong>
                              <div className="review-stars">★★★★★</div>
                            </div>
                            <span className="review-date">15 Gen 2024</span>
                          </div>
                          <p className="review-text">
                            "Esperienza fantastica! Professionalità al top e risultato perfetto. 
                            Il tatuaggio è venuto esattamente come volevo. Consigliatissimo!"
                          </p>
                        </div>
                        <div className="review-item">
                          <div className="review-header">
                            <div className="reviewer-info">
                              <strong>Giulia M.</strong>
                              <div className="review-stars">★★★★★</div>
                            </div>
                            <span className="review-date">8 Gen 2024</span>
                          </div>
                          <p className="review-text">
                            "Artista incredibile! Studio pulito e igienizzato, grande attenzione 
                            ai dettagli. Il mio primo tatuaggio non poteva andare meglio."
                          </p>
                        </div>
                        <div className="review-item">
                          <div className="review-header">
                            <div className="reviewer-info">
                              <strong>Alessio T.</strong>
                              <div className="review-stars">★★★★★</div>
                            </div>
                            <span className="review-date">2 Gen 2024</span>
                          </div>
                          <p className="review-text">
                            "Cover up riuscitissimo! Ha trasformato un vecchio tatuaggio in 
                            un'opera d'arte. Tempi rispettati e prezzo onesto."
                          </p>
                        </div>
                      </div>
                      <div className="reviews-summary">
                        <div className="rating-average">
                          <span className="rating-number">4.9</span>
                          <div className="rating-stars">★★★★★</div>
                          <span className="rating-count">127 recensioni</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="error-state">
              <h2>Profilo non trovato</h2>
              <p>L'artista richiesto non è stato trovato.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}