import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Browser client for client components
export function createClientSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build if env vars are missing
    // This allows the build to succeed, but will fail at runtime if actually used
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: new Error('Missing Supabase environment variables') }),
        signInWithOAuth: async () => ({ error: new Error('Missing Supabase environment variables') }),
        signInWithPassword: async () => ({ error: new Error('Missing Supabase environment variables') }),
        signUp: async () => ({ error: new Error('Missing Supabase environment variables') }),
        signOut: async () => ({ error: new Error('Missing Supabase environment variables') }),
        resetPasswordForEmail: async () => ({ error: new Error('Missing Supabase environment variables') }),
        updateUser: async () => ({ error: new Error('Missing Supabase environment variables') }),
        exchangeCodeForSession: async () => ({ error: new Error('Missing Supabase environment variables') }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    } as any
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
