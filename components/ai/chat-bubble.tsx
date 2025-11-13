"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import dynamic from "next/dynamic"

const ProtectedChatPanel = dynamic(() => import("./protected-chat-panel").then((m) => ({ default: m.ProtectedChatPanel })), {
  ssr: false,
})

export function LiiratChatBubble() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel Card */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-[400px] rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl md:h-[600px] h-[520px] max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden min-h-0">
            <ProtectedChatPanel />
          </div>
        </div>
      )}
    </>
  )
}

