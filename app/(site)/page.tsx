"use client"

import { ArrowUpRight, Activity, TrendingUp, DollarSign, Bell } from "lucide-react"
import EconomicCalendarWidget from "@/components/economic-calendar-widget"
import { MarketOverviewCard } from "@/components/dashboard/market-overview-card"
import { NewsPreviewCard } from "@/components/dashboard/news-preview-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

export default function Dashboard() {
  const { locale } = useLocale()
  const isArabic = locale === "ar"

  const stats = [
    {
      label: isArabic ? "الأسواق النشطة" : "Active Markets",
      value: "15",
      description: isArabic ? "أدوات عالمية تحت المراقبة" : "Global instruments tracked live",
      icon: Activity,
      accent: "from-emerald-400/70 via-emerald-500/60 to-emerald-400/40",
    },
    {
      label: isArabic ? "حالة السوق" : "Market Status",
      value: isArabic ? "مباشر" : "Live",
      description: isArabic ? "تحديثات فورية للحركة" : "Real-time momentum updates",
      icon: TrendingUp,
      accent: "from-sky-400/70 via-sky-500/60 to-sky-400/40",
    },
    {
      label: isArabic ? "مصدر الأخبار" : "News Source",
      value: "Liirat",
      description: isArabic ? "ذكاء الأسواق من Liirat News" : "Liirat News market intelligence",
      icon: DollarSign,
      accent: "from-indigo-400/70 via-indigo-500/60 to-indigo-400/40",
    },
    {
      label: isArabic ? "التنبيهات" : "Alerts",
      value: "0",
      description: isArabic ? "فعّل أول تنبيه لك الآن" : "Set your first alert today",
      icon: Bell,
      accent: "from-amber-400/70 via-amber-500/60 to-amber-400/40",
    },
  ]

  return (
    <div className="space-y-10" dir={isArabic ? "rtl" : "ltr"}>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-slate-800/60 dark:bg-slate-900/80">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-lime-200/60 blur-3xl dark:bg-emerald-500/20" aria-hidden />
        <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-500/20" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:bg-primary/20">
              {isArabic ? "مدعوم من LiiratNews.com" : "Powered by LiiratNews.com"}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {isArabic ? "ذكاء ليرات للأسواق" : "LIIRAT Market Intelligence"}
            </h1>
            <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
              {isArabic
                ? "ابق في صدارة تحركات الأسواق مع بيانات فورية، تحليلات محدثة، وتقويم اقتصادي مبني على خبرة LiiratNews.com."
                : "Stay ahead of the market with real-time data, timely analysis, and the LiiratNews.com economic calendar at your fingertips."}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://liiratnews.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-xl dark:shadow-primary/40"
              >
                {isArabic ? "زيارة LiiratNews.com" : "Visit LiiratNews.com"}
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="/economic"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
              >
                {isArabic ? "عرض التقويم الكامل" : "View calendar details"}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex items-center rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-5 text-sm text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <span className="font-semibold text-primary">{isArabic ? "تغطية لحظية" : "Live Coverage"}</span>
            <span className="mx-3 h-4 w-px bg-slate-300/80 dark:bg-slate-600" aria-hidden />
            <span>{isArabic ? "منصة ليرات تجمع السوق والاقتصاد في لوحة واحدة." : "Liirat unifies markets and macro signals in a single hub."}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-900/80"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-200">{stat.label}</CardTitle>
              <stat.icon className="h-5 w-5 text-slate-400 dark:text-slate-300" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold font-mono text-slate-900 dark:text-slate-50">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/75">
        <div className="flex flex-col gap-4 border-b border-slate-200/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 dark:border-slate-700 dark:from-primary/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {isArabic ? "نبض التقويم الاقتصادي" : "Economic Calendar Pulse"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "استكشف أحداث السوق القادمة مباشرة داخل لوحة التحكم مع حماية العلامة التجارية لـ Liirat News."
                  : "Explore upcoming market-moving events directly in the dashboard with Liirat News branded protection."}
              </p>
            </div>
            <a
              href="https://liiratnews.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white/80 px-5 py-2 text-sm font-semibold text-primary transition hover:border-primary/60 hover:bg-white dark:border-primary/50 dark:bg-slate-900/60"
            >
              {isArabic ? "المزيد على LiiratNews.com" : "More on LiiratNews.com"}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {isArabic ? "تحديثات فورية" : "Real-time Broadcast"}
          </p>
        </div>
        <div className="p-4 md:p-6">
          <EconomicCalendarWidget />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="lg:col-span-1">
          <MarketOverviewCard />
        </div>
        <div className="space-y-6">
          <NewsPreviewCard
            type="economic"
            title={isArabic ? getTranslation("ar", "economicCalendar") : getTranslation("en", "economicCalendar")}
            href="/economic"
          />
          <NewsPreviewCard
            type="financial"
            title={isArabic ? getTranslation("ar", "liiratNews") : getTranslation("en", "liiratNews")}
            href="/financial"
          />
        </div>
      </section>
    </div>
  )
}
