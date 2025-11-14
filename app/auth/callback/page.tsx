"use client"

import { useEffect, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase-client'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientSupabase()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        // Check for OAuth errors
        if (errorParam) {
          const errorMessage = errorDescription || errorParam || 'Authentication failed'
          console.error('[Auth Callback] OAuth error:', errorMessage)
          router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
          return
        }
        
        if (!code) {
          console.warn('[Auth Callback] No code found')
          router.push('/auth/login?error=No authorization code received')
          return
        }

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('[Auth Callback] Exchange error:', exchangeError)
          setError(exchangeError.message)
          router.push(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
          return
        }

        if (!data.session) {
          console.error('[Auth Callback] No session after exchange')
          router.push('/auth/login?error=Session not created')
          return
        }

        // Wait a bit for the auth context to update
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Verify session is set
        const { data: { session: verifiedSession } } = await supabase.auth.getSession()
        
        if (!verifiedSession) {
          console.error('[Auth Callback] Session verification failed')
          router.push('/auth/login?error=Session verification failed')
          return
        }

        // Success - redirect to AI page
        console.log('[Auth Callback] Authentication successful, redirecting to /ai')
        window.location.href = '/ai' // Use window.location for full page reload to ensure auth state is updated
      } catch (err) {
        console.error('[Auth Callback] Unexpected error:', err)
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
      }
    }

    handleCallback()
  }, [searchParams, router, supabase])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}

