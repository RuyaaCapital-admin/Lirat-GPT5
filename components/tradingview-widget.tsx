"use client"

import React, { useEffect, useRef, memo } from "react"
import { useTheme } from "next-themes"

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark" || theme === "dark"

  useEffect(() => {
    if (!container.current) return

    // Clear any existing widget
    container.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: isDark ? "dark" : "light",
      isTransparent: false,
      locale: "en",
      currencies: ["EUR", "USD", "GBP", "TRY", "CNY", "JPY"],
      backgroundColor: isDark ? "rgba(15, 23, 42, 1)" : "rgba(255, 255, 255, 1)",
      width: "100%",
      height: 350,
    })

    container.current.appendChild(script)

    return () => {
      // Cleanup
      if (container.current) {
        container.current.innerHTML = ""
      }
    }
  }, [isDark])

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      {/* Mask TradingView links and branding */}
      <style jsx global>{`
        .tradingview-widget-container {
          position: relative;
        }
        .tradingview-widget-container__widget {
          position: relative;
          z-index: 1;
        }
        .tradingview-widget-copyright {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          position: absolute !important;
          left: -9999px !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
        .tradingview-widget-container a,
        .tradingview-widget-container a * {
          pointer-events: none !important;
          cursor: default !important;
          user-select: none !important;
          text-decoration: none !important;
        }
        .tradingview-widget-container iframe {
          pointer-events: auto !important;
        }
        /* Hide any TradingView branding or links that might appear */
        .tradingview-widget-container [href*="tradingview.com"],
        .tradingview-widget-container [class*="copyright"],
        .tradingview-widget-container [class*="trademark"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/markets/currencies/"
            rel="noopener nofollow"
            target="_blank"
            style={{ pointerEvents: "none", cursor: "default" }}
          >
            <span className="blue-text">Forex market</span>
          </a>
          <span className="trademark"> by TradingView</span>
        </div>
      </div>
    </div>
  )
}

export default memo(TradingViewWidget)

