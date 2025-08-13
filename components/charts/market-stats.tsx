"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react"

interface MarketStat {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface MarketStatsProps {
  currentSymbol: string
}

export function MarketStats({ currentSymbol }: MarketStatsProps) {
  const [stats, setStats] = useState<MarketStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const symbols = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
        const promises = symbols.map(async (symbol) => {
          const response = await fetch(`/api/eodhd/realtime?symbol=${symbol}`)
          if (response.ok) {
            return await response.json()
          }
          return null
        })

        const results = await Promise.all(promises)
        const validStats = results.filter(Boolean)
        setStats(validStats)
      } catch (error) {
        console.error("Failed to fetch market stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number, symbol: string) => {
    return symbol.includes("JPY") ? price.toFixed(2) : price.toFixed(4)
  }

  const currentStats = stats.find((stat) => stat.symbol === currentSymbol)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className={`border-l-4 ${currentStats ? "border-l-primary" : "border-l-muted"}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Price</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-6 bg-muted animate-pulse rounded"></div>
          ) : currentStats ? (
            <>
              <div className="text-2xl font-bold font-mono">{formatPrice(currentStats.price, currentStats.symbol)}</div>
              <p className="text-xs text-muted-foreground">{currentStats.symbol}</p>
            </>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">N/A</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Change</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-6 bg-muted animate-pulse rounded"></div>
          ) : currentStats ? (
            <>
              <div
                className={`text-2xl font-bold ${currentStats.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {currentStats.changePercent >= 0 ? "+" : ""}
                {currentStats.changePercent.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {currentStats.change >= 0 ? "+" : ""}
                {formatPrice(currentStats.change, currentStats.symbol)}
              </p>
            </>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">N/A</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Gainer</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-6 bg-muted animate-pulse rounded"></div>
          ) : (
            (() => {
              const topGainer = stats.reduce((max, stat) => (stat.changePercent > max.changePercent ? stat : max), {
                changePercent: Number.NEGATIVE_INFINITY,
                symbol: "N/A",
              } as MarketStat)
              return (
                <>
                  <div className="text-2xl font-bold">{topGainer.symbol}</div>
                  <p className="text-xs text-green-600">
                    +{topGainer.changePercent > Number.NEGATIVE_INFINITY ? topGainer.changePercent.toFixed(2) : "0.00"}%
                  </p>
                </>
              )
            })()
          )}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Loser</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-6 bg-muted animate-pulse rounded"></div>
          ) : (
            (() => {
              const topLoser = stats.reduce((min, stat) => (stat.changePercent < min.changePercent ? stat : min), {
                changePercent: Number.POSITIVE_INFINITY,
                symbol: "N/A",
              } as MarketStat)
              return (
                <>
                  <div className="text-2xl font-bold">{topLoser.symbol}</div>
                  <p className="text-xs text-red-600">
                    {topLoser.changePercent < Number.POSITIVE_INFINITY ? topLoser.changePercent.toFixed(2) : "0.00"}%
                  </p>
                </>
              )
            })()
          )}
        </CardContent>
      </Card>
    </div>
  )
}
