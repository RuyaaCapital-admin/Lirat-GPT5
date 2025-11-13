"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase-client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientSupabase()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          router.push('/auth/login?error=Could not authenticate')
        } else {
          router.push('/ai')
          router.refresh()
        }
      } else {
        router.push('/auth/login')
      }
    }

    handleCallback()
  }, [searchParams, router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

