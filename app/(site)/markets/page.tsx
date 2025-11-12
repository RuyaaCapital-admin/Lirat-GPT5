"use client"

import { useState } from "react"
import { TradingChart } from "@/components/charts/trading-chart"
import { MarketStats } from "@/components/charts/market-stats"
import { ExchangeRatesPanel } from "@/components/dashboard/exchange-rates"
import { HomeNewsRail } from "@/components/dashboard/home-news"
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
            ? "لوحة متكاملة تجمع الأسعار السريعة، الرسوم المتقدمة، وأخبار اللحظة."
            : "A consolidated workspace for quick quotes, advanced charts, and real-time briefs."}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <MarketStats currentSymbol={symbol} />
          <TradingChart
            symbol={symbol}
            onSymbolChange={setSymbol}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>
        <div className="space-y-6">
          <ExchangeRatesPanel />
          <HomeNewsRail />
        </div>
      </div>
    </div>
  )
}
