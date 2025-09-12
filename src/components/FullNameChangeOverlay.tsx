import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import './AuthOverlay.css'
import './ActionButton.css'

interface FullNameChangeOverlayProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  newFullName: string
}

interface FormErrors {
  newFullName?: string
  general?: string
}

export function FullNameChangeOverlay({ isOpen, onClose }: FullNameChangeOverlayProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    newFullName: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reset form when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        newFullName: profile?.full_name || ''
      })
      setErrors({})
      setSuccessMessage('')
    } else {
      // Set current full name when opening
      setFormData({
        newFullName: profile?.full_name || ''
      })
    }
  }, [isOpen, profile?.full_name])

  // Block body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Full name validation
    if (!formData.newFullName.trim()) {
      newErrors.newFullName = 'Nome completo richiesto'
    } else if (formData.newFullName.trim() === profile?.full_name) {
      newErrors.newFullName = 'Il nuovo nome deve essere diverso da quello attuale'
    } else if (formData.newFullName.trim().length < 2) {
      newErrors.newFullName = 'Il nome deve essere di almeno 2 caratteri'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (isSubmitting || !user || !profile) return

    setIsSubmitting(true)
    setErrors({})

    try {
      // Update full_name in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.newFullName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (profileError) {
        setErrors({ general: 'Errore durante l\'aggiornamento del profilo: ' + profileError.message })
        return
      }

      // Update display name in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: formData.newFullName.trim() 
        }
      })

      if (authError) {
        console.warn('Warning: Could not update auth metadata:', authError.message)
        // Don't fail the operation for this, as the profile was updated successfully
      }

      setSuccessMessage('Nome aggiornato con successo!')
      
      // Refresh the profile to get the updated data
      await refreshProfile()
      
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch {
      setErrors({ general: 'Si è verificato un errore. Riprova.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors for the field being edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content auth-modal">
        {/* Sticky Header with Close Button */}
        <div className="auth-header-sticky">
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="auth-modal-header">
          {/* Empty header section to maintain layout consistency */}
        </div>

        <div className="auth-content">
          <div className="header-card">
            <h2>CAMBIA NOME</h2>
            <p>Aggiorna il nome visualizzato sul tuo profilo. Questo nome sarà visibile agli altri utenti</p>
          </div>

          {errors.general && (
            <div className="auth-error">
              {errors.general}
            </div>
          )}

          {successMessage && (
            <div className="auth-success">
              {successMessage}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Current Full Name Display */}
            <div className="form-group">
              <label className="form-label">
                Nome attuale
              </label>
              <div className="current-email-display">
                {profile?.full_name || 'N/A'}
              </div>
            </div>

            {/* New Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="newFullName">
                Nuovo nome <span className="required-indicator">*</span>
              </label>
              <input
                id="newFullName"
                type="text"
                className={`form-input ${errors.newFullName ? 'error' : ''}`}
                value={formData.newFullName}
                onChange={(e) => handleInputChange('newFullName', e.target.value)}
                placeholder="Inserisci il nuovo nome completo"
                disabled={isSubmitting}
              />
              {errors.newFullName && (
                <div className="form-error">{errors.newFullName}</div>
              )}
            </div>

            <button
              type="submit"
              className="action-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvataggio...' : 'Aggiorna Nome'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}