"use client"

import React, { useEffect, useMemo, useRef, memo } from "react"
import { useTheme } from "next-themes"

type ChartProps = {
  symbol?: string
  timeframe?: string
}

const BRAND_STRIP = 64

function TradingViewChart({ symbol = "AAPL", timeframe = "1h" }: ChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark" || theme === "dark"
  const backgroundColor = useMemo(() => (isDark ? "rgba(6, 15, 11, 1)" : "rgba(255, 255, 255, 1)"), [isDark])

  useEffect(() => {
    if (!container.current) return

    container.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: timeframe.toUpperCase(),
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      backgroundColor,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      support_host: "https://www.tradingview.com",
    })

    container.current.appendChild(script)

    return () => {
      if (container.current) {
        container.current.innerHTML = ""
      }
    }
  }, [backgroundColor, symbol, timeframe])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
      <style jsx global>{`
        .tradingview-widget-container__chart {
          position: relative;
          overflow: hidden;
          border-radius: 1.5rem;
        }
        .tradingview-widget-container__chart iframe {
          background-color: ${backgroundColor} !important;
        }
        ${isDark
          ? `
        .tradingview-widget-container__chart iframe {
          filter: brightness(0.93) contrast(1.05) saturate(0.92);
        }
        `
          : ""}
        .tradingview-widget-container__chart [class*="copyright"],
        .tradingview-widget-container__chart [class*="trademark"],
        .tradingview-widget-container__chart a[href*="tradingview.com"] {
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
      <div className="tradingview-widget-container__chart" ref={container} />
      <div
        aria-hidden="true"
        className="pointer-events-auto absolute inset-x-0 bottom-0"
        style={{
          height: BRAND_STRIP,
          background: `linear-gradient(to top, ${isDark ? "rgba(6,15,11,0.96)" : "rgba(255,255,255,0.96)"}, ${
            isDark ? "rgba(6,15,11,0.2)" : "rgba(255,255,255,0)"
          })`,
        }}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
      />
    </div>
  )
}

export default memo(TradingViewChart)

