import type { PortfolioItem } from '../types/portfolio'

/**
 * Sorting utilities for portfolio items
 */
export type SortType = 'likes' | 'date' | 'alphabetical'

export const sortPortfolioItems = (items: PortfolioItem[], sortBy: SortType): PortfolioItem[] => {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'likes':
        return (b.like_count ?? 0) - (a.like_count ?? 0)
      
      case 'date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      
      case 'alphabetical':
        return (a.title || '').localeCompare(b.title || '')
      
      default:
        return 0
    }
  })
}

/**
 * Specialized sorting functions for common use cases
 */
export const sortByMostLiked = (items: PortfolioItem[]): PortfolioItem[] => 
  sortPortfolioItems(items, 'likes')

export const sortByMostRecent = (items: PortfolioItem[]): PortfolioItem[] => 
  sortPortfolioItems(items, 'date')

export const sortByTitle = (items: PortfolioItem[]): PortfolioItem[] => 
  sortPortfolioItems(items, 'alphabetical')

/**
 * Filter and sort utility
 */
export const filterAndSortItems = (
  items: PortfolioItem[],
  filters: {
    isFlash?: boolean | null
    searchTerm?: string
    location?: string
  },
  sortBy: SortType = 'date'
): PortfolioItem[] => {
  let filtered = items

  // Apply flash filter
  if (filters.isFlash !== null && filters.isFlash !== undefined) {
    filtered = filtered.filter(item => item.is_flash === filters.isFlash)
  }

  // Apply search filter
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase()
    filtered = filtered.filter(item => 
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  // Apply location filter
  if (filters.location) {
    const locationLower = filters.location.toLowerCase()
    filtered = filtered.filter(item =>
      item.location?.toLowerCase().includes(locationLower)
    )
  }

  return sortPortfolioItems(filtered, sortBy)
}