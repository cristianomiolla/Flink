import { PostgrestError } from '@supabase/supabase-js'

/**
 * Standardized error handling for Supabase operations
 */
export const handleSupabaseError = (error: PostgrestError | Error | null, fallbackMessage: string): string => {
  if (!error) return ''
  
  console.error(fallbackMessage, error)
  
  // Handle Supabase PostgrestError
  if ('code' in error && error.message) {
    return error.message
  }
  
  // Handle generic Error
  if (error.message) {
    return error.message
  }
  
  return fallbackMessage
}

/**
 * Generic error boundary for async operations
 */
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const errorMsg = handleSupabaseError(error as Error, errorMessage)
    return { data: null, error: errorMsg }
  }
}

/**
 * Custom hook for error state management
 */
import { useState, useCallback } from 'react'

export interface ErrorState {
  error: string | null
  isError: boolean
  setError: (error: string | null) => void
  clearError: () => void
}

export const useErrorState = (): ErrorState => {
  const [error, setError] = useState<string | null>(null)
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  return {
    error,
    isError: !!error,
    setError,
    clearError
  }
}