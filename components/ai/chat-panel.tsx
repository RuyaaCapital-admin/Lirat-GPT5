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
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const { control } = useChatKit({
    ...chatkitOptions,
    api: {
      async getClientSecret(existing) {
        try {
          if (existing) {
            console.log("[ChatKit Client] Using existing client_secret")
            return existing
          }

          console.log("[ChatKit Client] Requesting new session...")
          
          // Get the session token for authentication
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            console.error("[ChatKit Client] Session error:", sessionError)
            setError("Session error. Please sign in again.")
            throw new Error("Session error")
          }
          
          if (!session) {
            console.error("[ChatKit Client] No session found")
            setError("Not authenticated. Please sign in.")
            throw new Error("Not authenticated")
          }

          console.log("[ChatKit Client] Session found, calling /api/chatkit/session")

          // Include auth token in request
          const res = await fetch("/api/chatkit/session", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          })

          console.log("[ChatKit Client] Session API response status:", res.status)

          if (!res.ok) {
            const errorText = await res.text()
            let errorMessage = "Failed to create ChatKit session"
            try {
              const errorJson = JSON.parse(errorText)
              errorMessage = errorJson.error || errorMessage
              console.error("[ChatKit Client] Session API error:", errorJson)
            } catch {
              console.error("[ChatKit Client] Session API error (non-JSON):", errorText)
            }
            setError(errorMessage)
            setDebugInfo(`Status: ${res.status}, Error: ${errorMessage}`)
            throw new Error(errorMessage)
          }

          const data = await res.json()
          console.log("[ChatKit Client] Session response received:", {
            hasClientSecret: !!data?.client_secret,
            keys: Object.keys(data || {}),
          })
          
          if (!data?.client_secret) {
            console.error("[ChatKit Client] Missing client_secret in response:", data)
            setError("Invalid session response")
            setDebugInfo("Response missing client_secret")
            throw new Error("Invalid session response: missing client_secret")
          }

          console.log("[ChatKit Client] Session created successfully")
          setError(null) // Clear any previous errors
          setDebugInfo(null)
          return data.client_secret
        } catch (err) {
          console.error("[ChatKit Client] getClientSecret error:", err)
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
          {debugInfo && (
            <p className="text-xs text-muted-foreground font-mono">{debugInfo}</p>
          )}
          <p className="text-xs text-muted-foreground">Please refresh the page or try again later.</p>
          <button
            onClick={() => {
              setError(null)
              setDebugInfo(null)
              window.location.reload()
            }}
            className="mt-2 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
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
