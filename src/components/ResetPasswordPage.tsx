import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainPage } from './MainPage'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../lib/passwordValidation'
import './FormOverlay.css'

interface FormData {
  newPassword: string
  confirmPassword: string
}

interface FormErrors {
  newPassword?: string[]
  confirmPassword?: string
  general?: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Check if user has valid reset session
  useEffect(() => {
    const checkResetSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
        // Redirect to home after 3 seconds if no valid session
        setTimeout(() => {
          navigate('/')
        }, 3000)
      }
    }
    
    checkResetSession()
  }, [navigate])

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
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.general
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting || !isValidSession) return
    
    setIsSubmitting(true)
    setErrors({})
    setSuccessMessage('')
    
    try {
      // Validate new password
      const passwordValidation = validatePassword(formData.newPassword)
      if (!passwordValidation.isValid) {
        setErrors({ newPassword: passwordValidation.errors })
        setIsSubmitting(false)
        return
      }
      
      // Check password confirmation
      if (formData.newPassword !== formData.confirmPassword) {
        setErrors({ confirmPassword: 'Le password non coincidono' })
        setIsSubmitting(false)
        return
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })
      
      if (error) {
        setErrors({ general: 'Errore durante l\'aggiornamento della password. Riprova.' })
      } else {
        setSuccessMessage('Password aggiornata con successo! Verrai reindirizzato alla home page.')
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/')
        }, 3000)
      }
    } catch {
      setErrors({ general: 'Errore imprevisto. Riprova.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    navigate('/')
  }

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>
          Caricamento...
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Background - Main Page */}
      <div style={{ filter: 'blur(2px)', pointerEvents: 'none' }}>
        <MainPage />
      </div>

      {/* Reset Password Overlay */}
      <div className="modal-overlay">
        <div className="modal-content auth-modal">
          {/* Sticky Header with Close Button */}
          <div className="auth-header-sticky">
            <button className="modal-close-btn" onClick={handleClose}>
              ×
            </button>
          </div>
          
          <div className="auth-modal-header">
            {/* Empty header section to maintain layout consistency */}
          </div>
          
          <div className="auth-content">
            <div className="header-card">
              <h2>
                {isValidSession === false 
                  ? 'SESSIONE SCADUTA' 
                  : 'REIMPOSTA PASSWORD'
                }
              </h2>
              <p>
                {isValidSession === false 
                  ? 'Il link di reset password è scaduto o non valido. Richiedi un nuovo link'
                  : 'Inserisci la tua nuova password'
                }
              </p>
            </div>

            {isValidSession === false ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p>Verrai reindirizzato alla home page</p>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                {/* Success Message */}
                {successMessage && (
                  <div className="success-message">
                    {successMessage}
                  </div>
                )}

                {/* General Error */}
                {errors.general && (
                  <div className="form-error general-error">
                    {errors.general}
                  </div>
                )}

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
                    <div className="form-errors">
                      {errors.newPassword.map((error, index) => (
                        <div key={index} className="form-error">{error}</div>
                      ))}
                    </div>
                  )}
                  
                  {formData.newPassword && (
                    <div className="password-requirements">
                      <strong>Requisiti password:</strong>
                      <ul>
                        <li className={formData.newPassword.length >= 8 ? 'valid' : 'invalid'}>
                          Almeno 8 caratteri
                        </li>
                        <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : 'invalid'}>
                          Una lettera maiuscola
                        </li>
                        <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : 'invalid'}>
                          Una lettera minuscola
                        </li>
                        <li className={/\d/.test(formData.newPassword) ? 'valid' : 'invalid'}>
                          Un numero
                        </li>
                        <li className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.newPassword) ? 'valid' : 'invalid'}>
                          Un carattere speciale
                        </li>
                      </ul>
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
                  disabled={isSubmitting || !formData.newPassword.trim() || !formData.confirmPassword.trim()}
                >
                  {isSubmitting ? 'Aggiornamento...' : 'Aggiorna Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}