import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { validateEmail } from '../lib/passwordValidation'
import './AuthOverlay.css'
import './ActionButton.css'

interface EmailChangeOverlayProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  newEmail: string
}

interface FormErrors {
  newEmail?: string
  general?: string
}

export function EmailChangeOverlay({ isOpen, onClose }: EmailChangeOverlayProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    newEmail: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reset form when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        newEmail: ''
      })
      setErrors({})
      setSuccessMessage('')
    }
  }, [isOpen])

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

    // New email validation
    if (!formData.newEmail) {
      newErrors.newEmail = 'Nuova email richiesta'
    } else if (!validateEmail(formData.newEmail)) {
      newErrors.newEmail = 'Email non valida'
    } else if (formData.newEmail === user?.email) {
      newErrors.newEmail = 'La nuova email deve essere diversa da quella attuale'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (isSubmitting || !user) return

    setIsSubmitting(true)
    setErrors({})

    try {
      // Update email in auth with proper redirect URL
      const { error } = await supabase.auth.updateUser(
        { email: formData.newEmail },
        {
          emailRedirectTo: 'https://cristianomiolla.github.io/Skunk/'
        }
      )

      if (error) {
        if (error.message.includes('email_address_taken')) {
          setErrors({ newEmail: 'Questa email è già utilizzata da un altro account' })
        } else {
          setErrors({ general: error.message })
        }
        return
      }

      setSuccessMessage('Email di conferma inviata! Controlla sia la VECCHIA che la NUOVA casella postale e clicca sui link di conferma in entrambe per completare il cambio.')
      setTimeout(() => {
        onClose()
      }, 5000)

    } catch (error) {
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
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        {/* Sticky Header with Close Button */}
        <div className="auth-header-sticky">
          <button className="auth-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="auth-modal-header">
          {/* Empty header section to maintain layout consistency */}
        </div>

        <div className="auth-content">
          <div className="header-card">
            <h2>CAMBIA EMAIL</h2>
            <p>Aggiorna l'indirizzo email del tuo account. Riceverai due email di conferma: una sulla vecchia email e una sulla nuova. Dovrai confermare entrambe per completare il cambio.</p>
          </div>

          {errors.general && (
            <div className="auth-error">
              {errors.general}
            </div>
          )}

          {successMessage && (
            <div className="auth-success">
              {successMessage}
              <div style={{ marginTop: '1rem', fontSize: '13px', lineHeight: '1.4' }}>
                <strong>IMPORTANTE:</strong><br/>
                • Controlla la tua vecchia email ({user?.email}) e clicca il link di conferma<br/>
                • Controlla la tua nuova email e clicca il link di conferma<br/>
                • Solo dopo aver confermato entrambe potrai accedere con la nuova email<br/>
                • Fino ad allora continuerai ad accedere con la vecchia email<br/>
                • La sincronizzazione del profilo avverrà automaticamente dopo la conferma
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Current Email Display */}
            <div className="form-group">
              <label className="form-label">
                Email attuale
              </label>
              <div className="current-email-display">
                {user?.email || 'N/A'}
              </div>
            </div>

            {/* New Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="newEmail">
                Nuova email *
              </label>
              <input
                id="newEmail"
                type="email"
                className={`form-input ${errors.newEmail ? 'error' : ''}`}
                value={formData.newEmail}
                onChange={(e) => handleInputChange('newEmail', e.target.value)}
                placeholder="Inserisci la nuova email"
                disabled={isSubmitting}
              />
              {errors.newEmail && (
                <div className="form-error">{errors.newEmail}</div>
              )}
            </div>

            <button
              type="submit"
              className="action-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Invio in corso...' : 'Aggiorna Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}