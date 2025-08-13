"use client"

import { useState } from "react"
import { TradingChart } from "@/components/charts/trading-chart"
import { MarketStats } from "@/components/charts/market-stats"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

export default function MarketsPage() {
  const [symbol, setSymbol] = useState("XAUUSD")
  const [timeframe, setTimeframe] = useState("15m")
  const { locale } = useLocale()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "markets")}</h1>
        <p className="text-muted-foreground">
          Advanced trading charts with real-time data and AI-controllable features
        </p>
      </div>

      {/* Market Stats */}
      <MarketStats currentSymbol={symbol} />

      {/* Trading Chart */}
      <TradingChart symbol={symbol} onSymbolChange={setSymbol} timeframe={timeframe} onTimeframeChange={setTimeframe} />

      {/* AI Instructions */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="font-semibold mb-2">AI Control Instructions</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            • Use <code className="bg-muted px-1 rounded">ChartAPI.addLevel(price, title)</code> to add price levels
          </p>
          <p>
            • Use <code className="bg-muted px-1 rounded">ChartAPI.setSymbol(symbol)</code> to change instruments
          </p>
          <p>
            • Use <code className="bg-muted px-1 rounded">ChartAPI.setTimeframe(tf)</code> to change timeframes
          </p>
          <p>
            • Example: <code className="bg-muted px-1 rounded">ChartAPI.addLevel(2050, "Resistance")</code>
          </p>
        </div>
      </div>
    </div>
  )
}
