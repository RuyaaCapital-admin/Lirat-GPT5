"use client"

import { useEffect, useRef, useState } from "react"
import { QuickActions } from "@/components/ai/quick-actions"
import { AiChartPlaceholder, TIMEFRAME_OPTIONS, type ChartTimeframe } from "@/components/ai/chart-placeholder"
import { AgentChat, type AgentChatHandle } from "@/components/ai/agent-chat"
import { NotificationTray } from "@/components/notifications/notification-tray"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

export default function AIPage() {
  const { locale } = useLocale()
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1h")
  const agentRef = useRef<AgentChatHandle>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedSymbol = window.localStorage.getItem("ai-chart-symbol")
    const storedTimeframe = window.localStorage.getItem("ai-chart-timeframe")
    if (storedSymbol) {
      setSymbol(storedSymbol)
    }
    if (storedTimeframe && TIMEFRAME_OPTIONS.includes(storedTimeframe as ChartTimeframe)) {
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
      agentRef.current?.sendPrompt(message)
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

          <NotificationTray className="hidden lg:block" />

          <div className="flex flex-1 flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] lg:gap-6">
            <AgentChat ref={agentRef} className="order-2 min-h-[520px] lg:order-1" />
            <div className="order-1 flex flex-col gap-5 lg:order-2">
              <NotificationTray className="lg:hidden" />
              <div className="rounded-3xl border border-border/60 bg-card/80 shadow-lg">
                <AiChartPlaceholder
                  symbol={symbol}
                  timeframe={timeframe}
                  onSymbolChange={setSymbol}
                  onTimeframeChange={setTimeframe}
                />
              </div>
              <div className="rounded-[32px] border border-border/60 bg-card/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#101f17]/85">
                <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                  <span>{locale === "ar" ? "مهام فورية" : "Quick actions"}</span>
                  <span className="text-primary/80">⌘K</span>
                </div>
                <QuickActions onActionClick={handleQuickAction} />
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
