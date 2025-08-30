import { type ReactNode } from 'react'
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

export function ActionButton({
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
  const baseClass = variant === 'modal' 
    ? 'modal-action-btn' 
    : 'action-btn'
  
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
      className={`${baseClass} ${activeClass} ${disabledClass} ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className={variant === 'modal' ? 'modal-action-icon' : 'action-icon'}>
        {icon}
      </span>
      <span className={variant === 'modal' ? 'modal-action-text' : 'action-text'}>
        {text}
      </span>
    </button>
  )
}

// Icone riutilizzabili come componenti
export const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
  </svg>
)

export const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

export const MessageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)