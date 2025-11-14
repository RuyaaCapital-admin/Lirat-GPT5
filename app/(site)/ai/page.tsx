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
    <div
      className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-[#f5f8f4] via-background to-[#eaf2eb] dark:from-[#080f0b] dark:via-[#0d1a13] dark:to-[#08100b]"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/50 bg-card/80 px-6 py-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/5 dark:bg-card/50 dark:shadow-[0_28px_80px_rgba(5,10,7,0.85)]">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-50 lg:block" aria-hidden="true">
            <div className="h-full rounded-3xl bg-linear-to-br from-primary/25 via-transparent to-transparent blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/30 to-emerald-400/40 text-3xl shadow-[0_18px_40px_rgba(57,179,107,0.35)]">
                🤖
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {getTranslation(locale, "ai")}
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">
                  {locale === "ar"
                    ? "راقب الرسوم، نفّذ أوامر ذكية وتحدث مع وكيلك في مساحة واحدة."
                    : "Track charts, fire playbooks, and talk to your agent in a single space."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden flex-1 lg:grid lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)] lg:gap-6">
          <div className="flex flex-col gap-6">
            <AiChartPlaceholder
              symbol={symbol}
              timeframe={timeframe}
              onSymbolChange={setSymbol}
              onTimeframeChange={setTimeframe}
            />
            <div className="rounded-[32px] border border-border/60 bg-card/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#101f17]/85">
              <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                <span>{locale === "ar" ? "مهام فورية" : "Quick actions"}</span>
                <span className="text-primary/80">⌘K</span>
              </div>
              <QuickActions onActionClick={handleQuickAction} />
            </div>
          </div>

          <div className="rounded-[36px] border border-border/50 bg-card/95 shadow-[0_32px_90px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#0a140f]/95 dark:shadow-[0_36px_95px_rgba(5,10,7,0.85)]">
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 text-sm text-muted-foreground dark:border-white/5">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-primary/80">{locale === "ar" ? "محادثة" : "Agent link"}</p>
                <p className="text-base font-semibold text-foreground">{locale === "ar" ? "مساعد ليرات" : "Liirat AI Desk"}</p>
              </div>
              <span className="rounded-full border border-primary/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
                {locale === "ar" ? "جاهز" : "Live"}
              </span>
            </div>
            <LiiratChatDesktop className="bg-transparent" />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex-1 space-y-5 lg:hidden">
          <div className="rounded-3xl border border-border/60 bg-card/80 shadow-lg">
            <AiChartPlaceholder
              symbol={symbol}
              timeframe={timeframe}
              onSymbolChange={setSymbol}
              onTimeframeChange={setTimeframe}
            />
          </div>
          <div className="rounded-3xl border border-border/60 bg-card/70 shadow-md p-4">
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        </div>

        <div className="pt-4 lg:hidden">
          <LiiratChatBubble />
        </div>
      </div>
    </div>
  )
}
