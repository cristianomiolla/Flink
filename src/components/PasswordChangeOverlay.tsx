import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../lib/passwordValidation'
import './AuthOverlay.css'
import './ActionButton.css'

interface PasswordChangeOverlayProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface FormErrors {
  currentPassword?: string
  newPassword?: string[]
  confirmPassword?: string
  general?: string
}

export function PasswordChangeOverlay({ isOpen, onClose }: PasswordChangeOverlayProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reset form when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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

    // Current password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Password attuale richiesta'
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = ['Nuova password richiesta']
    } else {
      const passwordValidation = validatePassword(formData.newPassword)
      if (passwordValidation.errors.length > 0) {
        newErrors.newPassword = passwordValidation.errors
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Conferma password richiesta'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non corrispondono'
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
      // First verify current password by signing in with it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: formData.currentPassword
      })

      if (signInError) {
        setErrors({ currentPassword: 'Password attuale non corretta' })
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ 
        password: formData.newPassword 
      })

      if (error) {
        setErrors({ general: error.message })
        return
      }

      setSuccessMessage('Password aggiornata con successo!')
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
            <h2>CAMBIA PASSWORD</h2>
            <p>Aggiorna la password del tuo account</p>
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
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">
                Password attuale <span className="required-indicator">*</span>
              </label>
              <input
                id="currentPassword"
                type="password"
                className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Inserisci la password attuale"
                disabled={isSubmitting}
              />
              {errors.currentPassword && (
                <div className="form-error">{errors.currentPassword}</div>
              )}
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                Nuova password <span className="required-indicator">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                className={`form-input ${errors.newPassword ? 'error' : ''}`}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Inserisci la nuova password"
                disabled={isSubmitting}
              />
              {errors.newPassword && (
                <div className="form-error">
                  {errors.newPassword.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Conferma nuova password <span className="required-indicator">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Conferma la nuova password"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <div className="form-error">{errors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className="action-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Aggiornamento...' : 'Aggiorna Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}