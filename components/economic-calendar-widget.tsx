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
          Liirat Markets
        </div>
      </div>

      <style>{`
        .calendar-wrapper {
          position: relative;
          width: 100%;
          max-width: 100%;
          min-height: 800px;
          height: auto;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(242, 248, 244, 0.92));
          border-radius: 30px;
          border: 1px solid rgba(209, 223, 216, 0.7);
          box-shadow: 0 28px 80px rgba(45, 64, 52, 0.12);
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
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(12px);
          padding: 32px 40px;
          border-radius: 24px;
          border: 1px solid rgba(209, 223, 216, 0.6);
          box-shadow: 0 18px 48px rgba(45, 64, 52, 0.18);
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          margin: 0 auto 14px;
          border: 3px solid rgba(57, 179, 107, 0.15);
          border-top: 3px solid rgba(57, 179, 107, 0.85);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .calendar-loading p {
          color: rgba(45, 64, 52, 0.65);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .calendar-inner {
          position: relative;
          width: 100%;
          max-width: 100%;
          height: 100%;
          min-height: 800px;
          box-sizing: border-box;
          transition: opacity 0.3s ease;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(209, 223, 216, 0.55);
          overflow: hidden;
        }

        .calendar-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(242, 248, 244, 0.16), rgba(255, 255, 255, 0.02));
          opacity: 0.35;
        }

        #economicCalendarWidget {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          min-height: 800px !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        #economicCalendarWidget iframe {
          width: 100% !important;
          max-width: 100% !important;
          height: 800px !important;
          min-height: 800px !important;
          border: none !important;
          box-sizing: border-box !important;
          border-radius: 24px !important;
          overflow: hidden !important;
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
          height: 110px;
          background: linear-gradient(to top,
            rgba(242, 248, 244, 0.98) 0%,
            rgba(242, 248, 244, 0.82) 55%,
            rgba(242, 248, 244, 0.58) 80%,
            rgba(242, 248, 244, 0) 100%
          );
          z-index: 10000;
          pointer-events: auto !important;
          cursor: default !important;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 18px;
          user-select: none;
          touch-action: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .bottom-blocker::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(to top, rgba(242, 248, 244, 0.96), transparent 70%);
          pointer-events: none;
        }

        .bottom-blocker::after {
          content: "";
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          width: 170px;
          height: 54px;
          background-image: url("/images/liirat-logo.png");
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.45;
          pointer-events: none;
          filter: saturate(0.8);
        }

        .liirat-branding {
          font-family: 'Noto Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: rgba(45, 64, 52, 0.8);
          text-align: center;
          letter-spacing: 0.5px;
          pointer-events: none;
          text-shadow: 0 10px 30px rgba(45, 64, 52, 0.18);
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.94);
          padding: 9px 22px;
          border-radius: 9999px;
          border: 1px solid rgba(209, 223, 216, 0.6);
          box-shadow:
            0 16px 40px rgba(45, 64, 52, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.65);
        }

        .brand-icon {
          font-size: 17px;
          filter: drop-shadow(0 6px 12px rgba(45, 64, 52, 0.25));
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
            height: 98px;
            padding-bottom: 14px;
          }
          .liirat-branding {
            font-size: 14px;
            padding: 7px 18px;
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
        }

        @media (prefers-color-scheme: dark) {
          .calendar-wrapper {
            background: linear-gradient(165deg, rgba(12, 18, 30, 0.9), rgba(24, 34, 46, 0.88));
            border: 1px solid rgba(76, 116, 92, 0.3);
            box-shadow: 0 30px 90px rgba(2, 6, 23, 0.65);
          }

          .calendar-inner {
            background: rgba(14, 21, 32, 0.92);
            border-color: rgba(76, 116, 92, 0.25);
          }

          .calendar-inner::before {
            background: radial-gradient(circle at 20% 20%, rgba(18, 32, 44, 0.55), transparent 65%);
            opacity: 0.55;
          }

          #economicCalendarWidget iframe {
            border-radius: 24px !important;
          }

          .bottom-blocker {
            background: linear-gradient(to top,
              rgba(10, 18, 28, 0.96) 0%,
              rgba(10, 18, 28, 0.82) 55%,
              rgba(10, 18, 28, 0.48) 80%,
              rgba(10, 18, 28, 0) 100%
            );
          }

          .bottom-blocker::after {
            opacity: 0.35;
            filter: brightness(1.2);
          }

          .liirat-branding {
            background: rgba(19, 28, 41, 0.9);
            border-color: rgba(76, 116, 92, 0.4);
            color: rgba(218, 236, 227, 0.9);
            text-shadow: 0 8px 20px rgba(2, 6, 23, 0.6);
          }
        }

        .dark .calendar-loading {
          background: rgba(12, 20, 30, 0.75);
          border-color: rgba(76, 116, 92, 0.35);
        }
      `}</style>
    </div>
  )
}

export default memo(EconomicCalendarWidgetComponent)
