"use client"

import dynamic from "next/dynamic"

const LiiratChatPanel = dynamic(() => import("./chat-panel").then((m) => ({ default: m.LiiratChatPanel })), {
  ssr: false,
})

export function LiiratChatDesktop() {
  return (
    <div className="w-full h-[650px] rounded-3xl bg-zinc-900/80 border border-zinc-800 overflow-hidden">
      <LiiratChatPanel />
    </div>
  )
}

