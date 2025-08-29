import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'


export function useSavedTattoos() {
  const { user, profile } = useAuth()
  const [savedTattoos, setSavedTattoos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Get the correct user ID for database queries
  const getUserId = useCallback(() => {
    // Try profile.user_id first, then auth user.id as fallback
    if (profile?.user_id) return profile.user_id
    if (user?.id) return user.id
    return null
  }, [user, profile])

  // Load saved tattoos for current user
  const loadSavedTattoos = useCallback(async () => {
    const userId = getUserId()
    if (!userId) {
      setSavedTattoos(new Set())
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('saved_tattoos')
        .select('portfolio_item_id')
        .eq('user_id', userId)

      if (error) {
        console.error('Error loading saved tattoos:', error.message)
        return
      }

      const savedIds = new Set(data.map(item => item.portfolio_item_id))
      setSavedTattoos(savedIds)
    } catch (error) {
      console.error('Error loading saved tattoos:', error)
    } finally {
      setLoading(false)
    }
  }, [getUserId])

  // Save a tattoo
  const saveTattoo = useCallback(async (portfolioItemId: string) => {
    if (!user) {
      console.warn('User must be logged in to save tattoos')
      return false
    }

    try {
      const { error } = await supabase
        .from('saved_tattoos')
        .insert([
          {
            user_id: user.id,
            portfolio_item_id: portfolioItemId
          }
        ])

      if (error) {
        console.error('Error saving tattoo:', error.message)
        return false
      }

      // Update local state
      setSavedTattoos(prev => new Set([...prev, portfolioItemId]))
      return true
    } catch (error) {
      console.error('Error saving tattoo:', error)
      return false
    }
  }, [user])

  // Unsave a tattoo
  const unsaveTattoo = useCallback(async (portfolioItemId: string) => {
    const userId = getUserId()
    if (!userId) {
      console.warn('User must be logged in to unsave tattoos')
      return false
    }

    try {
      const { error } = await supabase
        .from('saved_tattoos')
        .delete()
        .eq('user_id', userId)
        .eq('portfolio_item_id', portfolioItemId)

      if (error) {
        console.error('Error unsaving tattoo:', error.message)
        return false
      }

      // Update local state
      setSavedTattoos(prev => {
        const newSet = new Set(prev)
        newSet.delete(portfolioItemId)
        return newSet
      })
      return true
    } catch (error) {
      console.error('Error unsaving tattoo:', error)
      return false
    }
  }, [getUserId])

  // Toggle save state
  const toggleSave = useCallback(async (portfolioItemId: string) => {
    const isSaved = savedTattoos.has(portfolioItemId)
    if (isSaved) {
      return await unsaveTattoo(portfolioItemId)
    } else {
      return await saveTattoo(portfolioItemId)
    }
  }, [savedTattoos, saveTattoo, unsaveTattoo])

  // Check if a tattoo is saved
  const isTattooSaved = useCallback((portfolioItemId: string) => {
    return savedTattoos.has(portfolioItemId)
  }, [savedTattoos])

  // Load saved tattoos on mount or user change
  useEffect(() => {
    loadSavedTattoos()
  }, [loadSavedTattoos])

  return {
    savedTattoos,
    loading,
    saveTattoo,
    unsaveTattoo,
    toggleSave,
    isTattooSaved,
    refreshSavedTattoos: loadSavedTattoos
  }
}