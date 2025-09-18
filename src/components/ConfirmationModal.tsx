import { useEffect } from 'react'
import './FormOverlay.css'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Conferma",
  cancelText = "Annulla",
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  
  // Block scroll when modal is open and handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      document.body.style.overflow = 'unset'
    }

    // Clean up on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content confirmation-modal">
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onCancel}>
          ×
        </button>

        <div className="auth-content">
          <div className="header-card">
            <h2>{title}</h2>
            <p>{message}</p>
          </div>

          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
            <div className="form-actions">
              <button 
                type="button"
                className="action-btn" 
                onClick={onCancel}
              >
                <span className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </span>
                <span className="action-text">{cancelText}</span>
              </button>
              <button 
                type="submit"
                className="action-btn"
              >
                <span className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </span>
                <span className="action-text">{confirmText}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}