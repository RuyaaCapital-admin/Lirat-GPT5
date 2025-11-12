"use client"

import { useState } from "react"
import { TradingChart } from "@/components/charts/trading-chart"
import { MarketStats } from "@/components/charts/market-stats"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

export default function MarketsPage() {
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState("1h")
  const { locale } = useLocale()

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "markets")}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "رسوم بيانية تداول متقدمة مع بيانات في الوقت الفعلي وميزات يمكن التحكم فيها بالذكاء الاصطناعي"
            : "Advanced trading charts with real-time data and AI-controllable features"}
        </p>
      </div>

      {/* Market Stats */}
      <MarketStats currentSymbol={symbol} />

      {/* Trading Chart */}
      <TradingChart symbol={symbol} onSymbolChange={setSymbol} timeframe={timeframe} onTimeframeChange={setTimeframe} />
    </div>
  )
}
