import { useState, useRef, useEffect } from 'react'
import { handleImageError, getSafeImageUrl } from '../lib/imageUtils'
import type { ArtistService } from '../types/portfolio'
import './ServiceCard.css'

interface ServiceCardProps {
  service: ArtistService
  showEditButton?: boolean
  onEdit?: (serviceId: string) => void
  onDelete?: (serviceId: string) => void
}

export function ServiceCard({ service, showEditButton = false, onEdit, onDelete }: ServiceCardProps) {
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleActionsToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActionsDropdown(!showActionsDropdown)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActionsDropdown(false)
    if (onEdit) {
      onEdit(service.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActionsDropdown(false)
    if (onDelete) {
      onDelete(service.id)
    }
  }

  const formatPrice = () => {
    if (service.pricing_type === 'range' && service.price_min !== null && service.price_max !== null) {
      return `€${service.price_min} - €${service.price_max}`
    } else if (service.pricing_type === 'fixed' && service.fixed_price !== null) {
      return `€${service.fixed_price}`
    } else if (service.pricing_type === 'consultation') {
      return 'Su consultazione'
    }
    return 'Prezzo su richiesta'
  }

  const hasDiscount = service.discount_percentage && service.discount_percentage > 0

  return (
    <article className="service-card-row">
      {/* Image Section - First for visual impact */}
      <div className="service-image-thumb">
        {service.image_url ? (
          <img 
            src={getSafeImageUrl(service.image_url)} 
            alt={service.name} 
            className="service-thumb-img"
            onError={handleImageError}
          />
        ) : (
          <div className="service-thumb-placeholder">
            <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="service-discount-badge">
            -{service.discount_percentage}%
          </span>
        )}
      </div>

      {/* Content Section - Main information */}
      <div className="service-row-content">
        {/* Service Name - Most prominent */}
        <h3 className="service-row-title">
          {service.name}
        </h3>

        {/* Description - Supporting information */}
        {service.description && (
          <p className="service-row-description">
            {service.description}
          </p>
        )}

        {/* Service Details - Additional context */}
        <div className="service-row-details">
          {service.body_area && (
            <span className="service-detail-tag">
              {service.body_area}
            </span>
          )}
          {service.size_category && (
            <span className="service-detail-tag">
              {service.size_category}
            </span>
          )}
        </div>
      </div>

      {/* Price Section - Key information, prominent placement */}
      <div className="service-row-price">
        {formatPrice()}
      </div>

      {/* Actions Dropdown - Secondary action, positioned last */}
      {showEditButton && (
        <div className="service-actions-dropdown" ref={dropdownRef}>
          <button 
            className="portfolio-edit-delete-btn" 
            onClick={handleActionsToggle}
            title="Modifica o elimina servizio"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          
          {showActionsDropdown && (
            <div className="service-actions-menu">
              <button 
                className="action-btn service-action-item"
                onClick={handleEdit}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="m18,2l4,4l-14,14h-4v-4L18,2z"></path>
                  <path d="m13,7l4,4"></path>
                </svg>
                <span>Modifica</span>
              </button>
              <button 
                className="action-btn service-action-item delete-action"
                onClick={handleDelete}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                <span>Elimina</span>
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}