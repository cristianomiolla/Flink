import type { ReactNode } from 'react'
import './GridHeader.css'

interface GridHeaderProps {
  title: string
  subtitle?: string
  searchInfo?: ReactNode
  actions?: ReactNode
  className?: string
}

export function GridHeader({ title, subtitle, searchInfo, actions, className = '' }: GridHeaderProps) {
  return (
    <div className={`page-header ${className}`}>
      <div className="header-card">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        {searchInfo}
        {actions && <div className="header-actions">{actions}</div>}
      </div>
    </div>
  )
}

interface GridStatsProps {
  count: number
  label: string
}

export function GridStats({ count, label }: GridStatsProps) {
  return (
    <div className="grid-header-stats">
      <span className="grid-stat-count">{count}</span>
      <span className="grid-stat-label">{label}</span>
    </div>
  )
}

interface GridActionsProps {
  children: ReactNode
}

export function GridActions({ children }: GridActionsProps) {
  return (
    <div className="grid-header-actions">
      {children}
    </div>
  )
}

interface GridSearchInfoProps {
  searchTerm?: string
  locationFilter?: string
}

export function GridSearchInfo({ searchTerm, locationFilter }: GridSearchInfoProps) {
  if (!searchTerm && !locationFilter) return null
  
  return (
    <div className="search-info">
      {searchTerm && <span className="search-term">"{searchTerm}"</span>}
      {locationFilter && <span className="location-term">{locationFilter}</span>}
    </div>
  )
}