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
  const chatkitInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Wait for ChatKit script to load
    const checkChatKit = () => {
      if (typeof window !== "undefined" && window.ChatKit) {
        setIsReady(true)
      } else {
        setTimeout(checkChatKit, 100)
      }
    }

    checkChatKit()
  }, [])

  useEffect(() => {
    if (!isReady || !containerRef.current) return

    const initializeChatKit = async () => {
      try {
        // Fetch client secret
        const res = await fetch("/api/chatkit/session", { method: "POST" })
        if (!res.ok) {
          throw new Error("Failed to create ChatKit session")
        }
        const { client_secret } = await res.json()

        // Initialize ChatKit
        if (window.ChatKit && containerRef.current) {
          const chatkit = new window.ChatKit({
            ...chatkitOptions,
            clientSecret: client_secret,
            container: containerRef.current,
          })

          chatkitInstanceRef.current = chatkit
        }
      } catch (error) {
        console.error("Failed to initialize ChatKit:", error)
      }
    }

    initializeChatKit()

    return () => {
      if (chatkitInstanceRef.current) {
        try {
          chatkitInstanceRef.current.destroy?.()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [isReady])

  if (!isReady) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading chat...</div>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}
