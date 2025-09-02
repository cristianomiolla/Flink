import { useEffect } from 'react'
import './ConfirmationOverlay.css'

interface ConfirmationOverlayProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationOverlay({
  isOpen,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  onConfirm,
  onCancel
}: ConfirmationOverlayProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onCancel])

  // Handle overlay click (close on backdrop click)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }
  
  const handleCancel = () => {
    onCancel()
  }
  
  const handleConfirm = () => {
    onConfirm()
  }

  if (!isOpen) return null

  return (
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <div className="auth-header-sticky">
          <button className="auth-close-btn" onClick={handleCancel}>
            ×
          </button>
        </div>
        
        <div className="auth-modal-header">
          <div className="confirmation-header-title">
            <h2 className="confirmation-title">{title}</h2>
          </div>
        </div>
        
        <div className="auth-content">
          <div className="confirmation-message-section">
            <p className="confirmation-text">{message}</p>
          </div>
          
          <div className="confirmation-actions">
            <button 
              className="action-btn confirmation-cancel-action"
              onClick={handleCancel}
            >
              <span className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </span>
              <span className="action-text">{cancelText}</span>
            </button>
            <button 
              className="action-btn confirmation-confirm-action"
              onClick={handleConfirm}
            >
              <span className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                </svg>
              </span>
              <span className="action-text">{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}