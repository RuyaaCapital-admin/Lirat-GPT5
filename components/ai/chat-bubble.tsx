"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"
import dynamic from "next/dynamic"

const ProtectedChatPanel = dynamic(() => import("./protected-chat-panel").then((m) => ({ default: m.ProtectedChatPanel })), {
  ssr: false,
})

export function LiiratChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    // Handle mobile keyboard appearance
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight
      const heightDiff = windowHeight - viewportHeight
      setKeyboardHeight(heightDiff > 150 ? heightDiff : 0) // Only consider it keyboard if > 150px difference
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
    } else {
      window.addEventListener("resize", handleResize)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
      } else {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  // Calculate panel height based on keyboard
  const panelHeight = keyboardHeight > 0 
    ? `calc(100vh - ${keyboardHeight}px - 5rem)` 
    : "calc(100vh - 7rem)"

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        style={{ 
          bottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : '24px'
        }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel Card */}
      {isOpen && (
        <div 
          className="fixed right-6 z-40 w-[90vw] max-w-[400px] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden"
          style={{
            height: panelHeight,
            bottom: keyboardHeight > 0 ? `${keyboardHeight + 88}px` : '88px',
            maxHeight: panelHeight,
          }}
        >
          <div className="flex-1 overflow-hidden min-h-0">
            <ProtectedChatPanel />
          </div>
        </div>
      )}
    </>
  )
}

