"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { ModernPanel, ModernPanelHeader, ModernPanelTitle, ModernPanelContent } from "@/components/modern-panel"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PriceAlertButton } from "@/components/price-alert-button"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const majorSymbols = [
  "AAPL",
  "GOOGL",
  "MSFT",
  "TSLA",
  "BTCUSD",
  "ETHUSD",
  "XAUUSD",
  "XAGUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "NVDA",
]

export function MarketOverviewCard() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { locale } = useLocale()

  const fetchMarketData = async () => {
    setLoading(true)
    try {
      const promises = majorSymbols.map(async (symbol) => {
        const response = await fetch(`/api/fmp/quote?symbol=${symbol}`)
        if (response.ok) {
          return await response.json()
        }
        return null
      })

      const results = await Promise.all(promises)
      const validData = results.filter(Boolean)
      setMarketData(validData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to fetch market data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <ModernPanel>
      <ModernPanelHeader>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 shadow-[0_18px_50px_rgba(6,17,11,0.25)] dark:border-white/5 dark:bg-gradient-to-r dark:from-emerald-400/10 dark:via-emerald-400/5 dark:to-transparent">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -top-6 -left-8 h-16 w-16 rounded-full bg-emerald-400/30 blur-2xl" />
            <div className="absolute -bottom-8 right-0 h-20 w-20 rounded-full bg-emerald-500/20 blur-[120px]" />
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-emerald-200/40 bg-white/70 shadow-[0_0_18px_rgba(16,185,129,0.35)]">
                <Image src="/images/liirat-logo.png" alt="Liirat" fill className="object-contain p-1.5" />
              </div>
              <div>
                <ModernPanelTitle className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-900 dark:text-emerald-100">
                  {getTranslation(locale, "quickMarkets")}
                </ModernPanelTitle>
                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-900/70 dark:text-emerald-200/70">
                  {locale === "ar" ? "تحديث كل 30 ثانية" : "Refreshes every 30 seconds"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {locale === "ar" ? "آخر تحديث" : "Last updated"} {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <Button variant="ghost" size="sm" onClick={fetchMarketData} disabled={loading} className="h-8 w-8 rounded-full border border-white/40 bg-white/40 p-0 text-emerald-900 hover:bg-white/70 dark:border-white/10 dark:bg-white/20 dark:text-emerald-100">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </ModernPanelHeader>
      <ModernPanelContent>
        <div className="space-y-3">
          {loading && marketData.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-pulse">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="flex space-x-3">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            marketData.map((market) => (
                <div
                  key={market.symbol}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted/70"
                >
                  <div className="font-medium font-mono">{market.symbol}</div>
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm">
                      {market.price !== undefined ? `$${market.price.toFixed(2)}` : "—"}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        (market.changePercent || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {(market.changePercent || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {(market.changePercent || 0) >= 0 ? "+" : ""}
                        {market.changePercent?.toFixed(2) ?? "0.00"}%
                      </span>
                    </div>
                    <PriceAlertButton
                      symbol={market.symbol}
                      currentPrice={market.price}
                      className="-mr-2 text-muted-foreground hover:text-primary"
                    />
                  </div>
                </div>
            ))
          )}
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}
