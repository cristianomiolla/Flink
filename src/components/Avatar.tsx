import './Avatar.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'
export type AvatarVariant = 'default' | 'bordered' | 'card'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string | null
  size?: AvatarSize
  variant?: AvatarVariant
  onClick?: () => void
  className?: string
}

export function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  variant = 'default', 
  onClick, 
  className = '' 
}: AvatarProps) {
  
  const getInitials = (fullName: string | null | undefined): string | null => {
    if (!fullName) return null
    
    // Handle email addresses
    if (fullName.includes('@')) {
      const localPart = fullName.split('@')[0]
      return getInitials(localPart)
    }
    
    // Handle dot-separated names (like cristiano.miolla)
    if (fullName.includes('.') && !fullName.includes(' ')) {
      const parts = fullName.split('.')
      return parts
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    }
    
    // Handle space-separated names
    const words = fullName.trim().split(/\s+/)
    
    // If only one word, try to get 2 characters for better visual
    if (words.length === 1) {
      const word = words[0]
      if (word.length >= 2) {
        return (word.charAt(0) + word.charAt(1)).toUpperCase()
      }
      return word.charAt(0).toUpperCase()
    }
    
    // Multiple words - take first letter of first 2 words
    return words
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const getAvatarClasses = () => {
    const baseClass = 'avatar'
    const sizeClass = `avatar-${size}`
    const variantClass = `avatar-${variant}`
    const clickableClass = onClick ? 'avatar-clickable' : ''
    
    return [baseClass, sizeClass, variantClass, clickableClass, className]
      .filter(Boolean)
      .join(' ')
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div 
      className={getAvatarClasses()}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={alt || `Avatar di ${name || 'utente'}`}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || `Avatar di ${name || 'utente'}`}
          className="avatar-image"
          loading="lazy"
        />
      ) : (
        <div className="avatar-placeholder">
          {getInitials(name) || (
            <svg 
              className="avatar-icon" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>
      )}
    </div>
  )
}