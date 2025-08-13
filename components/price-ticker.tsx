"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface TickerData {
  symbol: string
  displayName: string
  price: number
  change: number
  changePercent: number
}

const TICKER_SYMBOLS = [
  { symbol: "AAPL.US", displayName: "AAPL" },
  { symbol: "GOOGL.US", displayName: "GOOGL" },
  { symbol: "MSFT.US", displayName: "MSFT" },
  { symbol: "TSLA.US", displayName: "TSLA" },
  { symbol: "AMZN.US", displayName: "AMZN" },
  { symbol: "NVDA.US", displayName: "NVDA" },
  { symbol: "META.US", displayName: "META" },
  { symbol: "NFLX.US", displayName: "NFLX" },
  { symbol: "BTCUSD", displayName: "BTC" },
  { symbol: "ETHUSD", displayName: "ETH" },
  { symbol: "XAUUSD", displayName: "GOLD" },
  { symbol: "XAGUSD", displayName: "SILVER" },
  { symbol: "EURUSD", displayName: "EUR/USD" },
  { symbol: "GBPUSD", displayName: "GBP/USD" },
  { symbol: "USDJPY", displayName: "USD/JPY" },
]

export function PriceTicker() {
  const [tickerData, setTickerData] = useState<TickerData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickerData = async () => {
    try {
      const promises = TICKER_SYMBOLS.map(async ({ symbol, displayName }) => {
        const response = await fetch(`/api/eodhd/realtime?symbol=${symbol}`)
        if (response.ok) {
          const data = await response.json()
          return {
            symbol,
            displayName,
            price: data.price || 0,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
          }
        }
        return null
      })

      const results = await Promise.all(promises)
      const validData = results.filter(Boolean) as TickerData[]
      setTickerData(validData)
    } catch (error) {
      console.error("Failed to fetch ticker data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickerData()
    const interval = setInterval(fetchTickerData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes("BTC") || symbol.includes("ETH")) {
      return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }
    if (symbol.includes("GOLD") || symbol.includes("SILVER")) {
      return price.toFixed(2)
    }
    if (symbol.includes("JPY")) {
      return price.toFixed(2)
    }
    if (symbol.includes("USD") && !symbol.includes(".US")) {
      return price.toFixed(4)
    }
    return price.toFixed(2)
  }

  if (loading) {
    return (
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-12 flex items-center">
            <div className="flex space-x-8 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="h-4 bg-muted rounded w-12"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="h-12 flex items-center">
          <div className="price-ticker flex items-center space-x-8 whitespace-nowrap">
            {tickerData.concat(tickerData).map((item, index) => (
              <div key={`${item.symbol}-${index}`} className="flex items-center space-x-2 flex-shrink-0">
                <span className="font-medium text-sm">{item.displayName}</span>
                <span className="font-mono text-sm">
                  {item.symbol.includes("BTC") || item.symbol.includes("ETH") ? "$" : ""}
                  {formatPrice(item.price, item.symbol)}
                  {item.symbol.includes("USD") &&
                  !item.symbol.includes(".US") &&
                  !item.symbol.includes("BTC") &&
                  !item.symbol.includes("ETH")
                    ? ""
                    : item.symbol.includes(".US")
                      ? ""
                      : ""}
                </span>
                <div
                  className={`flex items-center space-x-1 text-xs ${
                    item.changePercent >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
