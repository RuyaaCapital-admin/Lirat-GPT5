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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-background via-background to-primary/5" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header - Fixed at top */}
      <div className="shrink-0 px-4 py-4 border-b border-border/50 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {getTranslation(locale, "ai")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "مساعدك الذكي للتداول مع رؤى السوق والتحكم في الرسوم البيانية والمشورة المخصصة"
              : "Your intelligent trading assistant powered by advanced AI. Get market insights, control charts, and receive personalized trading advice."}
          </p>
        </div>
      </div>

      {/* Main Content - Fixed layout for desktop */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Desktop: Split view with chart, quick actions, and chat */}
        <div className="hidden lg:grid lg:grid-cols-12 h-full gap-5 p-6">
          {/* Left: Chart (60%) */}
          <div className="lg:col-span-7 h-full min-h-0">
            <div className="h-full rounded-3xl border border-border/70 bg-card/60 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur">
              <AiChartPlaceholder symbol={symbol} />
            </div>
          </div>

          {/* Right: Quick Actions + Chat (40%) */}
          <div className="lg:col-span-5 flex h-full min-h-0 flex-col gap-5">
            {/* Quick Actions - Scrollable */}
            <div className="rounded-3xl border border-border/60 bg-card/40 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur overflow-hidden">
              <div className="max-h-[320px] overflow-y-auto p-5">
                <QuickActions onActionClick={handleQuickAction} />
              </div>
            </div>

            {/* Chat - Takes remaining space */}
            <div className="flex-1 min-h-0 rounded-3xl border border-border/70 bg-card/70 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur overflow-hidden">
              <div className="h-full">
                <LiiratChatDesktop />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Stacked layout */}
        <div className="lg:hidden h-full overflow-y-auto px-4 pb-20 pt-4 space-y-4">
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-card/60 shadow-lg overflow-hidden">
              <AiChartPlaceholder symbol={symbol} />
            </div>
            <div className="rounded-3xl border border-border/60 bg-card/40 shadow-md p-4">
              <QuickActions onActionClick={handleQuickAction} />
            </div>
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
