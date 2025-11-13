"use client"

import { useEffect, useState, useRef } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface TickerData {
  symbol: string
  displayName: string
  price: number
  change: number
  changePercent: number
}

const TICKER_SYMBOLS = [
  { symbol: "AAPL", displayName: "AAPL" },
  { symbol: "GOOGL", displayName: "GOOGL" },
  { symbol: "MSFT", displayName: "MSFT" },
  { symbol: "TSLA", displayName: "TSLA" },
  { symbol: "AMZN", displayName: "AMZN" },
  { symbol: "NVDA", displayName: "NVDA" },
  { symbol: "META", displayName: "META" },
  { symbol: "NFLX", displayName: "NFLX" },
  { symbol: "SPY", displayName: "SPY" },
  { symbol: "JPM", displayName: "JPM" },
  { symbol: "BA", displayName: "BA" },
  { symbol: "DIS", displayName: "DIS" },
  { symbol: "V", displayName: "V" },
  { symbol: "JNJ", displayName: "JNJ" },
  { symbol: "WMT", displayName: "WMT" },
]

export function PriceTicker() {
  const [tickerData, setTickerData] = useState<TickerData[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const tickerRef = useRef<HTMLDivElement>(null)

  const fetchTickerData = async () => {
    try {
      const promises = TICKER_SYMBOLS.map(async ({ symbol, displayName }) => {
        const response = await fetch(`/api/fmp/quote?symbol=${symbol}`)
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
    const interval = setInterval(fetchTickerData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const ticker = tickerRef.current
    if (!ticker || tickerData.length === 0) return

    // Reset animation when data changes
    ticker.style.animation = "none"
    setTimeout(() => {
      ticker.style.animation = `scroll-ticker ${tickerData.length * 4}s linear infinite`
    }, 10)
  }, [tickerData])

  const formatPrice = (price: number, symbol: string) => {
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
        <div className="h-12 flex items-center overflow-hidden" ref={containerRef}>
          <div
            className="price-ticker flex items-center space-x-8 whitespace-nowrap"
            ref={tickerRef}
            style={{
              animation: tickerData.length > 0 ? `scroll-ticker ${tickerData.length * 4}s linear infinite` : "none",
            }}
          >
            {tickerData
              .concat(tickerData)
              .concat(tickerData)
              .map((item, index) => (
                <div key={`${item.symbol}-${index}`} className="flex items-center space-x-2 flex-shrink-0">
                  <span className="font-medium text-sm">{item.displayName}</span>
                  <span className="font-mono text-sm">{formatPrice(item.price, item.symbol)}</span>
                  <div
                    className={`flex items-center space-x-1 text-xs ${
                      item.changePercent >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
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

      <style>{`
        @keyframes scroll-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  )
}
