import type { ReactNode } from 'react'
import { useOverlay } from '../hooks/useOverlay'
import './AuthOverlay.css'

interface OverlayWrapperProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  subtitle?: string
  showHeader?: boolean
}

/**
 * Reusable overlay wrapper component that provides:
 * - Modal overlay with click-to-close functionality
 * - Consistent modal structure and styling
 * - Optional header with title and subtitle
 * - Close button
 * - Escape key and body scroll handling via useOverlay hook
 */
export function OverlayWrapper({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  subtitle, 
  showHeader = true 
}: OverlayWrapperProps) {
  const { handleOverlayClick } = useOverlay(isOpen, onClose)

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
          {/* Header content area - can be empty or contain toggles/social buttons */}
        </div>

        <div className="auth-content">
          {showHeader && (title || subtitle) && (
            <div className="header-card">
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
          
          {children}
        </div>
      </div>
    </div>
  )
}