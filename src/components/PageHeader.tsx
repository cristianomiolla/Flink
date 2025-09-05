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
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        {actions && <div className="header-actions">{actions}</div>}
      </div>
    </div>
  )
}