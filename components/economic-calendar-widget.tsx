"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/hooks/use-locale"

type ChatRole = "assistant" | "user"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

const TEXT = {
  loading: {
    en: "Loading calendar...",
    ar: "جاري تحميل التقويم...",
  },
  reset: {
    en: "Back to Today",
    ar: "العودة لليوم",
  },
  refresh: {
    en: "Refresh Feed",
    ar: "تحديث البيانات",
  },
  header: {
    en: "Liirat Insight",
    ar: "مساعد ليرات",
  },
  chatGreeting: {
    en: "Hi! Ask me about today's releases or weekly outlooks and I'll translate them into actionable insights.",
    ar: "مرحباً! اسألني عن بيانات اليوم أو نظرة الأسبوع وسأقدم لك ملخصاً وتحليلاً سريعاً.",
  },
  chatPlaceholder: {
    en: "Ask about an event or currency impact…",
    ar: "اسأل عن حدث أو تأثيره على العملات...",
  },
  chatTyping: {
    en: "Analysing latest data…",
    ar: "جاري تحليل البيانات...",
  },
}

function buildAssistantResponse(locale: "en" | "ar", prompt: string): string {
  const lower = prompt.toLowerCase()

  if (lower.includes("cpi") || lower.includes("inflation") || lower.includes("معدل")) {
    return locale === "ar"
      ? "تقارير التضخم غالباً ما تحرك توقعات أسعار الفائدة. زيادة القراءة تدعم عادة قوة العملة لأنها ترفع احتمالية التشديد النقدي، بينما قراءة أضعف قد تضعف العملة مع توقعات خفض الفائدة."
      : "Inflation releases recalibrate rate expectations. A hotter read typically supports the currency through tighter policy bets, while a softer print pressures it as rate cuts move back in play."
  }

  if (lower.includes("fed") || lower.includes("fomc") || lower.includes("الفيدرالي")) {
    return locale === "ar"
      ? "قرارات الفيدرالي تؤثر على كل الأصول الحساسة للدولار. راقب النبرة حول التضخم والنمو؛ أي إشارة للتشديد تدفع عوائد السندات صعوداً وتضغط على الذهب والعملات المرتبطة بالدولار."
      : "FOMC language drives every USD-sensitive asset. Watch their tone on inflation and growth; a hawkish tilt props up Treasury yields and weighs on gold and high-beta FX."
  }

  if (lower.includes("gold") || lower.includes("xau") || lower.includes("ذهب")) {
    return locale === "ar"
      ? "الذهب يستجيب لتوقعات الفائدة وحركة الدولار. يُنصح بمراقبة عوائد السندات الحقيقية وحركة USD/TRY إذا كنت تقيّم الذهب بالليرة التركية."
      : "Gold trades inverse to real yields and dollar momentum. Track real Treasury yields plus USD/TRY if you're pricing Turkish lira benchmarks."
  }

  if (lower.includes("weekly") || lower.includes("week") || lower.includes("الأسبوع")) {
    return locale === "ar"
      ? "لنظرة أسبوعية متوازنة، اجمع بين البيانات الرائدة (مؤشرات مديري المشتريات، مبيعات التجزئة) وقرارات البنوك المركزية. تأكد من إعادة ضبط التقويم إلى 'اليوم' بعد المتابعة الأسبوعية لتجنب تفويت الإصدارات عالية التأثير."
      : "For a weekly view, blend forward-looking prints (PMIs, retail sales) with central-bank speeches. Remember to reset the calendar to 'Today' after scanning the week so high-impact releases stay front-and-center."
  }

  if (lower.includes("impact") || lower.includes("تأثير") || lower.includes("market")) {
    return locale === "ar"
      ? "اعرف قوة التأثير من خلال رمز اللون في التقويم: اللون الداكن يشير لأحداث عالية المخاطر. راقب تقارير نفس القطاع المتتالية، فالتأثير يتضاعف عندما تتقاطع البيانات مع اتجاه السياسة النقدية."
      : "Gauge impact via the calendar's color coding—darker bands mean heavier volatility. Clustered events in the same sector amplify moves, especially when they align with the prevailing policy narrative."
  }

  return locale === "ar"
    ? "اطرح أي سؤال حول حدث اقتصادي، دولة معينة، أو تأثير محتمل على العملات والسلع وسأقدم لك تلخيصاً فورياً."
    : "Feel free to ask about any economic release, currency, or asset-class impact and I'll surface a concise take within a couple of seconds."
}

