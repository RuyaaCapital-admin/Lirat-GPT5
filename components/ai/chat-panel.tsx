"use client"

import { useChatKit, ChatKit } from "@openai/chatkit-react"
import { chatkitOptions } from "@/lib/chatkitOptions"

export function LiiratChatPanel() {
  const { control } = useChatKit({
    ...chatkitOptions,
    api: {
      async getClientSecret(existing) {
        if (existing) return existing

        const res = await fetch("/api/chatkit/session", { method: "POST" })
        if (!res.ok) {
          const errorText = await res.text()
          console.error("ChatKit session failed:", res.status, errorText)
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
