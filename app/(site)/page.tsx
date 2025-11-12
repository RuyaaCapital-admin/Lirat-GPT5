"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, BarChart2, Globe2, ChartCandlestick, ShieldCheck } from "lucide-react"
import EconomicCalendarWidget from "@/components/economic-calendar-widget"
import { MarketOverviewCard } from "@/components/dashboard/market-overview-card"
import { NewsPreviewCard } from "@/components/dashboard/news-preview-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

const heroMetrics = [
  {
    value: "64+",
    labelEn: "Markets monitored",
    labelAr: "أسواق تحت المراقبة",
    accent: "from-emerald-400/70 to-emerald-500/60",
  },
  {
    value: "45",
    labelEn: "Economic calendars",
    labelAr: "تقويمات اقتصادية نشطة",
    accent: "from-lime-400/70 to-lime-500/50",
  },
  {
    value: "24/7",
    labelEn: "Sentiment radar",
    labelAr: "رادار المشاعر",
    accent: "from-sky-400/70 to-sky-500/60",
  },
]

const insightCards = [
  {
    titleEn: "Macro Radar",
    titleAr: "رادار الاقتصاد الكلي",
    descriptionEn: "Every major event translated and contextualised for traders who move fast.",
    descriptionAr: "كل حدث اقتصادي رئيسي مترجم ومفصل ليستفيد منه المتداول السريع.",
    icon: Globe2,
  },
  {
    titleEn: "Precision Calendar",
    titleAr: "تقويم دقيق",
    descriptionEn: "Transparent timelines with Liirat’s shield overlay to protect your focus.",
    descriptionAr: "جداول زمنية واضحة مع حماية ليرات للحفاظ على تركيزك.",
    icon: ShieldCheck,
  },
  {
    titleEn: "Live Market Tape",
    titleAr: "شريط السوق المباشر",
    descriptionEn: "TradingView charts, curated watchlists, and instant sentiment in one pane.",
    descriptionAr: "رسوم TradingView، قوائم مختارة، ومشاعر فورية في لوحة واحدة.",
    icon: ChartCandlestick,
  },
]

export default function Dashboard() {
  const { locale } = useLocale()
  const isArabic = locale === "ar"

  return (
    <div className="space-y-12" dir={isArabic ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[40px] border border-white/60 bg-white/85 shadow-[0_40px_120px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/80 dark:shadow-[0_30px_100px_rgba(2,6,23,0.65)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-28 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/30" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-sky-200/35 blur-[120px] dark:bg-sky-500/25" />
        </div>
        <div className="relative flex flex-col gap-10 p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6 lg:max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary dark:bg-primary/15 dark:text-primary-foreground/80">
              {isArabic ? "منصة ليرات للأسواق" : "Liirat Market Suite"}
            </span>
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-[44px]">
              {isArabic ? "اقتصاد واضح. تداول أنيق." : "Clarity for macro moves. Elegance for traders."}
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              {isArabic
                ? "منصة ليرات تجمع الاتجاهات الاقتصادية، التقويم الفوري، وأدوات التداول المتقدمة في تجربة واحدة راقية."
                : "Liirat brings macro signals, a live economic calendar, and advanced trading tools together inside a single, polished experience."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/economic"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_20px_40px_rgba(57,179,107,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(57,179,107,0.45)]"
              >
                {isArabic ? "استكشف التقويم الاقتصادي" : "Explore the economic calendar"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/markets"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:border-primary hover:text-primary dark:border-primary/40 dark:bg-background/70 dark:text-primary-foreground"
              >
                {isArabic ? "انتقل إلى لوحة الأسواق" : "Open market workspace"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.value}
                  className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-background/70 dark:shadow-[0_16px_40px_rgba(2,6,23,0.55)]"
                >
                  <div className={`mb-3 h-0.5 w-12 rounded-full bg-gradient-to-r ${metric.accent}`} />
                  <div className="text-2xl font-semibold text-foreground">{metric.value}</div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? metric.labelAr : metric.labelEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-full max-w-xl self-stretch">
            <div className="absolute -right-10 top-10 h-44 w-44 rounded-full bg-primary/10 blur-2xl dark:bg-primary/20" />
            <div className="relative h-full overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-br from-white/60 via-white/40 to-white/10 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:from-primary/5 dark:via-background/40 dark:to-background/60">
              <Image
                src="/images/liirat-logo.png"
                alt={isArabic ? "شعار ليرات" : "Liirat emblem"}
                fill
                className="object-contain opacity-60 mix-blend-multiply dark:opacity-50 dark:mix-blend-screen"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insightCards.map((card) => (
          <Card
            key={card.titleEn}
            className="relative overflow-hidden rounded-3xl border border-white/65 bg-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-background/75 dark:shadow-[0_22px_60px_rgba(2,6,23,0.6)]"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/40 via-transparent to-primary/30" />
            <CardHeader className="space-y-3 pb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-foreground/90">
                <card.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {isArabic ? card.titleAr : card.titleEn}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {isArabic ? card.descriptionAr : card.descriptionEn}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Calendar */}
      <section className="space-y-6 rounded-[36px] border border-white/60 bg-white/90 p-6 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/75 dark:shadow-[0_30px_90px_rgba(2,6,23,0.65)] md:p-8">
        <div className="flex flex-col gap-4 border-b border-white/60 pb-6 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
              <BarChart2 className="h-4 w-4" />
              {isArabic ? "التقويم الاقتصادي" : "Economic Calendar"}
            </p>
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
              {isArabic ? "نبض الأسواق الفوري" : "Real-time market pulse"}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              {isArabic
                ? "حافظ على تركيزك مع تقويم ليرات المدمج. يتم تحميل البيانات مباشرة ويستجيب للغة الواجهة، مع إخفاء كل العلامات الخارجية."
                : "Stay focused with the embedded Liirat calendar. It loads live data in your chosen language while masking every external brand layer."}
            </p>
          </div>
          <Link
            href="/economic"
            className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:text-primary dark:border-primary/40 dark:text-primary-foreground"
          >
            {isArabic ? "التفاصيل الكاملة" : "Full schedule"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-[30px] border border-white/60 bg-white/90 p-3 shadow-inner backdrop-blur dark:border-white/10 dark:bg-background/80">
          <EconomicCalendarWidget />
        </div>
      </section>

      {/* Market + News */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-[32px] border border-white/60 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-lg dark:border-white/10 dark:bg-background/75 dark:shadow-[0_24px_70px_rgba(2,6,23,0.6)]">
          <MarketOverviewCard />
        </div>
        <div className="space-y-6">
          <NewsPreviewCard type="economic" title={getTranslation(locale, "economicCalendar")} href="/economic" />
          <NewsPreviewCard
            type="financial"
            title={isArabic ? "أخبار ليرات المختارة" : "Liirat curated news"}
            href="/financial"
          />
        </div>
      </section>
    </div>
  )
}
