import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './FormOverlay.css'

interface PasswordChangeOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function PasswordChangeOverlay({ isOpen, onClose }: PasswordChangeOverlayProps) {
  const [, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Le password non corrispondono')
      return
    }

    if (newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess('Password cambiata con successo!')

      setTimeout(() => {
        onClose()
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccess('')
      }, 2000)
    } catch {
      setError('Errore durante il cambio password. Riprova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content auth-modal">
        <div className="auth-header-sticky">
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="auth-modal-header">
        </div>

        <div className="auth-content">
          <div className="header-card">
            <h2>CAMBIA PASSWORD</h2>
            <p>Inserisci la nuova password per il tuo account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Nuova Password <span className="required-indicator">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Inserisci la nuova password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Conferma Password <span className="required-indicator">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Conferma la nuova password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message" style={{
                background: '#D1FAE5',
                color: '#065F46',
                padding: '0.75rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              className="action-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cambiando...' : 'Cambia Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}