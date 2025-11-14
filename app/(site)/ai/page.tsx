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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="shrink-0 rounded-3xl border border-border/40 bg-card/70 px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">🤖</div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{getTranslation(locale, "ai")}</h1>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "مساحتك لرؤية الرسم البياني والتصرف الفوري ومحادثة الوكيل الذكي في آنٍ واحد."
                    : "See the chart, fire quick actions, and chat with your trading agent all at once."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden flex-1 lg:grid lg:grid-cols-[320px_minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6 lg:py-6">
          <div className="rounded-3xl border border-border/60 bg-card/70 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur flex flex-col">
            <div className="space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-muted-foreground">
                {locale === "ar" ? "أوامر سريعة" : "Quick actions"}
              </p>
              <QuickActions onActionClick={handleQuickAction} />
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 shadow-[0_32px_90px_rgba(15,23,42,0.18)] backdrop-blur overflow-hidden">
            <AiChartPlaceholder symbol={symbol} />
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 shadow-[0_32px_90px_rgba(15,23,42,0.22)] backdrop-blur overflow-hidden">
            <LiiratChatDesktop />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex-1 space-y-5 lg:hidden">
          <div className="rounded-3xl border border-border/50 bg-card/70 shadow-lg">
            <AiChartPlaceholder symbol={symbol} />
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/50 shadow-md p-4">
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        </div>

        <div className="pt-6 lg:hidden">
          <LiiratChatBubble />
        </div>
      </div>
    </div>
  )
}
