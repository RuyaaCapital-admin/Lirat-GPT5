"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { ChatInterface } from "@/components/ai/chat-interface"
import { QuickActions } from "@/components/ai/quick-actions"
import { AiChartPlaceholder } from "@/components/ai/chart-placeholder"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

// Dynamically import ChatKit components with SSR disabled to prevent hydration errors
const LiiratChatBubble = dynamic(
  () => import("@/components/ai/chat-bubble").then((mod) => ({ default: mod.LiiratChatBubble })),
  {
    ssr: false,
    loading: () => null,
  }
)

const LiiratChatDesktop = dynamic(
  () => import("@/components/ai/chat-desktop").then((mod) => ({ default: mod.LiiratChatDesktop })),
  {
    ssr: false,
    loading: () => null,
  }
)

const CHART_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const
type ChartTimeframe = (typeof CHART_TIMEFRAMES)[number]

export default function AIPage() {
  const { locale } = useLocale()
  const chatRef = useRef<any>(null)
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1h")

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedSymbol = window.localStorage.getItem("ai-chart-symbol")
    const storedTimeframe = window.localStorage.getItem("ai-chart-timeframe")
    if (storedSymbol) {
      setSymbol(storedSymbol)
    }
    if (storedTimeframe && (CHART_TIMEFRAMES as readonly string[]).includes(storedTimeframe)) {
      setTimeframe(storedTimeframe as ChartTimeframe)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("ai-chart-symbol", symbol)
  }, [symbol])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("ai-chart-timeframe", timeframe)
  }, [timeframe])

  const handleQuickAction = (message: string) => {
    if (chatRef.current?.sendMessage) {
      chatRef.current.sendMessage(message)
    }
  }

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "ai")}</h1>
        <p className="wrap-break-word text-muted-foreground">
          {locale === "ar"
            ? "مساعدك الذكي للتداول مع رؤى السوق والتحكم في الرسوم البيانية والمشورة المخصصة"
            : "Your intelligent trading assistant powered by advanced AI. Get market insights, control charts, and receive personalized trading advice."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ChatInterface ref={chatRef} />
          <AiChartPlaceholder />
        </div>

        <div className="space-y-6">
          <QuickActions onActionClick={handleQuickAction} />

          <div className="rounded-lg border bg-card p-4 backdrop-blur supports-backdrop-filter:bg-card/80">
            <h3 className="mb-3 truncate font-semibold">{locale === "ar" ? "إمكانيات الذكاء الاصطناعي" : "AI Capabilities"}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <span className="wrap-break-word">{locale === "ar" ? "تحليل السوق في الوقت الفعلي" : "Real-time market analysis"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <span className="wrap-break-word">
                  {locale === "ar" ? "التحكم في الرسوم البيانية وتعيين المستويات" : "Chart control and level setting"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <span className="wrap-break-word">
                  {locale === "ar" ? "توصيات استراتيجية التداول" : "Trading strategy recommendations"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <span className="wrap-break-word">{locale === "ar" ? "نصائح إدارة المخاطر" : "Risk management advice"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <span className="wrap-break-word">
                  {locale === "ar" ? "تحليل الأحداث الاقتصادية" : "Economic event analysis"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 backdrop-blur supports-backdrop-filter:bg-muted/40">
            <h3 className="mb-3 truncate font-semibold">{locale === "ar" ? "نصائح الاستخدام" : "Usage Tips"}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="wrap-break-word">
                • {locale === "ar" ? "اسأل أسئلة محددة حول اتجاهات السوق" : "Ask specific questions about market trends"}
              </p>
              <p className="wrap-break-word">
                • {locale === "ar" ? "اطلب تعديلات الرسم البياني مثل إضافة دعم" : "Request chart modifications like add support"}
              </p>
              <p className="wrap-break-word">
                •{" "}
                {locale === "ar" ? "احصل على مشورة الاستراتيجية لظروف السوق المختلفة" : "Get strategy advice for different market conditions"}
              </p>
              <p className="wrap-break-word">
                • {locale === "ar" ? "حلل الأحداث الاقتصادية وتأثيرها" : "Analyze economic events and their impact"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Full ChatKit panel */}
      <section className="mt-6 space-y-4">
        <LiiratChatDesktop />

        {/* Mobile: Floating bubble (only visible on small screens) */}
        <div className="lg:hidden">
          <LiiratChatBubble />
        </div>
      </section>
    </div>
  )
}
