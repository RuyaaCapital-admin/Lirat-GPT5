"use client"

import React, { useEffect, useMemo, useRef, memo } from "react"
import { useTheme } from "next-themes"

const BRAND_GUARD_HEIGHT = 56

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark" || theme === "dark"
  const backgroundColor = useMemo(() => (isDark ? "rgba(8, 18, 12, 1)" : "rgba(255, 255, 255, 1)"), [isDark])

  useEffect(() => {
    if (!container.current) return

    container.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      isTransparent: false,
      locale: "en",
      currencies: ["EUR", "USD", "GBP", "TRY", "CNY", "JPY"],
      backgroundColor,
      width: "100%",
      height: 360,
    })

    container.current.appendChild(script)

    return () => {
      if (container.current) {
        container.current.innerHTML = ""
      }
    }
  }, [backgroundColor])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
      <style jsx global>{`
        .tradingview-widget-container {
          position: relative;
          overflow: hidden;
          border-radius: 1rem;
        }
        .tradingview-widget-container__widget {
          position: relative;
          z-index: 1;
        }
        .tradingview-widget-copyright,
        .tradingview-widget-copyright * {
          opacity: 0 !important;
          pointer-events: none !important;
          font-size: 0 !important;
          line-height: 0 !important;
        }
        .tradingview-widget-container [href*="tradingview.com"] {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        ${isDark
          ? `
        .tradingview-widget-container iframe {
          filter: brightness(0.9) contrast(1.1) saturate(0.9);
          background-color: ${backgroundColor} !important;
        }
        `
          : `
        .tradingview-widget-container iframe {
          background-color: ${backgroundColor} !important;
        }
        `}
      `}</style>
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget" />
        <div className="tradingview-widget-copyright">
          <a href="https://www.tradingview.com/markets/currencies/" rel="noopener nofollow" target="_blank">
            Forex market data by TradingView
          </a>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-auto absolute inset-x-0 bottom-0"
        style={{
          height: BRAND_GUARD_HEIGHT,
          background: `linear-gradient(to top, ${isDark ? "rgba(6,14,10,0.95)" : "rgba(255,255,255,0.95)"}, ${
            isDark ? "rgba(6,14,10,0.2)" : "rgba(255,255,255,0)"
          })`,
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
      />
    </div>
  )
}

export default memo(TradingViewWidget)

