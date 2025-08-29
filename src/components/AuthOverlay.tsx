import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { validatePassword, validateEmail } from '../lib/passwordValidation'
import './AuthOverlay.css'

interface AuthOverlayProps {
  isOpen: boolean
  onClose: () => void
}

type AuthTab = 'login' | 'register'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

interface FormErrors {
  email?: string
  password?: string[]
  confirmPassword?: string
  fullName?: string
  general?: string
}

export function AuthOverlay({ isOpen, onClose }: AuthOverlayProps) {
  const { signIn, signUp, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reset form when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
      })
      setErrors({})
      setSuccessMessage('')
      setActiveTab('login')
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
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email richiesta'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email non valida'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = ['Password richiesta']
    } else if (activeTab === 'register') {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors
      }
    }

    // Register-specific validation
    if (activeTab === 'register') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Nome completo richiesto'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Conferma password richiesta'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Le password non coincidono'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    setErrors({})
    setSuccessMessage('')

    try {
      if (activeTab === 'login') {
        const { error } = await signIn(formData.email, formData.password)
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ general: 'Email o password non corretti' })
          } else {
            setErrors({ general: 'Errore durante il login. Riprova.' })
          }
        } else {
          onClose()
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        
        if (error) {
          if (error.message.includes('User already registered')) {
            setErrors({ email: 'Questo indirizzo email è già registrato' })
          } else if (error.message.includes('Password should be at least 6 characters')) {
            setErrors({ password: ['La password deve essere di almeno 6 caratteri'] })
          } else {
            setErrors({ general: 'Errore durante la registrazione. Riprova.' })
          }
        } else {
          setSuccessMessage('Account creato con successo! Controlla la tua email per confermare l\'account.')
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            fullName: ''
          })
          // Switch to login tab after successful registration
          setTimeout(() => {
            setActiveTab('login')
            setSuccessMessage('')
          }, 3000)
        }
      }
    } catch {
      setErrors({ general: 'Errore imprevisto. Riprova.' })
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
        <div className="auth-modal-header">
          <button className="auth-close-btn" onClick={onClose}>
            ×
          </button>
          
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Accedi
            </button>
            <button
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Registrati
            </button>
          </div>
        </div>

        <div className="auth-content">
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
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Nome Completo *
                </label>
                <input
                  id="fullName"
                  type="text"
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Inserisci il tuo nome completo"
                />
                {errors.fullName && (
                  <div className="form-error">{errors.fullName}</div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="inserisci@email.com"
              />
              {errors.email && (
                <div className="form-error">{errors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password *
              </label>
              <input
                id="password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Inserisci la tua password"
              />
              {errors.password && (
                <div className="form-errors">
                  {errors.password.map((error, index) => (
                    <div key={index} className="form-error">{error}</div>
                  ))}
                </div>
              )}
              
              {activeTab === 'register' && formData.password && (
                <div className="password-requirements">
                  <strong>Requisiti password:</strong>
                  <ul>
                    <li className={formData.password.length >= 8 ? 'valid' : 'invalid'}>
                      Almeno 8 caratteri
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'valid' : 'invalid'}>
                      Una lettera maiuscola
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'valid' : 'invalid'}>
                      Una lettera minuscola
                    </li>
                    <li className={/\d/.test(formData.password) ? 'valid' : 'invalid'}>
                      Un numero
                    </li>
                    <li className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password) ? 'valid' : 'invalid'}>
                      Un carattere speciale
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Conferma Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Conferma la tua password"
                />
                {errors.confirmPassword && (
                  <div className="form-error">{errors.confirmPassword}</div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={isSubmitting || loading}
            >
              {isSubmitting 
                ? (activeTab === 'login' ? 'Accesso...' : 'Registrazione...') 
                : (activeTab === 'login' ? 'Accedi' : 'Registrati')
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}