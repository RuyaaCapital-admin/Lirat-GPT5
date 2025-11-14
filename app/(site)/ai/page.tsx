"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { QuickActions } from "@/components/ai/quick-actions"
import { AiChartPlaceholder } from "@/components/ai/chart-placeholder"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

// Dynamically import ChatKit components with SSR disabled to prevent hydration errors
const LiiratChatBubble = dynamic(
  () => import("@/components/ai/chat-bubble").then((mod) => ({ default: mod.LiiratChatBubble })),
  {
    ssr: false,
    loading: () => null,
  }
)

const LiiratChatDesktop = dynamic(
  () => import("@/components/ai/chat-desktop").then((mod) => ({ default: mod.LiiratChatDesktop })),
  {
    ssr: false,
    loading: () => null,
  }
)

const CHART_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const
type ChartTimeframe = (typeof CHART_TIMEFRAMES)[number]

export default function AIPage() {
  const { locale } = useLocale()
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1h")

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedSymbol = window.localStorage.getItem("ai-chart-symbol")
    const storedTimeframe = window.localStorage.getItem("ai-chart-timeframe")
    if (storedSymbol) {
      setSymbol(storedSymbol)
    }
    if (storedTimeframe && (CHART_TIMEFRAMES as readonly string[]).includes(storedTimeframe)) {
      setTimeframe(storedTimeframe as ChartTimeframe)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("ai-chart-symbol", symbol)
  }, [symbol])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("ai-chart-timeframe", timeframe)
  }, [timeframe])

  const handleQuickAction = (message: string) => {
    // Quick actions can be handled by ChatKit when it's ready
    console.log("Quick action:", message)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header - Fixed at top */}
      <div className="shrink-0 px-4 py-3 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{getTranslation(locale, "ai")}</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {locale === "ar"
              ? "مساعدك الذكي للتداول مع رؤى السوق والتحكم في الرسوم البيانية والمشورة المخصصة"
              : "Your intelligent trading assistant powered by advanced AI. Get market insights, control charts, and receive personalized trading advice."}
          </p>
        </div>
      </div>

      {/* Main Content - Fixed layout for desktop */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: Split view with chart, quick actions, and chat */}
        <div className="hidden lg:grid lg:grid-cols-12 h-full gap-4 p-4">
          {/* Left: Chart (60%) */}
          <div className="lg:col-span-7 h-full overflow-hidden">
            <AiChartPlaceholder />
          </div>

          {/* Right: Quick Actions + Chat (40%) */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
            {/* Quick Actions - Scrollable */}
            <div className="shrink-0 overflow-y-auto">
              <QuickActions onActionClick={handleQuickAction} />
            </div>

            {/* Chat - Takes remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <LiiratChatDesktop />
            </div>
          </div>
        </div>

        {/* Mobile: Stacked layout */}
        <div className="lg:hidden h-full overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            <AiChartPlaceholder />
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        </div>
      </div>

      {/* Mobile: Floating bubble (fixed position) */}
      <div className="lg:hidden">
        <LiiratChatBubble />
      </div>
    </div>
  )
}
