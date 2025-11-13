"use client"

import { useRef } from "react"
import { ChatInterface } from "@/components/ai/chat-interface"
import { QuickActions } from "@/components/ai/quick-actions"
import { useEffect, useMemo } from "react"
import { LightChart } from "@/components/LightChart"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"
import { useState } from "react"

export default function AIPage() {
  const { locale } = useLocale()
  const chatRef = useRef<any>(null)
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d">("1h")

  const availableTimeframes = useMemo<("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d")[]>(() => ["1m", "5m", "15m", "30m", "1h", "4h", "1d"], [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedSymbol = window.localStorage.getItem("ai-chart-symbol")
    const storedTimeframe = window.localStorage.getItem("ai-chart-timeframe") as
      | "1m"
      | "5m"
      | "15m"
      | "30m"
      | "1h"
      | "4h"
      | "1d"
      | null
    if (storedSymbol) {
      setSymbol(storedSymbol)
    }
    if (storedTimeframe && availableTimeframes.includes(storedTimeframe)) {
      setTimeframe(storedTimeframe)
    }
  }, [availableTimeframes])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("ai-chart-symbol", symbol)
  }, [symbol])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("ai-chart-timeframe", timeframe)
  }, [timeframe])

  const handleQuickAction = (message: string) => {
    if (chatRef.current && chatRef.current.sendMessage) {
      chatRef.current.sendMessage(message)
    }
  }

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "ai")}</h1>
        <p className="text-muted-foreground break-words">
          {locale === "ar"
            ? "مساعدك الذكي للتداول مع رؤى السوق والتحكم في الرسوم البيانية والمشورة المخصصة"
            : "Your intelligent trading assistant powered by advanced AI. Get market insights, control charts, and receive personalized trading advice."}
        </p>
      </div>

        {/* Main Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Side - Chat and Chart */}
          <div className="lg:col-span-2 space-y-6">
            <ChatInterface ref={chatRef} />
            <LightChart symbol={symbol} onSymbolChange={setSymbol} timeframe={timeframe} onTimeframeChange={setTimeframe} />
          </div>

          {/* Right Side - Quick Actions and Info */}
          <div className="space-y-6">
            <QuickActions onActionClick={handleQuickAction} />

            {/* AI Capabilities */}
            <div className="rounded-lg border bg-card p-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <h3 className="font-semibold mb-3 truncate">
                {locale === "ar" ? "إمكانيات الذكاء الاصطناعي" : "AI Capabilities"}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="break-words">
                    {locale === "ar" ? "تحليل السوق في الوقت الفعلي" : "Real-time market analysis"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="break-words">
                    {locale === "ar" ? "التحكم في الرسوم البيانية وتعيين المستويات" : "Chart control and level setting"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="break-words">
                    {locale === "ar" ? "توصيات استراتيجية التداول" : "Trading strategy recommendations"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="break-words">
                    {locale === "ar" ? "نصائح إدارة المخاطر" : "Risk management advice"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="break-words">
                    {locale === "ar" ? "تحليل الأحداث الاقتصادية" : "Economic event analysis"}
                  </span>
                </div>
              </div>
            </div>

            {/* Usage Tips */}
            <div className="rounded-lg border bg-muted/50 p-4 backdrop-blur supports-[backdrop-filter]:bg-muted/40">
              <h3 className="font-semibold mb-3 truncate">{locale === "ar" ? "نصائح الاستخدام" : "Usage Tips"}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="break-words">
                  •{" "}
                  {locale === "ar" ? "اسأل أسئلة محددة حول اتجاهات السوق" : "Ask specific questions about market trends"}
                </p>
                <p className="break-words">
                  •{" "}
                  {locale === "ar"
                    ? "اطلب تعديلات الرسم البياني مثل إضافة دعم"
                    : "Request chart modifications like add support"}
                </p>
                <p className="break-words">
                  •{" "}
                  {locale === "ar"
                    ? "احصل على مشورة الاستراتيجية لظروف السوق المختلفة"
                    : "Get strategy advice for different market conditions"}
                </p>
                <p className="break-words">
                  • {locale === "ar" ? "حلل الأحداث الاقتصادية وتأثيرها" : "Analyze economic events and their impact"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
}
