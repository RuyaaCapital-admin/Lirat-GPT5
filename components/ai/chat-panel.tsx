"use client"

import { useState, useEffect, useRef } from "react"
import { useChatKit, ChatKit } from "@openai/chatkit-react"
import { chatkitOptions } from "@/lib/chatkitOptions"
import { useAuth } from "@/contexts/auth-context"
import { createClientSupabase } from "@/lib/supabase-client"

function ChatKitWrapper() {
  const { user } = useAuth()
  const supabase = createClientSupabase()

  const { control } = useChatKit({
    ...chatkitOptions,
    api: {
      async getClientSecret(existing) {
        if (existing) return existing

        // Get the session token for authentication
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
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
          console.error("ChatKit session failed", errorText)
          throw new Error("Failed to create ChatKit session")
        }

        const { client_secret } = await res.json()
        return client_secret
      },
    },
  })

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
