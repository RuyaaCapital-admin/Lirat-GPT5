"use client"

import EconomicCalendarWidget from "@/components/economic-calendar-widget"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

export default function EconomicPage() {
  const { locale } = useLocale()

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "economicCalendar")}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "أحداث اقتصادية حقيقية ومؤشرات من أكبر الاقتصادات العالمية"
            : "Real-time economic events and indicators from major economies worldwide"}
        </p>
      </div>

      <EconomicCalendarWidget />
    </div>
  )
}
