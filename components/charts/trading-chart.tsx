"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, type IChartApi, type ISeriesApi, LineStyle, type UTCTimestamp } from "lightweight-charts"
import { useTheme } from "next-themes"
import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react"

interface OHLCVData {
  ts: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface TradingChartProps {
  symbol: string
  onSymbolChange: (symbol: string) => void
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
}

const SYMBOLS = [
  { value: "XAUUSD", label: "Gold/USD" },
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
  { value: "USDCHF", label: "USD/CHF" },
  { value: "AUDUSD", label: "AUD/USD" },
  { value: "USDCAD", label: "USD/CAD" },
  { value: "NZDUSD", label: "NZD/USD" },
]

const TIMEFRAMES = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
]

export function TradingChart({ symbol, onSymbolChange, timeframe, onTimeframeChange }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number | null>(null)
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null)
  const { theme, resolvedTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  const initChart = () => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: isDark ? "#e2e8f0" : "#334155",
      },
      grid: {
        vertLines: { color: isDark ? "#334155" : "#e2e8f0" },
        horzLines: { color: isDark ? "#334155" : "#e2e8f0" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: isDark ? "#64748b" : "#94a3b8",
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: isDark ? "#64748b" : "#94a3b8",
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        textColor: isDark ? "#e2e8f0" : "#334155",
      },
      timeScale: {
        borderColor: isDark ? "#334155" : "#e2e8f0",
        textColor: isDark ? "#e2e8f0" : "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    })

    chartRef.current = chart
    seriesRef.current = candlestickSeries

    // Expose chart API for AI control
    ;(window as any).ChartAPI = {
      addLevel: (price: number, title?: string) => {
        chart.addPriceLine({
          price,
          color: "#f59e0b",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: title || `Level ${price}`,
        })
      },
      removeLevels: () => {
        // This would require tracking price lines, simplified for demo
        console.log("Remove levels called")
      },
      setSymbol: (newSymbol: string) => {
        onSymbolChange(newSymbol)
      },
      setTimeframe: (newTimeframe: string) => {
        onTimeframeChange(newTimeframe)
      },
    }

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }

  const fetchData = async () => {
    if (!seriesRef.current) return

    setLoading(true)
    try {
      const response = await fetch(`/api/eodhd/ohlcv?symbol=${symbol}&tf=${timeframe}&lookback=500`)
      if (response.ok) {
        const data = await response.json()
        const chartData = data.ohlcv.map((item: OHLCVData) => ({
          time: item.ts as UTCTimestamp,
          open: item.o,
          high: item.h,
          low: item.l,
          close: item.c,
        }))

        seriesRef.current.setData(chartData)

        // Calculate price change
        if (chartData.length >= 2) {
          const current = chartData[chartData.length - 1]
          const previous = chartData[chartData.length - 2]
          const change = current.close - previous.close
          const changePercent = (change / previous.close) * 100

          setLastPrice(current.close)
          setPriceChange(change)
          setPriceChangePercent(changePercent)
        }
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cleanup = initChart()
    return cleanup
  }, [isDark])

  useEffect(() => {
    if (chartRef.current && seriesRef.current) {
      fetchData()
    }
  }, [symbol, timeframe])

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({})
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const formatPrice = (price: number) => {
    return symbol.includes("JPY") ? price.toFixed(2) : price.toFixed(4)
  }

  return (
    <ModernPanel>
      <ModernPanelHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-4">
            <ModernPanelTitle>{symbol}</ModernPanelTitle>
            {lastPrice && (
              <div className="flex items-center space-x-2">
                <span className="font-mono text-lg font-semibold">{formatPrice(lastPrice)}</span>
                {priceChange !== null && (
                  <div
                    className={`flex items-center space-x-1 ${priceChange >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {priceChange >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : priceChange < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    <span className="font-mono text-sm">
                      {priceChange >= 0 ? "+" : ""}
                      {formatPrice(priceChange)} ({priceChangePercent?.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Select value={symbol} onValueChange={onSymbolChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </ModernPanelHeader>
      <ModernPanelContent>
        <div className="space-y-4">
          <div className="h-[600px] w-full" ref={chartContainerRef} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                AI Controllable
              </Badge>
              <span>Use ChartAPI.addLevel(price) to add levels</span>
            </div>
            <div>Powered by EODHD</div>
          </div>
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}
