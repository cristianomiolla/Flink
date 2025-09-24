import { type ReactNode } from 'react'
import './Header.css'
import './PageHeader.css'
import { useAuth } from '../hooks/useAuth'
import { HeaderIcons } from './HeaderIcons'
import { ProfileDropdown } from './ProfileDropdown'

interface HeaderProps {
  onLogoClick?: () => void
  children?: ReactNode
  onAuthRequired?: () => void
  hideOnMobile?: boolean
}

export function Header({ onLogoClick, children, onAuthRequired }: HeaderProps) {
  const { user, loading } = useAuth()

  const handleAuthClick = () => {
    onAuthRequired?.()
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <span className="logo" onClick={onLogoClick}>FLINK</span>

          {children && (
            <div className="header-card">
              {children}
            </div>
          )}

          <div className="user-section">
            {loading ? (
              <div className="auth-loading">...</div>
            ) : user ? (
              <>
                <HeaderIcons />
                <ProfileDropdown />
              </>
            ) : (
              <button className="btn btn-primary auth-btn" onClick={handleAuthClick}>
                Login/Registrati
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}