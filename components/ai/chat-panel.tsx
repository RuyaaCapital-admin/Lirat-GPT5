"use client"

import { useEffect, useRef, useState } from "react"
import { chatkitOptions } from "@/lib/chatkitOptions"

declare global {
  interface Window {
    ChatKit?: any
  }
}

export function LiiratChatPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const chatkitInstanceRef = useRef<any>(null)
  const maxRetries = 50 // 5 seconds max wait for script
  const retryCountRef = useRef(0)

  useEffect(() => {
    // Wait for ChatKit script to load
    const checkChatKit = () => {
      if (typeof window === "undefined") return

      if (window.ChatKit) {
        setIsReady(true)
        setIsLoading(false)
      } else {
        retryCountRef.current += 1
        if (retryCountRef.current >= maxRetries) {
          setError("ChatKit script failed to load. Please refresh the page.")
          setIsLoading(false)
          return
        }
        setTimeout(checkChatKit, 100)
      }
    }

    // Start checking after a small delay to ensure script has time to load
    const timeout = setTimeout(checkChatKit, 100)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!isReady || !containerRef.current || error) return

    let isMounted = true

    const initializeChatKit = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch client secret
        const res = await fetch("/api/chatkit/session", { method: "POST" })
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error("ChatKit session failed:", res.status, errorText)
          throw new Error(`Failed to create ChatKit session: ${res.status} ${errorText}`)
        }

        const data = await res.json()
        
        if (!data.client_secret) {
          throw new Error("No client_secret in response")
        }

        // Initialize ChatKit
        if (window.ChatKit && containerRef.current && isMounted) {
          const chatkit = new window.ChatKit({
            ...chatkitOptions,
            clientSecret: data.client_secret,
            container: containerRef.current,
          })

          chatkitInstanceRef.current = chatkit
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Failed to initialize ChatKit:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load chat. Please refresh.")
          setIsLoading(false)
        }
      }
    }

    initializeChatKit()

    return () => {
      isMounted = false
      if (chatkitInstanceRef.current) {
        try {
          chatkitInstanceRef.current.destroy?.()
          chatkitInstanceRef.current = null
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [isReady, error])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="text-sm text-red-400">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Refresh page
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !isReady) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading chat...</div>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}
