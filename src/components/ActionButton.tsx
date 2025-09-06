import { type ReactNode, memo } from 'react'
import './ActionButton.css'
import { useAuth } from '../hooks/useAuth'

export interface ActionButtonProps {
  icon: ReactNode
  text: string
  variant?: 'portfolio' | 'modal' | 'secondary'
  active?: boolean
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  requiresAuth?: boolean
  onAuthRequired?: () => void
}

export const ActionButton = memo(function ActionButton({
  icon,
  text,
  variant = 'portfolio',
  active = false,
  disabled = false,
  onClick,
  className = '',
  requiresAuth = false,
  onAuthRequired
}: ActionButtonProps) {
  const { user } = useAuth()
  const baseClass = 'action-btn'
  const variantClass = variant !== 'portfolio' ? variant : ''
  const activeClass = active ? 'active' : ''
  const disabledClass = disabled ? 'disabled' : ''
  
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return
    
    if (requiresAuth && !user && onAuthRequired) {
      onAuthRequired()
      return
    }
    if (onClick) {
      onClick(e)
    }
  }
  
  return (
    <button
      className={`${baseClass} ${variantClass} ${activeClass} ${disabledClass} ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="action-icon">
        {icon}
      </span>
      <span className="action-text">
        {text}
      </span>
    </button>
  )
})

// Icone riutilizzabili come componenti
export const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
  </svg>
)

export const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

export const MessageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)

export const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 5v14m7-7l-7-7-7 7" />
  </svg>
)

export const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polyline points="3,6 5,6 21,6"></polyline>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
)

export const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polyline points="15,18 9,12 15,6"></polyline>
  </svg>
)

export const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
  </svg>
)