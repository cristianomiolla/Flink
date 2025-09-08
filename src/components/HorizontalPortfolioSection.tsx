import { useRef, useState, useEffect } from 'react'
import { type PortfolioItem } from '../types/portfolio'
import { PortfolioCard } from './PortfolioCard'
import './HorizontalPortfolioSection.css'
import './TabHeader.css'

interface HorizontalPortfolioSectionProps {
  title: string
  items: PortfolioItem[]
  onArtistClick?: (artistId: string) => void
  onAuthRequired?: () => void
  onContactArtist?: (artistId: string) => void
  onShowMore?: () => void
  onEdit?: (itemId: string) => void
  onDelete?: (itemId: string) => void
}

export function HorizontalPortfolioSection({ 
  title, 
  items, 
  onArtistClick, 
  onAuthRequired, 
  onContactArtist,
  onShowMore,
  onEdit,
  onDelete
}: HorizontalPortfolioSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const updateArrowVisibility = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollLeft = container.scrollLeft
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1) // -1 for rounding tolerance
    }
  }

  useEffect(() => {
    updateArrowVisibility()
  }, [items])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateArrowVisibility)
      return () => container.removeEventListener('scroll', updateArrowVisibility)
    }
  }, [])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 300 // Approximate card width + gap
      scrollContainerRef.current.scrollBy({
        left: -cardWidth * 3, // Scroll by 3 cards
        behavior: 'smooth'
      })
      // Update arrow visibility after scroll animation
      setTimeout(updateArrowVisibility, 300)
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 300 // Approximate card width + gap
      scrollContainerRef.current.scrollBy({
        left: cardWidth * 3, // Scroll by 3 cards
        behavior: 'smooth'
      })
      // Update arrow visibility after scroll animation
      setTimeout(updateArrowVisibility, 300)
    }
  }

  return (
    <section className="horizontal-section">
      <div className="container">
        <div className="tab-header">
          <h3>{title}</h3>
          <button className="action-btn" onClick={onShowMore}>
            <span className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 5v14m7-7l-7-7-7 7"></path>
              </svg>
            </span>
            <span className="action-text">Mostra di più</span>
          </button>
        </div>
        
        <div className="horizontal-scroll-container">
          {showLeftArrow && (
            <button 
              className="scroll-arrow scroll-arrow-left"
              onClick={scrollLeft}
              aria-label="Scorri a sinistra"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
            </button>
          )}
          
          <div 
            ref={scrollContainerRef}
            className="horizontal-portfolio-grid"
          >
            {items.slice(0, 12).map((item) => (
              <div key={item.id} className="horizontal-card-wrapper">
                <PortfolioCard 
                  item={item}
                  onArtistClick={onArtistClick}
                  onAuthRequired={onAuthRequired}
                  onContactArtist={onContactArtist}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
          
          {showRightArrow && (
            <button 
              className="scroll-arrow scroll-arrow-right"
              onClick={scrollRight}
              aria-label="Scorri a destra"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}