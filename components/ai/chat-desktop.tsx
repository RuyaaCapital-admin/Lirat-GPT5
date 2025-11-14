"use client"

import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const ProtectedChatPanel = dynamic(() => import("./protected-chat-panel").then((m) => ({ default: m.ProtectedChatPanel })), {
  ssr: false,
})

export function LiiratChatDesktop({ className }: { className?: string }) {
  return (
    <div className={cn("h-full w-full overflow-hidden", className)}>
      <ProtectedChatPanel />
    </div>
  )
}

