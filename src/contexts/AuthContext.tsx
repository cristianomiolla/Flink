/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react'
import type { User, AuthError, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  username: string | null
  profile_type: 'client' | 'artist'
  bio: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      // data can be null if no profile found, which is valid
      return data as UserProfile | null
    } catch {
      console.error('Error fetching profile')
      return null
    }
  }


  useEffect(() => {
    let isMounted = true

    const handleAuthState = async (session: Session | null) => {
      if (!isMounted) return

      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const userProfile = await fetchUserProfile(session.user.id)
          
          if (isMounted) {
            setProfile(userProfile)
          }
        } catch {
          console.error('Error fetching user profile')
          if (isMounted) {
            setProfile(null)
          }
        }
      } else {
        setProfile(null)
      }
      
      if (isMounted) {
        setLoading(false)
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          // Token refreshed successfully
        } else if (event === 'SIGNED_OUT') {
          // User signed out
        }
        handleAuthState(session)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // Clear any stale local storage
    localStorage.removeItem('supabase.auth.token')
  }

  const refreshProfile = async () => {
    if (!user?.id) return
    
    try {
      const userProfile = await fetchUserProfile(user.id)
      setProfile(userProfile)
    } catch {
      console.error('Error refreshing user profile')
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}