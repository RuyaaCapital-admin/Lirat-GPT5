"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import TradingViewChart from "@/components/ai/tradingview-chart"
import { cn } from "@/lib/utils"

type ChartTimeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d"

const TIMEFRAME_OPTIONS: ChartTimeframe[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"]

type ChartProps = {
  symbol: string
  timeframe: ChartTimeframe
  onSymbolChange: (next: string) => void
  onTimeframeChange: (next: ChartTimeframe) => void
}

export function AiChartPlaceholder({ symbol, timeframe, onSymbolChange, onTimeframeChange }: ChartProps) {
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark" || theme === "dark"
  const [draftSymbol, setDraftSymbol] = useState(symbol)

  useEffect(() => {
    setDraftSymbol(symbol)
  }, [symbol])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draftSymbol.trim()) return
    onSymbolChange(draftSymbol.trim().toUpperCase())
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-[32px] border px-6 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition",
        isDark ? "border-emerald-500/20 bg-[#0d1b13]" : "border-emerald-100 bg-white"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
            {isDark ? "جلسة الرسم" : "Chart focus"}
          </p>
          <h3 className="text-2xl font-semibold text-foreground">{symbol}</h3>
          <p className="text-xs text-muted-foreground">{timeframe.toUpperCase()} • {isDark ? "محدث" : "Live snapshot"}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-2xl border border-emerald-100/70 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
          <input
            value={draftSymbol}
            onChange={(event) => setDraftSymbol(event.target.value)}
            className="w-28 bg-transparent text-sm font-semibold uppercase tracking-wide text-foreground placeholder:text-muted-foreground focus:outline-none dark:text-white"
            placeholder="AAPL"
            maxLength={10}
          />
          <button
            type="submit"
            className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-primary"
          >
            Go
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
        {TIMEFRAME_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onTimeframeChange(option)}
            className={cn(
              "rounded-full border px-3 py-1 transition",
              option === timeframe
                ? isDark
                  ? "border-primary/50 bg-primary/20 text-primary"
                  : "border-primary bg-primary/10 text-primary"
                : isDark
                  ? "border-white/10 text-white/60 hover:border-white/20"
                  : "border-emerald-100 text-emerald-900 hover:border-emerald-200"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-[28px] border border-emerald-100/60 bg-white/80 dark:border-white/10 dark:bg-[#0a1410]/85">
        <TradingViewChart symbol={symbol} timeframe={timeframe} />
      </div>
    </div>
  )
}

