import { useState, useEffect } from 'react'
import './CategoryBar.css'

interface CategoryBarProps {
  onCategoryChange?: (category: string) => void
  onViewModeChange?: (mode: 'portfolio' | 'artists') => void
  viewMode?: 'portfolio' | 'artists'
  searchSource?: 'search-bar' | 'category' | null
}

const categories = [
  'NEOREALISMO',
  'OLD SCHOOL',
  'NEW SCHOOL', 
  'REALISMO',
  'TRIBALE',
  'GIAPPONESE',
  'BLACKWORK',
  'MINIMALISTA',
  'WATERCOLOR',
  'GEOMETRICO'
]

export function CategoryBar({ 
  onCategoryChange, 
  onViewModeChange, 
  viewMode = 'portfolio', 
  searchSource 
}: CategoryBarProps) {
  const [activeCategory, setActiveCategory] = useState('')

  // Reset active category only when search comes from search bar
  useEffect(() => {
    if (searchSource === 'search-bar') {
      setActiveCategory('')
    }
  }, [searchSource])

  const handleCategoryClick = (category: string) => {
    const newCategory = activeCategory === category ? '' : category
    setActiveCategory(newCategory)
    onCategoryChange?.(newCategory)
  }

  const handleViewModeClick = (mode: 'portfolio' | 'artists') => {
    onViewModeChange?.(mode)
  }

  return (
    <section className="category-bar">
      <div className="container">
        <div className="category-content">
          <div className="category-filters">
            <div className="category-tags">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-tag ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'portfolio' ? 'active' : ''}`}
              onClick={() => handleViewModeClick('portfolio')}
            >
              Opere
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'artists' ? 'active' : ''}`}
              onClick={() => handleViewModeClick('artists')}
            >
              Artisti
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}