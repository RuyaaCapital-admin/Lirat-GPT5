"use client"

import dynamic from "next/dynamic"

const ProtectedChatPanel = dynamic(() => import("./protected-chat-panel").then((m) => ({ default: m.ProtectedChatPanel })), {
  ssr: false,
})

export function LiiratChatDesktop() {
  return (
    <div className="w-full h-full rounded-lg bg-zinc-900/80 border border-zinc-800 overflow-hidden flex flex-col">
      <ProtectedChatPanel />
    </div>
  )
}