function EconomicCalendarWidgetComponent() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const scriptLoadedRef = useRef(false)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)

  const { locale } = useLocale()
  const language = locale === "ar" ? "ar" : "en"

  const [isReady, setIsReady] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [reloadSignal, setReloadSignal] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: TEXT.chatGreeting[language],
    },
  ])

  const widgetLanguage = language

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
        const waitForIframe = () => {
          if (cancelled) return
            const iframe = target.querySelector<HTMLIFrameElement>("iframe")
          if (iframe) {
            iframe.setAttribute("tabindex", "-1")
            iframe.setAttribute(
              "title",
              language === "ar" ? "تقويم اقتصادي للعرض فقط" : "Economic calendar (read-only)",
            )
            setIsReady(true)
            return
          }

          if (performance.now() - start < 6500) {
            requestAnimationFrame(waitForIframe)
          } else if (!retried) {
            retried = true
            root.innerHTML = ""
            window.setTimeout(mount, 480)
          }
        }

        requestAnimationFrame(waitForIframe)
      }

      loader.addEventListener("load", markReady)
      loader.addEventListener("error", () => {
        if (!retried && !cancelled) {
          retried = true
          root.innerHTML = ""
          window.setTimeout(mount, 600)
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
  }, [widgetLanguage, resetSignal, reloadSignal])

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, chatLoading])

  const handleResetToToday = () => {
    setResetSignal((value) => value + 1)
  }

  const handleRefresh = () => {
    setReloadSignal((value) => value + 1)
  }

  const handleToggleChat = () => {
    setChatOpen((prev) => !prev)
  }

  const assistantDelay = useMemo(() => (language === "ar" ? 900 : 750), [language])

  const handleChatSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userContent = chatInput.trim()
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: userContent,
    }

    setMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setChatLoading(true)

    window.setTimeout(() => {
      const response: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: buildAssistantResponse(language, userContent),
      }
      setMessages((prev) => [...prev, response])
      setChatLoading(false)
    }, assistantDelay + Math.random() * 400)
  }

  return (
    <div className="calendar-wrapper" dir={language === "ar" ? "rtl" : "ltr"} data-ready={isReady}>
      <div className="calendar-controls">
        <div className="calendar-controls__actions">
          <button type="button" onClick={handleResetToToday} className="control-button">
            {TEXT.reset[language]}
          </button>
          <button type="button" onClick={handleRefresh} className="control-button control-button--ghost">
            {TEXT.refresh[language]}
          </button>
        </div>
      </div>

      {!isReady && (
        <div className="calendar-loading">
          <div className="loading-spinner" />
          <p>{TEXT.loading[language]}</p>
        </div>
      )}

        <div className="calendar-inner" data-ready={isReady}>
          <div ref={containerRef} className="calendar-inner__host" />
          <div className="calendar-inner__mask" aria-hidden="true" />
          <div className="calendar-inner__footer" aria-hidden="true">
            <span className="calendar-inner__footer-label">
              {language === "ar" ? "عرض للقراءة فقط" : "Display only"}
            </span>
          </div>
        </div>

      <div className="bottom-blocker" aria-hidden="true">
        <button
          type="button"
          className={`brand-pill${chatOpen ? " brand-pill--active" : ""}`}
          onClick={handleToggleChat}
          aria-pressed={chatOpen}
          aria-expanded={chatOpen}
          aria-controls="calendar-chat"
        >
          <span className="brand-pill__emblem" aria-hidden="true" />
          <span className="brand-pill__label">{TEXT.header[language]}</span>
        </button>
      </div>

      <div id="calendar-chat" className={`calendar-chat${chatOpen ? " calendar-chat--open" : ""}`}>
        <div className="calendar-chat__header">
          <div>
            <span className="calendar-chat__title">{TEXT.header[language]}</span>
            <span className="calendar-chat__subtitle">
              {language === "ar" ? "تحليلات فورية لبيانات الاقتصاد" : "Instant context for macro releases"}
            </span>
          </div>
          <button type="button" className="calendar-chat__close" onClick={handleToggleChat} aria-label="Close assistant">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="calendar-chat__body" ref={chatBodyRef}>
          {messages.map((message) => (
            <div key={message.id} className={`chat-message chat-message--${message.role}`}>
              <div className="chat-message__bubble">{message.content}</div>
            </div>
          ))}
          {chatLoading && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-message__bubble chat-message__bubble--typing">
                <span />
                <span />
                <span />
              </div>
              <div className="chat-message__hint">{TEXT.chatTyping[language]}</div>
            </div>
          )}
        </div>
        <form className="calendar-chat__form" onSubmit={handleChatSubmit}>
          <input
            type="text"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder={TEXT.chatPlaceholder[language]}
            disabled={chatLoading}
            className="calendar-chat__input"
          />
          <button type="submit" className="calendar-chat__submit" disabled={chatLoading || !chatInput.trim()}>
            <span>{language === "ar" ? "إرسال" : "Send"}</span>
          </button>
        </form>
      </div>

      <style>{`
        .calendar-wrapper {
          position: relative;
          width: 100%;
          max-width: 100%;
          min-height: 840px;
          height: auto;
          background: linear-gradient(180deg, rgba(250, 252, 250, 0.98), rgba(233, 243, 236, 0.94));
          border-radius: 32px;
          border: 1px solid rgba(192, 214, 202, 0.6);
          box-shadow: 0 28px 80px rgba(26, 46, 31, 0.16);
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: clamp(22px, 4vw, 32px) clamp(20px, 3vw, 32px) 140px;
        }

        [data-theme="dark"] .calendar-wrapper,
        .dark .calendar-wrapper {
          background: linear-gradient(185deg, rgba(9, 16, 15, 0.94), rgba(12, 22, 18, 0.88));
          border-color: rgba(70, 120, 86, 0.35);
          box-shadow: 0 30px 90px rgba(2, 6, 23, 0.65);
        }

        .calendar-controls {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: clamp(16px, 3vw, 28px);
          z-index: 5;
          pointer-events: none;
        }


        .calendar-controls__actions {
          display: flex;
          gap: 10px;
          pointer-events: auto;
        }

        .control-button {
          position: relative;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: rgba(14, 43, 24, 0.88);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(233, 245, 238, 0.92));
          border: 1px solid rgba(192, 214, 202, 0.7);
          box-shadow: 0 18px 36px rgba(26, 46, 31, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6);
          transition: transform 160ms ease, box-shadow 200ms ease, border-color 160ms ease;
        }

        .control-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 42px rgba(26, 46, 31, 0.22);
          border-color: rgba(57, 179, 107, 0.55);
        }

        .control-button:active {
          transform: translateY(0);
        }

        .control-button--ghost {
          background: rgba(255, 255, 255, 0.6);
          border-color: rgba(192, 214, 202, 0.5);
          color: rgba(24, 62, 36, 0.72);
        }

        [data-theme="dark"] .control-button,
        .dark .control-button {
          background: linear-gradient(135deg, rgba(16, 33, 25, 0.88), rgba(12, 27, 21, 0.92));
          border-color: rgba(70, 120, 86, 0.45);
          color: rgba(214, 244, 226, 0.92);
          box-shadow: 0 18px 40px rgba(4, 12, 9, 0.45);
        }

        .calendar-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(14px);
          padding: 34px 44px;
          border-radius: 24px;
          border: 1px solid rgba(209, 223, 216, 0.55);
          box-shadow: 0 20px 50px rgba(26, 46, 31, 0.22);
        }

        [data-theme="dark"] .calendar-loading,
        .dark .calendar-loading {
          background: rgba(12, 20, 18, 0.82);
          border-color: rgba(70, 120, 86, 0.45);
          color: rgba(214, 244, 226, 0.92);
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          margin: 0 auto 14px;
          border-radius: 50%;
          border: 3px solid rgba(57, 179, 107, 0.18);
          border-top: 3px solid rgba(57, 179, 107, 0.92);
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .calendar-loading p {
          color: rgba(24, 68, 38, 0.76);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        [data-theme="dark"] .calendar-loading p,
        .dark .calendar-loading p {
          color: rgba(214, 244, 226, 0.86);
        }

        .calendar-inner {
          position: relative;
          width: 100%;
          max-width: 100%;
          min-height: 760px;
          flex: 1 1 auto;
          box-sizing: border-box;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(209, 223, 216, 0.5);
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .calendar-inner[data-ready="true"] {
          opacity: 1;
        }

        [data-theme="dark"] .calendar-inner,
        .dark .calendar-inner {
          background: rgba(12, 22, 18, 0.92);
          border-color: rgba(70, 120, 86, 0.35);
        }

        .calendar-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(140deg, rgba(233, 245, 238, 0.18), rgba(255, 255, 255, 0.05));
          mix-blend-mode: soft-light;
          z-index: 2;
        }

        [data-theme="dark"] .calendar-inner::before,
        .dark .calendar-inner::before {
          background: linear-gradient(140deg, rgba(14, 30, 24, 0.2), rgba(9, 18, 14, 0.35));
          mix-blend-mode: normal;
        }

        .calendar-inner__host {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: inherit;
          box-sizing: border-box;
          pointer-events: auto;
          isolation: isolate;
          z-index: 1;
        }

        .calendar-inner__host #economicCalendarWidget {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          min-height: inherit !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        .calendar-inner__host iframe {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          min-height: inherit !important;
          border: none !important;
          box-sizing: border-box !important;
          border-radius: 24px !important;
          overflow: hidden !important;
          background: transparent !important;
          transition: filter 0.35s ease;
        }

        [data-theme="dark"] .calendar-inner__host iframe,
        .dark .calendar-inner__host iframe {
          filter: invert(0.92) hue-rotate(180deg) saturate(0.9) contrast(0.95);
        }

        .calendar-inner__mask {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 3;
          background:
            linear-gradient(0deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0) 14%),
            linear-gradient(180deg, rgba(255, 255, 255, 0) 60%, rgba(10, 21, 16, 0.85) 100%);
          mix-blend-mode: multiply;
        }

        [data-theme="dark"] .calendar-inner__mask,
        .dark .calendar-inner__mask {
          background:
            linear-gradient(0deg, rgba(11, 20, 16, 0.72) 0%, rgba(11, 20, 16, 0) 14%),
            linear-gradient(180deg, rgba(11, 20, 16, 0) 58%, rgba(11, 20, 16, 0.9) 100%);
          mix-blend-mode: normal;
        }

        .calendar-inner__footer {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          height: 90px;
          z-index: 4;
          pointer-events: auto;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          cursor: not-allowed;
          background: linear-gradient(
            to top,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(255, 255, 255, 0.88) 55%,
            rgba(255, 255, 255, 0.48) 85%,
            rgba(255, 255, 255, 0) 100%
          );
        }

        [data-theme="dark"] .calendar-inner__footer,
        .dark .calendar-inner__footer {
          background: linear-gradient(
            to top,
            rgba(8, 15, 13, 0.95) 0%,
            rgba(10, 18, 15, 0.85) 55%,
            rgba(10, 18, 15, 0.45) 85%,
            rgba(10, 18, 15, 0) 100%
          );
        }

        .calendar-inner__footer-label {
          margin-bottom: 14px;
          border-radius: 999px;
          padding: 6px 16px;
          background: rgba(10, 22, 15, 0.72);
          border: 1px solid rgba(117, 204, 158, 0.28);
          color: rgba(214, 244, 226, 0.88);
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          pointer-events: none;
          backdrop-filter: blur(6px);
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        [data-theme="dark"] .calendar-inner__footer-label,
        .dark .calendar-inner__footer-label {
          background: rgba(4, 12, 9, 0.82);
          border-color: rgba(117, 204, 158, 0.45);
        }

        .calendar-inner[data-ready="true"] .calendar-inner__footer-label {
          opacity: 1;
          transform: translateY(0);
        }

        /* Mask all branding, links, and copyright */
        .calendar-wrapper [class*="copyright"],
        .calendar-wrapper [class*="brand"],
        .calendar-wrapper [class*="logo"],
        .calendar-wrapper [class*="footer"],
        .calendar-wrapper [class*="trademark"],
        .calendar-wrapper [href*="mql5"],
        .calendar-wrapper [href*="tradays"],
        .calendar-wrapper [id*="copyright"],
        .calendar-wrapper [id*="brand"],
        .calendar-wrapper a[href*="mql5.com"],
        .calendar-wrapper a[href*="tradays.com"],
        .calendar-wrapper a[href*="calendar.widget"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          left: -9999px !important;
          pointer-events: none !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          font-size: 0 !important;
          line-height: 0 !important;
        }
        
        /* Disable all links in calendar iframe area - COMPLETELY DISABLE CLICKING */
        .calendar-inner__host,
        .calendar-inner__host *,
        .calendar-inner__host a,
        .calendar-inner__host a *,
        .calendar-inner__host [href],
        .calendar-inner__host [href] *,
        .calendar-inner__host iframe,
        .calendar-inner__host iframe * {
          pointer-events: none !important;
          cursor: default !important;
          user-select: none !important;
        }
        
        /* Overlay to block all interactions */
        .calendar-inner__host::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 30;
          pointer-events: auto !important;
          cursor: default !important;
        }
        
        /* Mask bottom corners where links might appear */
        .calendar-inner__host::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: linear-gradient(
            to top,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(255, 255, 255, 0.85) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 20;
          pointer-events: none;
        }
        
        [data-theme="dark"] .calendar-inner__host::after,
        .dark .calendar-inner__host::after {
          background: linear-gradient(
            to top,
            rgba(12, 22, 18, 0.98) 0%,
            rgba(12, 22, 18, 0.85) 50%,
            rgba(12, 22, 18, 0) 100%
          );
        }

        .calendar-wrapper,
        .calendar-inner,
        .calendar-inner__host,
        #economicCalendarWidget,
        #economicCalendarWidget * {
          overflow-x: hidden !important;
        }

        .bottom-blocker {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 122px;
          background: linear-gradient(
            to top,
            rgba(250, 252, 250, 0.98) 0%,
            rgba(236, 244, 238, 0.88) 55%,
            rgba(236, 244, 238, 0.42) 85%,
            rgba(236, 244, 238, 0) 100%
          );
          z-index: 15;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          pointer-events: none;
        }

        [data-theme="dark"] .bottom-blocker,
        .dark .bottom-blocker {
          background: linear-gradient(
            to top,
            rgba(10, 17, 14, 0.96) 0%,
            rgba(11, 20, 16, 0.82) 55%,
            rgba(11, 20, 16, 0.45) 85%,
            rgba(11, 20, 16, 0) 100%
          );
        }

        .brand-pill {
          pointer-events: auto;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 14px 22px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 248, 243, 0.94));
          border: 1px solid rgba(192, 214, 202, 0.7);
          box-shadow:
            0 22px 60px rgba(26, 46, 31, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          color: rgba(24, 62, 36, 0.9);
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: transform 180ms ease, box-shadow 220ms ease, border-color 180ms ease;
        }

        .brand-pill:hover {
          transform: translateY(-3px) scale(1.015);
          box-shadow:
            0 26px 70px rgba(26, 46, 31, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.75);
          border-color: rgba(57, 179, 107, 0.5);
        }

        .brand-pill--active {
          background: linear-gradient(135deg, rgba(57, 179, 107, 0.12), rgba(233, 243, 236, 0.92));
          border-color: rgba(57, 179, 107, 0.55);
          box-shadow:
            0 28px 72px rgba(57, 179, 107, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        [data-theme="dark"] .brand-pill,
        .dark .brand-pill {
          background: linear-gradient(135deg, rgba(12, 26, 20, 0.92), rgba(18, 32, 26, 0.9));
          border-color: rgba(70, 120, 86, 0.45);
          color: rgba(214, 244, 226, 0.92);
          box-shadow: 0 24px 60px rgba(2, 12, 7, 0.55);
        }

        .brand-pill__emblem {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background-image: url("/images/liirat-logo.png");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 0 0 18px rgba(57, 179, 107, 0.35);
        }

        .brand-pill__label {
          text-transform: uppercase;
          font-size: 0.74rem;
          letter-spacing: 0.38em;
        }

        .calendar-chat {
          position: absolute;
          bottom: 136px;
          inset-inline-end: clamp(18px, 4vw, 36px);
          width: min(420px, calc(100% - 32px));
          max-height: 460px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(192, 214, 202, 0.6);
          box-shadow: 0 32px 90px rgba(26, 46, 31, 0.25);
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(12px) scale(0.97);
          pointer-events: none;
          transition: opacity 200ms ease, transform 200ms ease;
          z-index: 25;
        }

        [dir="rtl"] .calendar-chat {
          inset-inline-start: clamp(18px, 4vw, 36px);
          inset-inline-end: auto;
        }

        [data-theme="dark"] .calendar-chat,
        .dark .calendar-chat {
          background: rgba(10, 18, 15, 0.94);
          border-color: rgba(70, 120, 86, 0.45);
          box-shadow: 0 34px 90px rgba(2, 12, 7, 0.6);
        }

        .calendar-chat--open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .calendar-chat__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(192, 214, 202, 0.45);
        }

        .calendar-chat__title {
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.05em;
          color: rgba(24, 62, 36, 0.92);
        }

        .calendar-chat__subtitle {
          display: block;
          margin-top: 2px;
          font-size: 0.72rem;
          color: rgba(24, 62, 36, 0.62);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        [data-theme="dark"] .calendar-chat__title,
        [data-theme="dark"] .calendar-chat__subtitle,
        .dark .calendar-chat__title,
        .dark .calendar-chat__subtitle {
          color: rgba(214, 244, 226, 0.88);
        }

        .calendar-chat__close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(192, 214, 202, 0.55);
          background: rgba(255, 255, 255, 0.8);
          color: rgba(24, 62, 36, 0.8);
          font-size: 1.2rem;
          line-height: 1;
          display: grid;
          place-items: center;
          transition: transform 160ms ease, background 160ms ease;
        }

        .calendar-chat__close:hover {
          transform: rotate(6deg) scale(1.08);
          background: rgba(57, 179, 107, 0.16);
          border-color: rgba(57, 179, 107, 0.4);
        }

        .calendar-chat__body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .calendar-chat__body::-webkit-scrollbar {
          width: 6px;
        }

        .calendar-chat__body::-webkit-scrollbar-thumb {
          background: rgba(57, 179, 107, 0.35);
          border-radius: 999px;
        }

        .chat-message {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .chat-message--assistant {
          flex-direction: row;
        }

        .chat-message--user {
          flex-direction: row-reverse;
        }

        .chat-message__bubble {
          max-width: 100%;
          padding: 12px 14px;
          border-radius: 16px;
          font-size: 0.86rem;
          line-height: 1.6;
          box-shadow: 0 12px 28px rgba(26, 46, 31, 0.16);
        }

        .chat-message--assistant .chat-message__bubble {
          background: linear-gradient(135deg, rgba(233, 245, 238, 0.92), rgba(255, 255, 255, 0.92));
          border: 1px solid rgba(192, 214, 202, 0.55);
          color: rgba(28, 58, 38, 0.9);
        }

        .chat-message--user .chat-message__bubble {
          background: linear-gradient(135deg, rgba(57, 179, 107, 0.92), rgba(45, 162, 96, 0.92));
          border: 1px solid rgba(57, 179, 107, 0.75);
          color: rgba(255, 255, 255, 0.96);
        }

        [data-theme="dark"] .chat-message__bubble,
        .dark .chat-message__bubble {
          box-shadow: 0 16px 34px rgba(2, 12, 7, 0.55);
        }

        .chat-message__bubble--typing {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .chat-message__bubble--typing span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(57, 179, 107, 0.8);
          animation: typingBounce 1s infinite ease-in-out;
        }

        .chat-message__bubble--typing span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .chat-message__bubble--typing span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        .chat-message__hint {
          font-size: 0.7rem;
          color: rgba(57, 179, 107, 0.66);
          margin-top: 4px;
          letter-spacing: 0.06em;
        }

        .calendar-chat__form {
          padding: 16px 18px;
          border-top: 1px solid rgba(192, 214, 202, 0.45);
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .calendar-chat__input {
          flex: 1;
          border-radius: 18px;
          border: 1px solid rgba(192, 214, 202, 0.6);
          background: rgba(255, 255, 255, 0.9);
          padding: 12px 16px;
          font-size: 0.85rem;
          color: rgba(24, 62, 36, 0.9);
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .calendar-chat__input:focus {
          outline: none;
          border-color: rgba(57, 179, 107, 0.6);
          box-shadow: 0 0 0 3px rgba(57, 179, 107, 0.16);
        }

        .calendar-chat__submit {
          padding: 12px 18px;
          border-radius: 16px;
          border: none;
          font-size: 0.82rem;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(57, 179, 107, 0.92), rgba(45, 162, 96, 0.92));
          color: rgba(255, 255, 255, 0.95);
          box-shadow: 0 16px 30px rgba(57, 179, 107, 0.24);
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }

        .calendar-chat__submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .calendar-chat__submit:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 36px rgba(57, 179, 107, 0.3);
        }

        @media (max-width: 992px) {
          .calendar-wrapper {
            min-height: 760px;
          }

          .calendar-inner,
          .calendar-inner__host,
          .calendar-inner__host #economicCalendarWidget,
          .calendar-inner__host iframe {
            min-height: 760px !important;
            height: 760px !important;
          }
          .calendar-inner__footer {
            height: 88px;
          }
        }

        @media (max-width: 768px) {
          .calendar-wrapper {
            border-radius: 28px;
            min-height: 680px;
          }

          .calendar-controls {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .calendar-controls__actions {
            justify-content: flex-start;
          }

          .calendar-inner,
          .calendar-inner__host,
          .calendar-inner__host #economicCalendarWidget,
          .calendar-inner__host iframe {
            min-height: 680px !important;
            height: 680px !important;
          }

          .calendar-chat {
            width: calc(100% - 36px);
            inset-inline: 18px;
          }

          .calendar-inner__footer {
            height: 82px;
          }
        }

        @media (max-width: 576px) {
          .calendar-wrapper {
            min-height: 640px;
          }

          .calendar-controls__status {
            justify-content: center;
          }

          .control-button,
          .control-button--ghost {
            flex: 1;
            text-align: center;
          }

          .calendar-inner,
          .calendar-inner__host,
          .calendar-inner__host #economicCalendarWidget,
          .calendar-inner__host iframe {
            min-height: 640px !important;
            height: 640px !important;
          }

          .calendar-chat {
            bottom: 110px;
            max-height: 400px;
          }

          .calendar-inner__footer {
            height: 76px;
          }
        }

        @media (max-width: 430px) {
          .calendar-wrapper {
            min-height: 620px;
          }

          .brand-pill {
            width: calc(100% - 36px);
            justify-content: center;
          }

          .brand-pill__label {
            font-size: 0.68rem;
            letter-spacing: 0.28em;
          }

          .calendar-chat {
            width: calc(100% - 36px);
            inset-inline: 18px;
          }

          .calendar-inner,
          .calendar-inner__host,
          .calendar-inner__host #economicCalendarWidget,
          .calendar-inner__host iframe {
            min-height: 620px !important;
            height: 620px !important;
          }

          .calendar-inner__footer {
            height: 70px;
          }
        }
      `}</style>
    </div>
  )
}

export default memo(EconomicCalendarWidgetComponent)
