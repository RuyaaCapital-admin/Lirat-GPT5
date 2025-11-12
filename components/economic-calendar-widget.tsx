"use client"

import { memo, useEffect, useRef, useState } from "react"
import { useLocale } from "@/hooks/use-locale"

function EconomicCalendarWidgetComponent() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scriptLoadedRef = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const { locale } = useLocale()

  const widgetLanguage = locale === "ar" ? "ar" : "en"

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    let cancelled = false
    let retried = false
    setIsReady(false)
    scriptLoadedRef.current = false

    const mount = () => {
      if (!root || cancelled) return

      root.innerHTML = ""

      const configJson = JSON.stringify({
        width: "100%",
        height: "100%",
        mode: "1",
        lang: widgetLanguage,
        fw: "react",
      })

      const widgetHTML = `
        <div id="economicCalendarWidget"></div>
        <div class="ecw-copyright" style="display:none !important;position:absolute;left:-9999px;">
          <a href="https://www.mql5.com" rel="noopener nofollow" target="_blank"></a>
        </div>
        <script type="text/javascript" data-type="calendar-widget">${configJson}</script>
      `

      root.innerHTML = widgetHTML

      const target = root.querySelector<HTMLElement>("#economicCalendarWidget")
      if (!target) return

      const loader = document.createElement("script")
      loader.type = "text/javascript"
      loader.async = true
      loader.src = "https://www.tradays.com/c/js/widgets/calendar/widget.js"

      const markReady = () => {
        scriptLoadedRef.current = true
        const start = performance.now()
        const tick = () => {
          if (cancelled) return
          const iframe = target.querySelector("iframe")
          if (iframe && iframe.contentWindow) {
            setIsReady(true)
          } else if (performance.now() - start < 2500) {
            requestAnimationFrame(tick)
          } else if (!retried) {
            retried = true
            root.innerHTML = ""
            setTimeout(mount, 300)
          }
        }
        requestAnimationFrame(tick)
      }

      loader.addEventListener("load", markReady)
      loader.addEventListener("error", () => {
        if (!retried && !cancelled) {
          retried = true
          root.innerHTML = ""
          setTimeout(mount, 600)
        }
      })

      root.appendChild(loader)
    }

    const timeoutId = window.setTimeout(mount, 50)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      if (root) {
        root.innerHTML = ""
      }
      scriptLoadedRef.current = false
    }
  }, [widgetLanguage])

  return (
    <div className="calendar-wrapper">
      {!isReady && (
        <div className="calendar-loading">
          <div className="loading-spinner"></div>
          <p>{locale === "ar" ? "جاري تحميل التقويم..." : "Loading calendar..."}</p>
        </div>
      )}

      <div ref={containerRef} className="calendar-inner" style={{ opacity: isReady ? 1 : 0 }}></div>

      <div
        className="bottom-blocker"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          return false
        }}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          return false
        }}
        onTouchStart={(event) => {
          event.preventDefault()
          event.stopPropagation()
          return false
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          return false
        }}
      >
        <div className="liirat-branding">
          <span className="brand-icon" role="img" aria-hidden="true">
            📊
          </span>
          Liirat News
        </div>
      </div>

      <style>{`
        .calendar-wrapper {
          position: relative;
          width: 100%;
          max-width: 100%;
          min-height: 800px;
          height: auto;
          background: #ffffff;
          overflow: hidden;
          box-sizing: border-box;
        }

        .calendar-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 100;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 16px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #7cb342;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .calendar-loading p {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }

        .calendar-inner {
          position: relative;
          width: 100%;
          max-width: 100%;
          height: 100%;
          min-height: 800px;
          box-sizing: border-box;
          transition: opacity 0.3s ease;
        }

        #economicCalendarWidget {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          min-height: 800px !important;
          box-sizing: border-box !important;
          overflow-x: hidden !important;
        }

        #economicCalendarWidget iframe {
          width: 100% !important;
          max-width: 100% !important;
          height: 800px !important;
          min-height: 800px !important;
          border: none !important;
          box-sizing: border-box !important;
          overflow-x: hidden !important;
        }

        .calendar-wrapper .ecw-copyright,
        .calendar-wrapper .ecw-copyright *,
        .calendar-inner .ecw-copyright,
        .calendar-inner .ecw-copyright * {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          left: -9999px !important;
        }

        .calendar-wrapper a,
        .calendar-inner a {
          pointer-events: none !important;
          cursor: default !important;
          user-select: none !important;
        }

        .bottom-blocker {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 85px;
          background: linear-gradient(to top,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0.98) 50%,
            rgba(255, 255, 255, 0.8) 80%,
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 10000;
          pointer-events: auto !important;
          cursor: default !important;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 12px;
          user-select: none;
          touch-action: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .liirat-branding {
          font-family: 'Noto Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #7cb342;
          text-align: center;
          letter-spacing: 0.5px;
          pointer-events: none;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 20px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .brand-icon {
          font-size: 18px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .calendar-wrapper *[class*="copyright"],
        .calendar-wrapper *[class*="brand"],
        .calendar-wrapper *[class*="logo"],
        .calendar-wrapper *[class*="footer"],
        .calendar-wrapper *[href*="mql5"],
        .calendar-wrapper *[href*="tradays"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }

        .calendar-wrapper a[href*="mql5.com"],
        .calendar-wrapper a[href*="calendar.widget"] {
          display: none !important;
          position: absolute !important;
          left: -9999px !important;
          pointer-events: none !important;
        }

        .calendar-wrapper,
        .calendar-inner,
        #economicCalendarWidget,
        #economicCalendarWidget * {
          overflow-x: hidden !important;
        }

        @media (max-width: 768px) {
          .calendar-wrapper {
            min-height: 700px;
          }
          .calendar-inner {
            min-height: 700px;
          }
          #economicCalendarWidget {
            min-height: 700px !important;
          }
          #economicCalendarWidget iframe {
            height: 700px !important;
            min-height: 700px !important;
          }
          .bottom-blocker {
            height: 75px;
            padding-bottom: 10px;
          }
          .liirat-branding {
            font-size: 14px;
            padding: 6px 16px;
          }
          .brand-icon {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .calendar-wrapper {
            min-height: 600px;
          }
          .calendar-inner {
            min-height: 600px;
          }
          #economicCalendarWidget {
            min-height: 600px !important;
          }
          #economicCalendarWidget iframe {
            height: 600px !important;
            min-height: 600px !important;
          }
          .bottom-blocker {
            height: 70px;
            padding-bottom: 8px;
          }
          .liirat-branding {
            font-size: 13px;
            padding: 5px 14px;
          }
          .brand-icon {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  )
}

export default memo(EconomicCalendarWidgetComponent)
