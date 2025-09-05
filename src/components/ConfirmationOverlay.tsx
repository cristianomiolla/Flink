import { useEffect } from 'react'
import './ConfirmationOverlay.css'
import './AuthOverlay.css'

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
          {/* Empty header section to maintain layout consistency */}
        </div>
        
        <div className="auth-content">
          <div className="header-card">
            <h2>{title}</h2>
            <p>{message}</p>
          </div>
          
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
            <div className="modal-actions">
              <button 
                type="button"
                className="action-btn"
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
                type="submit"
                className="action-btn"
              >
                <span className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
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