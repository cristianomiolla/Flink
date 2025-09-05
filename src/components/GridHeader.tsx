import type { ReactNode } from 'react'
import './GridHeader.css'

interface GridHeaderProps {
  title: string
  children?: ReactNode
  className?: string
  actions?: ReactNode
}

export function GridHeader({ title, children, className = '', actions }: GridHeaderProps) {
  return (
    <div className={`grid-header ${className}`}>
      <div className="grid-header-card">
        {actions && (
          <div className="grid-header-top-actions">
            {actions}
          </div>
        )}
        <h2 className="grid-header-title">{title}</h2>
        <div className="grid-header-content">
          {children}
        </div>
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
    <div className="grid-search-info">
      {searchTerm && <span className="grid-search-term">"{searchTerm}"</span>}
      {locationFilter && <span className="grid-location-term">{locationFilter}</span>}
    </div>
  )
}