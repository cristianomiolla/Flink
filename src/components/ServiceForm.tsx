import { useState, useEffect } from 'react'
import type { CreateServiceData, ArtistService } from '../types/portfolio'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import './ServiceForm.css'
import './ImageUpload.css'
import './Dropdown.css'

const bodyAreaOptions = [
  { value: 'braccio', label: 'Braccio' },
  { value: 'gamba', label: 'Gamba' },
  { value: 'schiena', label: 'Schiena' },
  { value: 'petto', label: 'Petto' },
  { value: 'mano', label: 'Mano' },
  { value: 'piede', label: 'Piede' },
  { value: 'collo', label: 'Collo' },
  { value: 'viso', label: 'Viso' },
  { value: 'altro', label: 'Altro' }
]

const sizeOptions = [
  { value: 'piccolo', label: 'Piccolo (fino a 5cm)' },
  { value: 'medio', label: 'Medio (5-15cm)' },
  { value: 'grande', label: 'Grande (15-30cm)' },
  { value: 'extra-grande', label: 'Extra Grande (oltre 30cm)' }
]

interface ServiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateServiceData) => Promise<boolean>
  editingService?: ArtistService | null
  isEditing?: boolean
}

export function ServiceForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingService = null, 
  isEditing = false 
}: ServiceFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<CreateServiceData>({
    name: editingService?.name || '',
    description: editingService?.description || '',
    body_area: editingService?.body_area || '',
    size_category: editingService?.size_category || '',
    pricing_type: editingService?.pricing_type || 'fixed',
    fixed_price: editingService?.fixed_price || null,
    price_min: editingService?.price_min || null,
    price_max: editingService?.price_max || null,
    discount_percentage: editingService?.discount_percentage || null,
    image_url: editingService?.image_url || ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bodyAreaDropdownOpen, setBodyAreaDropdownOpen] = useState(false)
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false)
  
  // Image upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  // Check if all required fields are filled
  const isFormValid = formData.name.trim().length > 0 &&
    formData.body_area.length > 0 &&
    formData.size_category.length > 0 &&
    ((formData.pricing_type === 'fixed' && formData.fixed_price !== null && formData.fixed_price > 0) ||
     (formData.pricing_type === 'range' && formData.price_min !== null && formData.price_max !== null && formData.price_min > 0 && formData.price_max > 0))

  const uploadImage = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated')
    
    try {
      setImageUploading(true)
      // Genera un nome file unico
      const fileExt = file.name.split('.').pop()
      const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Carica il file su Supabase Storage
      const { error } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Ottieni l'URL pubblico
      const { data } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Errore durante il caricamento dell\'immagine')
    } finally {
      setImageUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Formato file non supportato. Usa JPG, PNG o WebP.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Il file è troppo grande. Dimensione massima: 5MB.')
        return
      }

      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Initialize form data when editing service changes
  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name || '',
        description: editingService.description || '',
        body_area: editingService.body_area || '',
        size_category: editingService.size_category || '',
        pricing_type: editingService.pricing_type || 'fixed',
        fixed_price: editingService.fixed_price || null,
        price_min: editingService.price_min || null,
        price_max: editingService.price_max || null,
        discount_percentage: editingService.discount_percentage || null,
        image_url: editingService.image_url || ''
      })
      
      // Set image preview if available
      if (editingService.image_url) {
        setFilePreview(editingService.image_url)
      }
    }
  }, [editingService])

  // Initialize preview for editing service
  useEffect(() => {
    if (isEditing && editingService?.image_url) {
      setFilePreview(editingService.image_url)
    }
  }, [isEditing, editingService])

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Clean up on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Il nome del servizio è obbligatorio')
      return
    }

    if (!formData.body_area) {
      alert('L\'area del corpo è obbligatoria')
      return
    }

    if (!formData.size_category) {
      alert('La dimensione è obbligatoria')
      return
    }

    if (formData.pricing_type === 'fixed' && (!formData.fixed_price || formData.fixed_price <= 0)) {
      alert('Il prezzo è obbligatorio per il prezzo fisso')
      return
    }

    if (formData.pricing_type === 'range' && (!formData.price_min || !formData.price_max || formData.price_min <= 0 || formData.price_max <= 0)) {
      alert('I prezzi minimo e massimo sono obbligatori per il range di prezzo')
      return
    }

    if (formData.pricing_type === 'range' && formData.price_min && formData.price_max && formData.price_min > formData.price_max) {
      alert('Il prezzo minimo non può essere maggiore del prezzo massimo')
      return
    }

    setIsSubmitting(true)
    
    try {
      const finalFormData = { ...formData }
      
      // Upload new image if selected
      if (selectedFile) {
        const imageUrl = await uploadImage(selectedFile)
        finalFormData.image_url = imageUrl
      }
      
      // Normalize pricing data to satisfy database constraints
      if (finalFormData.pricing_type === 'fixed') {
        finalFormData.price_min = null
        finalFormData.price_max = null
      } else if (finalFormData.pricing_type === 'range') {
        finalFormData.fixed_price = null
      }
      
      
      const success = await onSubmit(finalFormData)
      
      if (success) {
        onClose()
        // Reset form if not editing
        if (!isEditing) {
          setFormData({
            name: '',
            description: '',
            body_area: '',
            size_category: '',
            pricing_type: 'fixed',
            fixed_price: null,
            price_min: null,
            price_max: null,
            discount_percentage: null,
            image_url: ''
          })
          setSelectedFile(null)
          setFilePreview(null)
        }
      }
    } catch (error) {
      console.error('Error submitting service:', error)
      alert('Errore durante il salvataggio del servizio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content auth-modal">
        {/* Sticky Header with Close Button */}
        <div className="auth-header-sticky">
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="auth-modal-header">
        </div>
        
        <div className="auth-content">
          <div className="header-card">
            <h2>{isEditing ? 'MODIFICA SERVIZIO' : 'AGGIUNGI SERVIZIO'}</h2>
            <p>{isEditing ? 'Modifica i dettagli del tuo servizio' : 'Aggiungi un nuovo servizio alla tua offerta'}</p>
          </div>

          <form className="upload-portfolio-form" onSubmit={handleSubmit}>
          {/* Service Name */}
          <div className="form-group">
            <label htmlFor="serviceName" className="form-label">
              Nome Servizio <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              id="serviceName"
              className="form-input"
              placeholder="Es. Tatuaggio Tradizionale"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="serviceDescription" className="form-label">
              Descrizione
            </label>
            <textarea
              id="serviceDescription"
              className="form-textarea"
              placeholder="Descrivi il servizio che offri..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              maxLength={500}
            />
            <div className="char-count">
              {formData.description.length}/500 caratteri
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="serviceImage" className="form-label">
              Immagine di Esempio
            </label>
            <div className="image-upload-section">
              {(filePreview || formData.image_url) && (
                <div className="image-preview-container">
                  <img 
                    src={filePreview || formData.image_url} 
                    alt="Preview" 
                    className="image-preview"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => {
                      setSelectedFile(null)
                      setFilePreview(null)
                      setFormData(prev => ({ ...prev, image_url: '' }))
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="file-upload-container">
                <input
                  type="file"
                  id="serviceImage"
                  className="file-input"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={imageUploading}
                />
                <label htmlFor="serviceImage" className="file-upload-btn">
                  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <span>{selectedFile ? 'Cambia Immagine' : 'Carica Immagine'}</span>
                </label>
              </div>
              {imageUploading && <p className="uploading-text">Caricamento in corso...</p>}
              <p className="file-info">JPG, PNG o WebP. Max 5MB.</p>
            </div>
          </div>

          {/* Body Area */}
          <div className="form-group">
            <label className="form-label">
              Area del Corpo <span className="required-indicator">*</span>
            </label>
            <div className="custom-dropdown">
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setBodyAreaDropdownOpen(!bodyAreaDropdownOpen)}
              >
                <span className="dropdown-text">
                  {formData.body_area 
                    ? bodyAreaOptions.find(opt => opt.value === formData.body_area)?.label || 'Seleziona area'
                    : 'Seleziona area'
                  }
                </span>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              {bodyAreaDropdownOpen && (
                <div className="dropdown-menu select-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, body_area: '' }))
                      setBodyAreaDropdownOpen(false)
                    }}
                  >
                    Seleziona area
                  </button>
                  {bodyAreaOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`dropdown-item ${formData.body_area === option.value ? 'active' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, body_area: option.value }))
                        setBodyAreaDropdownOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Size Category */}
          <div className="form-group">
            <label className="form-label">
              Dimensione <span className="required-indicator">*</span>
            </label>
            <div className="custom-dropdown">
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
              >
                <span className="dropdown-text">
                  {formData.size_category 
                    ? sizeOptions.find(opt => opt.value === formData.size_category)?.label || 'Seleziona dimensione'
                    : 'Seleziona dimensione'
                  }
                </span>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              {sizeDropdownOpen && (
                <div className="dropdown-menu select-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, size_category: '' }))
                      setSizeDropdownOpen(false)
                    }}
                  >
                    Seleziona dimensione
                  </button>
                  {sizeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`dropdown-item ${formData.size_category === option.value ? 'active' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, size_category: option.value }))
                        setSizeDropdownOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price Type */}
          <div className="form-group">
            <label className="form-label">Tipo di Prezzo</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="priceType"
                  checked={formData.pricing_type === 'fixed'}
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    pricing_type: 'fixed',
                    price_min: null,
                    price_max: null 
                  }))}
                />
                <span className="radio-text">Prezzo fisso</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="priceType"
                  checked={formData.pricing_type === 'range'}
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    pricing_type: 'range',
                    fixed_price: null,
                    discount_percentage: null
                  }))}
                />
                <span className="radio-text">Range di prezzo</span>
              </label>
            </div>
          </div>

          {/* Price Fields */}
          {formData.pricing_type === 'range' ? (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priceMin" className="form-label">
                  Prezzo Minimo (€) <span className="required-indicator">*</span>
                </label>
                <input
                  type="number"
                  id="priceMin"
                  className="form-input"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={formData.price_min || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price_min: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="priceMax" className="form-label">
                  Prezzo Massimo (€) <span className="required-indicator">*</span>
                </label>
                <input
                  type="number"
                  id="priceMax"
                  className="form-input"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={formData.price_max || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price_max: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
            </div>
          ) : formData.pricing_type === 'fixed' ? (
            <div className="form-group">
              <label htmlFor="fixedPrice" className="form-label">
                Prezzo (€) <span className="required-indicator">*</span>
              </label>
              <input
                type="number"
                id="fixedPrice"
                className="form-input"
                placeholder="0"
                min="0"
                step="0.01"
                value={formData.fixed_price || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fixed_price: e.target.value ? parseFloat(e.target.value) : null 
                }))}
              />
            </div>
          ) : null}

          {/* Discount */}
          {formData.pricing_type === 'fixed' && (
            <div className="form-group">
              <label htmlFor="discount" className="form-label">
                Sconto (%)
              </label>
              <input
                type="number"
                id="discount"
                className="form-input"
                placeholder="0"
                min="0"
                max="100"
                value={formData.discount_percentage || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_percentage: e.target.value ? parseInt(e.target.value) : null 
                }))}
              />
            </div>
          )}


          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="action-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
              <span className="action-text">Annulla</span>
            </button>
            <button 
              type="submit" 
              className="action-btn"
              disabled={isSubmitting || imageUploading || (!isEditing && !isFormValid)}
            >
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14m7-7l-7-7-7 7"></path>
              </svg>
              <span className="action-text">
                {isSubmitting || imageUploading ? 'Salvando...' : (isEditing ? 'Aggiorna' : 'Aggiungi')}
              </span>
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}