"use client"

import { useState, useEffect, useRef } from "react"
import { useChatKit, ChatKit } from "@openai/chatkit-react"
import { chatkitOptions } from "@/lib/chatkitOptions"
import { useAuth } from "@/contexts/auth-context"
import { createClientSupabase } from "@/lib/supabase-client"

function ChatKitWrapper() {
  const { user } = useAuth()
  const supabase = createClientSupabase()
  const [error, setError] = useState<string | null>(null)

  const { control } = useChatKit({
    ...chatkitOptions,
    api: {
      async getClientSecret(existing) {
        try {
          if (existing) return existing

          // Get the session token for authentication
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            setError("Not authenticated. Please sign in.")
            throw new Error("Not authenticated")
          }

          // Include auth token in request
          const res = await fetch("/api/chatkit/session", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          })

          if (!res.ok) {
            const errorText = await res.text()
            let errorMessage = "Failed to create ChatKit session"
            try {
              const errorJson = JSON.parse(errorText)
              errorMessage = errorJson.error || errorMessage
            } catch {
              // Not JSON, use errorText as-is
            }
            console.error("ChatKit session failed", errorText)
            setError(errorMessage)
            throw new Error(errorMessage)
          }

          const data = await res.json()
          if (!data?.client_secret) {
            setError("Invalid session response")
            throw new Error("Invalid session response: missing client_secret")
          }

          setError(null) // Clear any previous errors
          return data.client_secret
        } catch (err) {
          // Error already set above, just rethrow
          throw err
        }
      },
    },
  })

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">Please refresh the page or try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ChatKit control={control} />
    </div>
  )
}

export function LiiratChatPanel() {
  const [isMounted, setIsMounted] = useState(false)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    // Only set mounted after component has mounted on client
    if (typeof window !== "undefined" && !hasMountedRef.current) {
      hasMountedRef.current = true
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsMounted(true)
      })
    }
  }, [])

  // Prevent hydration errors by only rendering ChatKit after client mount
  if (!isMounted || typeof window === "undefined") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading chat...</div>
      </div>
    )
  }

  return <ChatKitWrapper />
}
