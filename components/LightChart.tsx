"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { createChart, CrosshairMode, LineStyle, type CandlestickData, type ISeriesApi, type UTCTimestamp } from "lightweight-charts"
import { useTheme } from "next-themes"
import { useLocale } from "@/hooks/use-locale"
import {
  ModernPanel,
  ModernPanelContent,
  ModernPanelHeader,
  ModernPanelTitle,
} from "@/components/modern-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, Activity, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d"

export interface LightChartHandle {
  setSymbol: (value: string) => void
  setTimeframe: (value: Timeframe) => void
  addSupportLevel: (price: number, title?: string) => void
  addResistanceLevel: (price: number, title?: string) => void
  addLevel: (price: number, title?: string) => void
  clearLevels: () => void
}

interface LightChartProps {
  symbol: string
  onSymbolChange?: (symbol: string) => void
  timeframe: Timeframe
  onTimeframeChange?: (timeframe: Timeframe) => void
}

type StreamStatus = "idle" | "connecting" | "open" | "error"

const SYMBOLS = [
  { value: "AAPL", label: "Apple · AAPL" },
  { value: "GOOGL", label: "Alphabet · GOOGL" },
  { value: "MSFT", label: "Microsoft · MSFT" },
  { value: "TSLA", label: "Tesla · TSLA" },
  { value: "AMZN", label: "Amazon · AMZN" },
  { value: "NVDA", label: "NVIDIA · NVDA" },
  { value: "META", label: "Meta · META" },
  { value: "BTCUSD", label: "Bitcoin · BTCUSD" },
  { value: "ETHUSD", label: "Ethereum · ETHUSD" },
  { value: "XAUUSD", label: "Gold · XAUUSD" },
  { value: "XAGUSD", label: "Silver · XAGUSD" },
  { value: "EURUSD", label: "EUR / USD" },
  { value: "GBPUSD", label: "GBP / USD" },
  { value: "USDJPY", label: "USD / JPY" },
]

const TIMEFRAMES: Array<{
  value: Timeframe
  labelEn: string
  labelAr: string
  period: string
  durationMs: number
}> = [
  { value: "1m", labelEn: "1 Minute", labelAr: "دقيقة واحدة", period: "1min", durationMs: 60_000 },
  { value: "5m", labelEn: "5 Minutes", labelAr: "خمس دقائق", period: "5min", durationMs: 5 * 60_000 },
  { value: "15m", labelEn: "15 Minutes", labelAr: "15 دقيقة", period: "15min", durationMs: 15 * 60_000 },
  { value: "30m", labelEn: "30 Minutes", labelAr: "30 دقيقة", period: "30min", durationMs: 30 * 60_000 },
  { value: "1h", labelEn: "1 Hour", labelAr: "ساعة واحدة", period: "1hour", durationMs: 60 * 60_000 },
  { value: "4h", labelEn: "4 Hours", labelAr: "4 ساعات", period: "4hour", durationMs: 4 * 60 * 60_000 },
  { value: "1d", labelEn: "1 Day", labelAr: "يوم واحد", period: "1day", durationMs: 24 * 60 * 60_000 },
]

type PriceLineCollections = {
  support: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]
  resistance: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]
  custom: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>[]
}

