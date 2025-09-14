import { createClient } from '@supabase/supabase-js'

// Use environment variables in development, fallback to hardcoded values in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shzouqqrxebzrqtkynqg.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoem91cXFyeGVienJxdGt5bnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDc3MjksImV4cCI6MjA3MTUyMzcyOX0.vWu0hP3sQqVQCXwG1SsGadCnzCVy3DCgdgbemxFogWQ'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})