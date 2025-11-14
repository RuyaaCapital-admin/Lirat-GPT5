"use client"

import React, { useEffect, useRef, memo } from "react"
import { useTheme } from "next-themes"

function TradingViewChart({ symbol = "AAPL" }: { symbol?: string }) {
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
      interval: "D",
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
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      {/* Mask TradingView links and branding */}
      <style jsx global>{`
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
          pointer-events: auto !important;
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
        /* Dark mode adjustment */
        ${isDark ? `
          .tradingview-widget-container__chart iframe {
            filter: brightness(0.85) contrast(1.1);
          }
        ` : ""}
      `}</style>
      <div className="tradingview-widget-container__chart" ref={container}></div>
    </div>
  )
}

export default memo(TradingViewChart)