export const LightChart = forwardRef<LightChartHandle, LightChartProps>(
  ({ symbol, onSymbolChange, timeframe, onTimeframeChange }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null)
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const candlesRef = useRef<CandlestickData[]>([])
    const priceLinesRef = useRef<PriceLineCollections>({ support: [], resistance: [], custom: [] })
    const pendingSymbolTimerRef = useRef<number | null>(null)
    const pendingTimeframeTimerRef = useRef<number | null>(null)
    const durationRef = useRef<number>(TIMEFRAMES[0].durationMs)

    const { resolvedTheme } = useTheme()
    const { locale } = useLocale()

    const [isLoading, setIsLoading] = useState(true)
    const [historicalError, setHistoricalError] = useState<string | null>(null)
    const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle")

    const timeframeConfig = useMemo(() => {
      return TIMEFRAMES.find((item) => item.value === timeframe) ?? TIMEFRAMES[0]
    }, [timeframe])

    durationRef.current = timeframeConfig.durationMs

    const applyThemeToChart = useCallback(
      (chart: ReturnType<typeof createChart>, series: ISeriesApi<"Candlestick">) => {
        const dark = resolvedTheme === "dark"

        chart.applyOptions({
          layout: {
            background: { color: dark ? "#0b131d" : "#f9fafb" },
            textColor: dark ? "#d1e4ff" : "#1f2937",
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: {
              color: dark ? "rgba(148, 163, 184, 0.35)" : "rgba(148, 163, 184, 0.45)",
              labelBackgroundColor: dark ? "#111827" : "#f3f4f6",
            },
            horzLine: {
              color: dark ? "rgba(148, 163, 184, 0.35)" : "rgba(148, 163, 184, 0.45)",
              labelBackgroundColor: dark ? "#111827" : "#f3f4f6",
            },
          },
          grid: {
            vertLines: {
              color: dark ? "rgba(30, 41, 59, 0.6)" : "rgba(226, 232, 240, 0.7)",
            },
            horzLines: {
              color: dark ? "rgba(30, 41, 59, 0.6)" : "rgba(226, 232, 240, 0.7)",
            },
          },
          rightPriceScale: {
            borderColor: dark ? "rgba(15, 23, 42, 0.8)" : "rgba(148, 163, 184, 0.4)",
            textColor: dark ? "#d1e4ff" : "#1f2937",
          },
          timeScale: {
            borderColor: dark ? "rgba(15, 23, 42, 0.8)" : "rgba(148, 163, 184, 0.4)",
            timeVisible: true,
            secondsVisible: timeframe === "1m",
          },
        })

        series.applyOptions({
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#16a34a",
          borderDownColor: "#dc2626",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          priceFormat: {
            type: "price",
            precision: 4,
            minMove: 0.0001,
          },
        })
      },
      [resolvedTheme, timeframe],
    )

    const clearLines = useCallback(() => {
      if (!seriesRef.current) return
      const { support, resistance, custom } = priceLinesRef.current
      ;[support, resistance, custom].forEach((collection) => {
        collection.forEach((line) => {
          try {
            seriesRef.current?.removePriceLine(line)
          } catch {
            // ignore
          }
        })
      })
      priceLinesRef.current = { support: [], resistance: [], custom: [] }
    }, [])

    const addLine = useCallback(
      (price: number, kind: "support" | "resistance" | "custom", title?: string) => {
        if (!seriesRef.current || Number.isNaN(price)) return
        const color =
          kind === "support" ? "#22c55e" : kind === "resistance" ? "#ef4444" : resolvedTheme === "dark" ? "#38bdf8" : "#0ea5e9"
        const line = seriesRef.current.createPriceLine({
          price,
          color,
          lineWidth: 2,
          axisLabelVisible: true,
          title:
            title ??
            (kind === "support"
              ? `${locale === "ar" ? "دعم" : "Support"} ${price.toFixed(2)}`
              : kind === "resistance"
                ? `${locale === "ar" ? "مقاومة" : "Resistance"} ${price.toFixed(2)}`
                : `${locale === "ar" ? "مستوى" : "Level"} ${price.toFixed(2)}`),
          lineStyle: kind === "custom" ? LineStyle.Dotted : LineStyle.Solid,
        })

        priceLinesRef.current[kind].push(line)
      },
      [locale, resolvedTheme],
    )

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        autoSize: true,
      }) as ReturnType<typeof createChart>

      const series = (chart as any).addCandlestickSeries() as ISeriesApi<"Candlestick">

      chartRef.current = chart
      seriesRef.current = series

      applyThemeToChart(chart, series)

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (chartRef.current && entry) {
          const { width, height } = entry.contentRect
          chartRef.current.applyOptions({ width, height })
        }
      })
      observer.observe(container)
      resizeObserverRef.current = observer

      return () => {
        observer.disconnect()
        resizeObserverRef.current = null
        chart.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }, [applyThemeToChart])

    useEffect(() => {
      if (chartRef.current && seriesRef.current) {
        applyThemeToChart(chartRef.current, seriesRef.current)
      }
    }, [applyThemeToChart, resolvedTheme])

    const fetchHistorical = useCallback(
      async (currentSymbol: string, currentTimeframe: Timeframe, signal: AbortSignal) => {
        if (!seriesRef.current) return

        setIsLoading(true)
        setHistoricalError(null)

        try {
          const params = new URLSearchParams({
            symbol: currentSymbol,
            period: timeframeConfig.period,
            limit: currentTimeframe === "1m" ? "400" : "320",
          })
          const response = await fetch(`/api/fmp/historical?${params.toString()}`, {
            cache: "no-store",
            signal,
          })

          if (!response.ok) {
            throw new Error(`Historical fetch failed: ${response.status}`)
          }

          const json = await response.json()
          if (signal.aborted) return

          const ohlcv = Array.isArray(json?.ohlcv) ? json.ohlcv : []
          const candles: CandlestickData[] = ohlcv
            .map((bar: any) => {
              const timeSeconds = typeof bar.time === "number" ? bar.time : Math.floor(new Date(bar.date).getTime() / 1000)
              const open = Number(bar.open)
              const high = Number(bar.high)
              const low = Number(bar.low)
              const close = Number(bar.close)
              if ([open, high, low, close].some((value) => !Number.isFinite(value))) {
                return null
              }
              return {
                time: timeSeconds as UTCTimestamp,
                open,
                high,
                low,
                close,
              } satisfies CandlestickData
            })
            .filter(Boolean) as CandlestickData[]

          candlesRef.current = candles
          seriesRef.current.setData(candles)
          chartRef.current?.timeScale().fitContent()
          clearLines()
          setIsLoading(false)
        } catch (error) {
          if (signal.aborted) return
          console.error("[LightChart] historical fetch error:", error)
          setHistoricalError("Failed to load historical data.")
          setIsLoading(false)
        }
      },
      [clearLines, timeframeConfig.period],
    )

    useEffect(() => {
      const controller = new AbortController()
      fetchHistorical(symbol, timeframe, controller.signal)
      return () => controller.abort()
    }, [fetchHistorical, symbol, timeframe])

    useEffect(() => {
      let active = true
      let eventSource: EventSource | null = null
      let retryTimer: number | null = null

      if (typeof window === "undefined") {
        return
      }

      const symbolParam = encodeURIComponent(symbol)

      const connect = () => {
        if (!active) return
        setStreamStatus("connecting")

        eventSource = new EventSource(`/api/fmp/stream?symbol=${symbolParam}`)

        eventSource.onopen = () => {
          if (!active) return
          setStreamStatus("open")
        }

        eventSource.onmessage = (event) => {
          if (!event.data || event.data.startsWith(":")) return
          try {
            const payload = JSON.parse(event.data) as { symbol: string; price: number; timestamp: number }
            if (payload.symbol !== symbol || !Number.isFinite(payload.price)) return

            const durationMs = durationRef.current || timeframeConfig.durationMs
            const timestampMs = Number.isFinite(payload.timestamp) ? payload.timestamp : Date.now()
            const bucket = Math.floor(timestampMs / durationMs) * durationMs
            const bucketSeconds = Math.floor(bucket / 1000) as UTCTimestamp
            const price = payload.price

            const candles = candlesRef.current
            const last = candles[candles.length - 1]

            if (last && Number(last.time) === bucketSeconds) {
              const updated: CandlestickData = {
                time: bucketSeconds,
                open: last.open,
                high: Math.max(last.high, price),
                low: Math.min(last.low, price),
                close: price,
              }
              candles[candles.length - 1] = updated
              seriesRef.current?.update(updated)
            } else {
              const open = last ? last.close : price
              const newCandle: CandlestickData = {
                time: bucketSeconds,
                open,
                high: price,
                low: price,
                close: price,
              }
              candles.push(newCandle)
              if (candles.length > 800) {
                candles.splice(0, candles.length - 800)
              }
              seriesRef.current?.update(newCandle)
            }
          } catch (error) {
            console.error("[LightChart] stream payload error:", error)
          }
        }

        eventSource.onerror = () => {
          if (!active) return
          setStreamStatus("error")
          eventSource?.close()
          retryTimer = window.setTimeout(connect, 5_000)
        }
      }

      connect()

      return () => {
        active = false
        if (retryTimer) {
          window.clearTimeout(retryTimer)
        }
        eventSource?.close()
      }
    }, [symbol, timeframeConfig.durationMs])

    useEffect(() => {
      return () => {
        if (pendingSymbolTimerRef.current) {
          window.clearTimeout(pendingSymbolTimerRef.current)
        }
        if (pendingTimeframeTimerRef.current) {
          window.clearTimeout(pendingTimeframeTimerRef.current)
        }
      }
    }, [])

    const publicApi = useMemo<LightChartHandle>(() => {
      return {
        setSymbol: (value: string) => {
          const next = value.trim().toUpperCase()
          if (!next) return
          if (pendingSymbolTimerRef.current) {
            window.clearTimeout(pendingSymbolTimerRef.current)
          }
          pendingSymbolTimerRef.current = window.setTimeout(() => {
            onSymbolChange?.(next)
          }, 220)
        },
        setTimeframe: (value: Timeframe) => {
          if (pendingTimeframeTimerRef.current) {
            window.clearTimeout(pendingTimeframeTimerRef.current)
          }
          pendingTimeframeTimerRef.current = window.setTimeout(() => {
            onTimeframeChange?.(value)
          }, 180)
        },
        addSupportLevel: (price: number, title?: string) => addLine(price, "support", title),
        addResistanceLevel: (price: number, title?: string) => addLine(price, "resistance", title),
        addLevel: (price: number, title?: string) => addLine(price, "support", title),
        clearLevels: () => clearLines(),
      }
    }, [addLine, clearLines, onSymbolChange, onTimeframeChange])

    useImperativeHandle(ref, () => publicApi, [publicApi])

    useEffect(() => {
      const apiForGlobal = {
        setSymbol: publicApi.setSymbol,
        setTimeframe: publicApi.setTimeframe,
        addSupportLevel: publicApi.addSupportLevel,
        addResistanceLevel: publicApi.addResistanceLevel,
        addLevel: publicApi.addLevel,
        clearLevels: publicApi.clearLevels,
      }
      ;(window as any).ChartAPI = apiForGlobal
      return () => {
        if ((window as any).ChartAPI === apiForGlobal) {
          delete (window as any).ChartAPI
        }
      }
    }, [publicApi])

    useEffect(() => {
      clearLines()
    }, [symbol, timeframe, clearLines])

    const handleRefresh = () => {
      const controller = new AbortController()
      fetchHistorical(symbol, timeframe, controller.signal)
    }

    const streamStatusLabel = useMemo(() => {
      switch (streamStatus) {
        case "open":
          return locale === "ar" ? "متصل" : "Live"
        case "connecting":
          return locale === "ar" ? "جاري الاتصال..." : "Connecting…"
        case "error":
          return locale === "ar" ? "إعادة الاتصال..." : "Reconnecting…"
        default:
          return locale === "ar" ? "جاهز" : "Ready"
      }
    }, [locale, streamStatus])

    const streamBadgeClass = useMemo(() => {
      switch (streamStatus) {
        case "open":
          return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
        case "error":
          return "border-amber-300/40 bg-amber-400/10 text-amber-200"
        case "connecting":
          return "border-sky-300/40 bg-sky-400/10 text-sky-200"
        default:
          return "border-slate-300/40 bg-slate-200/10 text-slate-200"
      }
    }, [streamStatus])

    const timeframeLabel = locale === "ar" ? timeframeConfig.labelAr : timeframeConfig.labelEn

    return (
      <ModernPanel className="overflow-hidden border border-slate-200/70 bg-white/95 shadow-xl dark:border-slate-800/60 dark:bg-slate-900/80">
        <ModernPanelHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <ModernPanelTitle>{SYMBOLS.find((item) => item.value === symbol)?.label ?? symbol}</ModernPanelTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className={cn("flex items-center gap-1", streamBadgeClass)}>
                  <Wifi className="h-3.5 w-3.5" />
                  {streamStatusLabel}
                  {streamStatus === "open" && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    </span>
                  )}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" />
                  {timeframeLabel}
                </Badge>
              </div>
              {historicalError && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{historicalError}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={symbol} onValueChange={publicApi.setSymbol}>
                <SelectTrigger className="w-[188px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={(value) => publicApi.setTimeframe(value as Timeframe)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {locale === "ar" ? item.labelAr : item.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className={cn(isLoading && "opacity-60")}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading ? "animate-spin" : "")} />
              </Button>
            </div>
          </div>
        </ModernPanelHeader>
        <ModernPanelContent className="p-0">
          <div className="relative h-[600px] w-full overflow-hidden rounded-b-3xl border-t border-slate-200/70 dark:border-slate-800/60">
            <div ref={containerRef} className="h-full w-full" />
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm dark:bg-slate-900/85">
                <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {locale === "ar" ? "جاري تحميل البيانات التاريخية..." : "Loading historical data..."}
                </span>
              </div>
            )}
          </div>
        </ModernPanelContent>
      </ModernPanel>
    )
  },
)

LightChart.displayName = "LightChart"

