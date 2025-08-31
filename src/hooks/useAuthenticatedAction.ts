import { useCallback } from 'react'
import { useAuth } from './useAuth'

/**
 * Custom hook for handling authenticated actions
 * Provides a consistent way to check authentication and trigger auth overlay
 */
export function useAuthenticatedAction(onAuthRequired?: () => void) {
  const { user } = useAuth()

  const executeAction = useCallback(<T extends unknown[], R>(
    action: (...args: T) => R,
    ...args: T
  ): R | void => {
    if (!user) {
      onAuthRequired?.()
      return
    }
    return action(...args)
  }, [user, onAuthRequired])

  const checkAuthentication = useCallback((callback?: () => void): boolean => {
    if (!user) {
      onAuthRequired?.()
      callback?.()
      return false
    }
    return true
  }, [user, onAuthRequired])

  return {
    /** Execute an action only if user is authenticated */
    executeAction,
    /** Check if user is authenticated, trigger auth flow if not */
    checkAuthentication,
    /** Current authentication status */
    isAuthenticated: !!user
  }
}