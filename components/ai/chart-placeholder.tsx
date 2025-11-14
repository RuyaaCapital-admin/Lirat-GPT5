"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"
import TradingViewChart from "@/components/ai/tradingview-chart"
import { cn } from "@/lib/utils"

export function AiChartPlaceholder({ symbol = "AAPL" }: { symbol?: string }) {
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark" || theme === "dark"
  const [useTradingView, setUseTradingView] = useState(false)
  const [wsError, setWsError] = useState(false)

  // Check if WebSocket fails (simulate check after a delay)
  useEffect(() => {
    // Check for WebSocket errors in console or network
    const checkWebSocket = () => {
      // If WebSocket fails, fallback to TradingView
      // This is a simple check - in production you'd check actual WebSocket connection
      const timer = setTimeout(() => {
        // For now, always use TradingView as fallback since WebSocket chart is disabled
        setUseTradingView(true)
      }, 2000)

      return () => clearTimeout(timer)
    }

    checkWebSocket()
  }, [])

  return (
    <ModernPanel
      className={cn(
        "h-full overflow-hidden border shadow-xl flex flex-col",
        isDark
          ? "border-slate-800/60 bg-slate-900/80"
          : "border-slate-200/70 bg-white/95"
      )}
    >
      <ModernPanelHeader className="shrink-0">
        <ModernPanelTitle className={cn(isDark ? "text-slate-100" : "text-slate-900")}>
          {symbol} Chart
        </ModernPanelTitle>
      </ModernPanelHeader>
      <ModernPanelContent className="p-0 flex-1 min-h-0">
        {useTradingView ? (
          <div className="relative h-full w-full overflow-hidden rounded-b-3xl border-t flex items-center justify-center"
            style={{
              borderColor: isDark ? "rgba(51, 65, 85, 0.6)" : "rgba(226, 232, 240, 0.7)"
            }}
          >
            <TradingViewChart symbol={symbol} />
          </div>
        ) : (
          <div
            className={cn(
              "relative h-full w-full overflow-hidden rounded-b-3xl border-t flex items-center justify-center",
              isDark
                ? "border-slate-800/60 bg-slate-900/50"
                : "border-slate-200/70 bg-slate-50/50"
            )}
          >
            <div className="text-center space-y-2">
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-slate-300" : "text-slate-600"
              )}>Loading chart...</p>
            </div>
          </div>
        )}
      </ModernPanelContent>
    </ModernPanel>
  )
}

