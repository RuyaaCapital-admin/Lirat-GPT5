"use client"

import { useEffect, useState } from "react"
import { ModernPanel, ModernPanelHeader, ModernPanelTitle, ModernPanelContent } from "@/components/modern-panel"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const majorSymbols = ["AAPL.US", "GOOGL.US", "MSFT.US", "TSLA.US", "AMZN.US", "NVDA.US"]

export function MarketOverviewCard() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { locale } = useLocale()

  const fetchMarketData = async () => {
    setLoading(true)
    try {
      const promises = majorSymbols.map(async (symbol) => {
        const response = await fetch(`/api/eodhd/realtime?symbol=${symbol}`)
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
        <div className="flex items-center justify-between">
          <ModernPanelTitle>{getTranslation(locale, "quickMarkets")}</ModernPanelTitle>
          <Button variant="ghost" size="sm" onClick={fetchMarketData} disabled={loading} className="h-8 w-8 p-0">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</p>
      </ModernPanelHeader>
      <ModernPanelContent>
        <div className="space-y-3">
          {loading && marketData.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
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
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="font-medium font-mono">{market.symbol}</div>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <div className="font-mono text-sm">${market.price?.toFixed(2) || "N/A"}</div>
                  <div
                    className={`flex items-center space-x-1 text-sm font-medium ${
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
                      {market.changePercent?.toFixed(2) || "0.00"}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}
