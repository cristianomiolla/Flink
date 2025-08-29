import { type ReactNode } from 'react'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`}>
      <div className="header-card">
        <div className="header-top">
          <h2 className="grid-title">{title}</h2>
          {actions && <div className="header-actions">{actions}</div>}
        </div>
        {subtitle && (
          <p className="grid-subtitle">{subtitle}</p>
        )}
      </div>
    </div>
  )
}