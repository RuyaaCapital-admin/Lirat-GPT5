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
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-primary to-emerald-400 text-primary-foreground shadow-[0_18px_45px_rgba(16,185,129,0.45)] transition-all hover:scale-110 focus:outline-none"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        style={{
          bottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : "24px",
        }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel Card */}
      {isOpen && (
        <div 
          className="fixed right-6 z-40 flex w-[90vw] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/95 shadow-[0_35px_100px_rgba(15,23,42,0.15)] dark:border-emerald-500/25 dark:bg-linear-to-b dark:from-[#0b1a12] dark:via-[#0f2418] dark:to-[#0a140e] dark:shadow-[0_30px_100px_rgba(5,10,7,0.85)]"
          style={{
            height: panelHeight,
            bottom: keyboardHeight > 0 ? `${keyboardHeight + 88}px` : "88px",
            maxHeight: panelHeight,
          }}
        >
          <div className="flex items-center justify-between border-b border-emerald-100/70 px-5 py-3 text-sm font-medium text-foreground/80 dark:border-white/5 dark:text-white/70">
            <div className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-[0.4em] text-primary/80">Liirat AI</span>
              <span className="text-[11px] text-muted-foreground">Anytime market companion</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.35em] text-emerald-400/80">{isOpen ? "Live" : ""}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200/70 text-emerald-700 transition hover:bg-emerald-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ProtectedChatPanel />
          </div>
        </div>
      )}
    </>
  )
}

