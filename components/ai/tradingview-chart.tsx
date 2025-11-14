"use client"

import React, { useEffect, useRef, memo } from "react"
import { useTheme } from "next-themes"

type ChartProps = {
  symbol?: string
  timeframe?: string
}

function TradingViewChart({ symbol = "AAPL", timeframe = "1h" }: ChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark" || theme === "dark"

  useEffect(() => {
    if (!container.current) return

    // Clear any existing widget
    container.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: timeframe.toUpperCase(),
      timezone: "Etc/UTC",
      theme: "light", // Always use light, adjust with CSS
      style: "1",
      locale: "en",
      backgroundColor: isDark ? "rgba(15, 23, 42, 1)" : "rgba(255, 255, 255, 1)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      support_host: "https://www.tradingview.com",
    })

    container.current.appendChild(script)

    return () => {
      // Cleanup
      if (container.current) {
        container.current.innerHTML = ""
      }
    }
  }, [isDark, symbol])

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
      {/* Overlay to block ALL interactions */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="tradingview-advanced-overlay absolute inset-0 z-50 cursor-default"
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
      />
      {/* Mask TradingView links and branding */}
      <style jsx global>{`
        .tradingview-advanced-overlay {
          background: transparent;
          border: none;
          padding: 0;
          pointer-events: auto !important;
          appearance: none;
        }
        .tradingview-widget-container__chart {
          position: relative;
          overflow: hidden;
        }
        .tradingview-widget-container__chart [class*="copyright"],
        .tradingview-widget-container__chart [class*="trademark"],
        .tradingview-widget-container__chart [href*="tradingview.com"],
        .tradingview-widget-container__chart a[href] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
        .tradingview-widget-container__chart iframe {
          pointer-events: none !important;
          cursor: default !important;
        }
        /* Mask bottom corners */
        .tradingview-widget-container__chart::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: ${isDark ? "rgba(15, 23, 42, 1)" : "rgba(255, 255, 255, 1)"};
          z-index: 10;
          pointer-events: none;
        }
        /* Dark mode adjustment - completely override TradingView's dark blue */
        ${isDark ? `
          .tradingview-widget-container__chart iframe {
            filter: brightness(0.9) contrast(1.15) invert(0.05) hue-rotate(180deg) saturate(0.8);
            background-color: rgba(15, 23, 42, 1) !important;
          }
          .tradingview-widget-container__chart {
            background-color: rgba(15, 23, 42, 1) !important;
          }
        ` : ""}
      `}</style>
      <div className="tradingview-widget-container__chart" ref={container}></div>
    </div>
  )
}

export default memo(TradingViewChart)

