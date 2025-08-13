"use client"

import { useRef } from "react"
import { ChatInterface } from "@/components/ai/chat-interface"
import { QuickActions } from "@/components/ai/quick-actions"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

export default function AIPage() {
  const { locale } = useLocale()
  const chatRef = useRef<any>(null)

  const handleQuickAction = (message: string) => {
    if (chatRef.current && chatRef.current.sendMessage) {
      chatRef.current.sendMessage(message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "ai")}</h1>
        <p className="text-muted-foreground break-words">
          Your intelligent trading assistant powered by advanced AI. Get market insights, control charts, and receive
          personalized trading advice.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <ChatInterface ref={chatRef} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <QuickActions onActionClick={handleQuickAction} />

          {/* AI Capabilities */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-3 truncate">AI Capabilities</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="break-words">Real-time market analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="break-words">Chart control and level setting</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="break-words">Trading strategy recommendations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="break-words">Risk management advice</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="break-words">Economic event analysis</span>
              </div>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="font-semibold mb-3 truncate">Usage Tips</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="break-words">• Ask specific questions about market trends</p>
              <p className="break-words">• Request chart modifications like "add support at 2050"</p>
              <p className="break-words">• Get strategy advice for different market conditions</p>
              <p className="break-words">• Analyze economic events and their impact</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
