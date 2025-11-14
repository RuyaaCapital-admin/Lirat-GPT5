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
      colorTheme: "light", // Always use light theme, we'll adjust with CSS for dark mode
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
    <div className="relative w-full overflow-hidden rounded-lg" style={{ pointerEvents: "none" }}>
      {/* Overlay to block ALL interactions */}
      <div 
        className="absolute inset-0 z-50 cursor-default" 
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
      />
      {/* Mask TradingView links and branding */}
      <style jsx global>{`
        .tradingview-widget-container {
          position: relative;
          overflow: hidden;
        }
        .tradingview-widget-container__widget {
          position: relative;
          z-index: 1;
        }
        .tradingview-widget-copyright,
        .tradingview-widget-copyright * {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          position: absolute !important;
          left: -9999px !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          font-size: 0 !important;
          line-height: 0 !important;
        }
        .tradingview-widget-container a,
        .tradingview-widget-container a *,
        .tradingview-widget-container [href],
        .tradingview-widget-container [href] * {
          pointer-events: none !important;
          cursor: default !important;
          user-select: none !important;
          text-decoration: none !important;
        }
        .tradingview-widget-container iframe {
          pointer-events: none !important;
          cursor: default !important;
        }
        /* Hide any TradingView branding or links that might appear */
        .tradingview-widget-container [href*="tradingview.com"],
        .tradingview-widget-container [class*="copyright"],
        .tradingview-widget-container [class*="trademark"],
        .tradingview-widget-container [class*="TradingView"],
        .tradingview-widget-container [id*="tradingview"],
        .tradingview-widget-container [id*="copyright"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
        /* Mask bottom corners where links might appear */
        .tradingview-widget-container::after {
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
        /* Dark mode color adjustment - completely override TradingView's dark blue */
        ${isDark ? `
          .tradingview-widget-container iframe {
            filter: brightness(0.9) contrast(1.15) invert(0.05) hue-rotate(180deg) saturate(0.8);
            background-color: rgba(15, 23, 42, 1) !important;
          }
          .tradingview-widget-container {
            background-color: rgba(15, 23, 42, 1) !important;
          }
        ` : ""}
      `}</style>
      <div className="tradingview-widget-container" ref={container} style={{ pointerEvents: "none" }}>
        <div className="tradingview-widget-container__widget" style={{ pointerEvents: "none" }}></div>
        <div className="tradingview-widget-copyright" style={{ display: "none" }}>
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

