import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

// Only create client if we have the required env vars (allows build to succeed)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any // Type assertion for build-time safety

// Server-side client (for API routes)
export const createServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !anonKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  }
  
  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  console.warn('SUPABASE_SERVICE_ROLE_KEY not set, using anon key')
  return createClient(url, anonKey)
}

