"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react"

let createChart: any = null
let LineStyle: any = null

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
  { value: "AAPL", label: "Apple Inc" },
  { value: "GOOGL", label: "Alphabet Inc" },
  { value: "MSFT", label: "Microsoft" },
  { value: "TSLA", label: "Tesla Inc" },
  { value: "AMZN", label: "Amazon" },
  { value: "NVDA", label: "NVIDIA" },
  { value: "META", label: "Meta" },
  { value: "NFLX", label: "Netflix" },
  { value: "BTCUSD", label: "Bitcoin" },
  { value: "ETHUSD", label: "Ethereum" },
  { value: "XAUUSD", label: "Gold" },
  { value: "XAGUSD", label: "Silver" },
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
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
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number | null>(null)
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null)
  const [chartReady, setChartReady] = useState(false)
  const { theme, resolvedTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    const loadChart = async () => {
      try {
        const chartModule = await import("lightweight-charts")
        createChart = chartModule.createChart
        LineStyle = chartModule.LineStyle
        setChartReady(true)
      } catch (error) {
        console.error("Failed to load lightweight-charts:", error)
      }
    }
    loadChart()
  }, [])

  const initChart = () => {
    if (!chartContainerRef.current || !createChart || !LineStyle) return

    try {
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

      let candlestickSeries: any
      try {
        if (typeof chart.addCandlestickSeries === "function") {
          candlestickSeries = chart.addCandlestickSeries({
            upColor: "#16a34a",
            downColor: "#dc2626",
            borderVisible: false,
            wickUpColor: "#16a34a",
            wickDownColor: "#dc2626",
          })
        } else {
          throw new Error("addCandlestickSeries not available")
        }
      } catch (candleError) {
        console.warn("[v0] Candlestick series failed, falling back to line series:", candleError)
        // Fall back to line chart
        candlestickSeries = chart.addLineSeries({
          color: "#3b82f6",
          lineWidth: 2,
        })
      }

      chartRef.current = chart
      seriesRef.current = candlestickSeries

      // Expose chart API for AI control
      ;(window as any).ChartAPI = {
        addLevel: (price: number, title?: string) => {
          if (chart && typeof chart.addPriceLine === "function") {
            chart.addPriceLine({
              price,
              color: "#f59e0b",
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: title || `Level ${price}`,
            })
          }
        },
        removeLevels: () => {
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
        if (chart && typeof chart.remove === "function") {
          chart.remove()
        }
        chartRef.current = null
        seriesRef.current = null
      }
    } catch (error) {
      console.error("Error initializing chart:", error)
    }
  }

  const fetchData = async () => {
    if (!seriesRef.current) return

    setLoading(true)
    try {
      const response = await fetch(`/api/fmp/historical?symbol=${symbol}&period=15min&limit=500`)
      if (response.ok) {
        const data = await response.json()

        let chartData = []
        if (data.ohlcv && Array.isArray(data.ohlcv)) {
          chartData = data.ohlcv.map((item: any) => ({
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }))
        } else if (Array.isArray(data)) {
          chartData = data.map((item: any) => ({
            time: Math.floor(new Date(item.date).getTime() / 1000),
            open: Number.parseFloat(item.open),
            high: Number.parseFloat(item.high),
            low: Number.parseFloat(item.low),
            close: Number.parseFloat(item.close),
          }))
        }

        if (chartData.length > 0 && seriesRef.current && typeof seriesRef.current.setData === "function") {
          seriesRef.current.setData(chartData)

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
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (chartReady) {
      const cleanup = initChart()
      return cleanup
    }
  }, [isDark, chartReady])

  useEffect(() => {
    if (chartRef.current && seriesRef.current && chartReady) {
      fetchData()
    }
  }, [symbol, timeframe, chartReady])

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && typeof chartRef.current.applyOptions === "function") {
        chartRef.current.applyOptions({})
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  if (!chartReady) {
    return (
      <ModernPanel>
        <ModernPanelHeader>
          <ModernPanelTitle>Loading Chart...</ModernPanelTitle>
        </ModernPanelHeader>
        <ModernPanelContent>
          <div className="flex h-[600px] items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </ModernPanelContent>
      </ModernPanel>
    )
  }

  return (
    <ModernPanel>
      <ModernPanelHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-4">
            <ModernPanelTitle>{symbol}</ModernPanelTitle>
            {lastPrice && (
              <div className="flex items-center space-x-2">
                <span className="font-mono text-lg font-semibold">${formatPrice(lastPrice)}</span>
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
                      {priceChange >= 0 ? "+" : ""}${formatPrice(priceChange)} ({priceChangePercent?.toFixed(2)}%)
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
            <div>Powered by LIIRAT</div>
          </div>
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}
