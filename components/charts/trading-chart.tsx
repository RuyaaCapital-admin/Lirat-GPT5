"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { RefreshCw } from "lucide-react"

interface TradingChartProps {
  symbol: string
  onSymbolChange: (symbol: string) => void
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
}

const SYMBOLS = [
  { value: "AAPL", label: "Apple · AAPL", tvSymbol: "NASDAQ:AAPL" },
  { value: "GOOGL", label: "Alphabet · GOOGL", tvSymbol: "NASDAQ:GOOGL" },
  { value: "MSFT", label: "Microsoft · MSFT", tvSymbol: "NASDAQ:MSFT" },
  { value: "TSLA", label: "Tesla · TSLA", tvSymbol: "NASDAQ:TSLA" },
  { value: "AMZN", label: "Amazon · AMZN", tvSymbol: "NASDAQ:AMZN" },
  { value: "NVDA", label: "NVIDIA · NVDA", tvSymbol: "NASDAQ:NVDA" },
  { value: "META", label: "Meta · META", tvSymbol: "NASDAQ:META" },
  { value: "NFLX", label: "Netflix · NFLX", tvSymbol: "NASDAQ:NFLX" },
  { value: "BTCUSD", label: "Bitcoin · BTCUSD", tvSymbol: "COINBASE:BTCUSD" },
  { value: "ETHUSD", label: "Ethereum · ETHUSD", tvSymbol: "COINBASE:ETHUSD" },
  { value: "XAUUSD", label: "Gold · XAUUSD", tvSymbol: "FOREXCOM:XAUUSD" },
  { value: "XAGUSD", label: "Silver · XAGUSD", tvSymbol: "FOREXCOM:XAGUSD" },
  { value: "EURUSD", label: "EUR / USD", tvSymbol: "FX:EURUSD" },
  { value: "GBPUSD", label: "GBP / USD", tvSymbol: "FX:GBPUSD" },
  { value: "USDJPY", label: "USD / JPY", tvSymbol: "FX:USDJPY" },
]

const TIMEFRAMES = [
  { value: "1m", labelEn: "1 Minute", labelAr: "دقيقة واحدة", interval: "1" },
  { value: "5m", labelEn: "5 Minutes", labelAr: "خمس دقائق", interval: "5" },
  { value: "15m", labelEn: "15 Minutes", labelAr: "15 دقيقة", interval: "15" },
  { value: "30m", labelEn: "30 Minutes", labelAr: "30 دقيقة", interval: "30" },
  { value: "1h", labelEn: "1 Hour", labelAr: "ساعة واحدة", interval: "60" },
  { value: "4h", labelEn: "4 Hours", labelAr: "4 ساعات", interval: "240" },
  { value: "1d", labelEn: "1 Day", labelAr: "يوم واحد", interval: "D" },
]

export function TradingChart({ symbol, onSymbolChange, timeframe, onTimeframeChange }: TradingChartProps) {
  const widgetContainerRef = useRef<HTMLDivElement | null>(null)
  const { resolvedTheme } = useTheme()
  const { locale } = useLocale()
  const [refreshToken, setRefreshToken] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const activeSymbol = useMemo(
    () => SYMBOLS.find((item) => item.value === symbol) ?? SYMBOLS[0],
    [symbol],
  )
  const activeTimeframe = useMemo(
    () => TIMEFRAMES.find((item) => item.value === timeframe) ?? TIMEFRAMES[4],
    [timeframe],
  )

  const tvTheme = resolvedTheme === "dark" ? "dark" : "light"
  const tvSymbol = activeSymbol.tvSymbol
  const tvInterval = activeTimeframe.interval
  const localeIsArabic = locale === "ar"

  useEffect(() => {
    const container = widgetContainerRef.current
    if (!container) return

    container.innerHTML = ""
    setIsLoading(true)

    const widgetWrapper = document.createElement("div")
    widgetWrapper.className = "tradingview-widget-container h-full w-full"

    const widgetElement = document.createElement("div")
    widgetElement.className = "tradingview-widget-container__widget"
    widgetWrapper.appendChild(widgetElement)

    const symbolPath = tvSymbol.replace(":", "-")
    const copyright = document.createElement("div")
    copyright.className =
      "tradingview-widget-copyright text-xs text-muted-foreground px-4 pb-2 pt-3 text-center"
    copyright.style.display = "none"
    copyright.innerHTML = `<a href="https://www.tradingview.com/symbols/${symbolPath}/" rel="noopener" target="_blank">TradingView</a>`
    widgetWrapper.appendChild(copyright)

    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.async = true

    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: "Etc/UTC",
      theme: tvTheme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_dataset_legend: false,
      allow_symbol_change: false,
      calendar: true,
      support_host: "https://www.tradingview.com",
      studies: ["MASimple@tv-basicstudies"],
    }

    script.innerHTML = JSON.stringify(config)
    script.onload = () => {
      window.setTimeout(() => setIsLoading(false), 600)
    }
    script.onerror = () => setIsLoading(false)

    widgetWrapper.appendChild(script)
    container.appendChild(widgetWrapper)

    return () => {
      container.innerHTML = ""
    }
  }, [tvSymbol, tvInterval, tvTheme, refreshToken])

  return (
    <ModernPanel className="overflow-hidden border border-slate-200/70 bg-white/95 shadow-xl dark:border-slate-800/60 dark:bg-slate-900/75">
      <ModernPanelHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <ModernPanelTitle>{activeSymbol.label}</ModernPanelTitle>
              <Badge
                variant="outline"
                className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200"
              >
                TradingView
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {localeIsArabic
                ? "الرسوم البيانية المتقدمة من TradingView مع تحديثات مباشرة في التوقيت العالمي المنسق."
                : "Advanced TradingView charting with live updates in coordinated universal time."}
            </p>
            <p className="text-xs uppercase tracking-widest text-primary">
              {localeIsArabic ? "بيانات لحظية · UTC" : "Live Data · UTC"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={symbol} onValueChange={onSymbolChange}>
              <SelectTrigger className="w-[180px]">
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
            <Select value={timeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {localeIsArabic ? item.labelAr : item.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshToken((token) => token + 1)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </ModernPanelHeader>
      <ModernPanelContent className="p-0">
        <div className="relative h-[640px] w-full overflow-hidden rounded-b-3xl border-t border-slate-200/70 dark:border-slate-800/60">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {localeIsArabic ? "جاري تحميل الرسم البياني..." : "Loading chart..."}
              </span>
            </div>
          )}
          <div ref={widgetContainerRef} className="h-full w-full" />
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}
