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
    <div className="confirmation-overlay" onClick={handleOverlayClick}>
      <div className="confirmation-modal">
        <div className="confirmation-header">
          <h3 className="confirmation-title">{title}</h3>
          <button className="confirmation-close-btn" onClick={handleCancel}>
            ×
          </button>
        </div>
        
        <div className="confirmation-content">
          <p className="confirmation-message">{message}</p>
        </div>
        
        <div className="confirmation-actions">
          <button className="confirmation-btn cancel-btn" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className="confirmation-btn confirm-btn" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}