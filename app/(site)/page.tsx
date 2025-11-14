"use client"

import type { CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, BarChart2 } from "lucide-react"
import EconomicCalendarWidget from "@/components/economic-calendar-widget"
import { MarketOverviewCard } from "@/components/dashboard/market-overview-card"
import { HomeNewsRail } from "@/components/dashboard/home-news"
import PriceBoard from "@/components/PriceBoard"
import { useLocale } from "@/hooks/use-locale"

const heroMetrics = [
  {
    value: "AI",
    labelEn: "Agent workspace",
    labelAr: "مساحة الوكيل الذكي",
    accent: "from-emerald-400/70 to-emerald-500/60",
    href: "/ai",
  },
  {
    value: "45",
    labelEn: "Economic calendars",
    labelAr: "تقويمات اقتصادية نشطة",
    accent: "from-lime-400/70 to-lime-500/50",
    href: "/economic",
  },
  {
    value: "24/7",
    labelEn: "Editorial coverage",
    labelAr: "تغطية تحريرية",
    accent: "from-sky-400/70 to-sky-500/60",
    href: "/financial",
  },
]

export default function Dashboard() {
  const { locale } = useLocale()
  const isArabic = locale === "ar"

  return (
    <div
      className="space-y-12 rounded-[32px] bg-linear-to-br from-[#f4f8f2] via-[#eef5ef] to-[#e4f0e7] p-1 dark:from-[#050907] dark:via-[#0a120d] dark:to-[#050a07]"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[40px] border border-emerald-100/60 bg-linear-to-br from-white/95 via-emerald-50/70 to-white/80 shadow-[0_40px_120px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-emerald-500/20 dark:bg-linear-to-br dark:from-[#0c1510]/95 dark:via-[#0f1c14]/80 dark:to-[#0b130e]/85 dark:shadow-[0_36px_110px_rgba(4,8,6,0.85)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-28 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/30" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-sky-200/35 blur-[120px] dark:bg-sky-500/25" />
        </div>
        <div className="relative flex flex-col gap-10 p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6 lg:max-w-xl">
            <h1 className="hero-animate text-4xl font-bold leading-tight text-foreground md:text-[44px]" style={{ "--hero-delay": "0s" } as CSSProperties}>
              {isArabic ? "تداول متقن وإشارات واضحة." : "Elegant trading, translated clarity."}
            </h1>
            <p className="hero-animate text-base text-muted-foreground md:text-lg" style={{ "--hero-delay": "0.12s" } as CSSProperties}>
              {isArabic
                ? "مؤشرات الاقتصاد، حركة الليرة، ورسوم الأسواق المتقدمة في تجربة واحدة سلسة."
                : "Macro indicators, lira flows, and advanced market views in one refined experience."}
            </p>
              <div className="hero-animate flex flex-wrap gap-3" style={{ "--hero-delay": "0.22s" } as CSSProperties}>
                <Link
                  href="/economic"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_20px_40px_rgba(57,179,107,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(57,179,107,0.45)]"
                >
                  {isArabic ? "استكشف التقويم الاقتصادي" : "Explore the economic calendar"}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/ai"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:border-primary hover:text-primary dark:border-primary/40 dark:bg-background/70 dark:text-primary-foreground"
                >
                  {isArabic ? "شغّل وكيل التداول الذكي" : "Launch the AI trading agent"}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {heroMetrics.map((metric, index) => (
                <Link
                  key={metric.value}
                  href={metric.href}
                  className="hero-animate rounded-2xl border border-emerald-100/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-transform duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_55px_rgba(15,23,42,0.15)] backdrop-blur dark:border-emerald-500/20 dark:bg-[#0a1510]/80 dark:shadow-[0_18px_48px_rgba(5,10,7,0.75)]"
                  style={{ "--hero-delay": `${0.28 + index * 0.08}s` } as CSSProperties}
                >
                  <div className={`mb-3 h-0.5 w-12 rounded-full bg-linear-to-r ${metric.accent}`} />
                  <div className="text-2xl font-semibold text-foreground">{metric.value}</div>
                  <p className="text-sm text-muted-foreground">{isArabic ? metric.labelAr : metric.labelEn}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="hero-animate relative w-full max-w-xl self-stretch" style={{ "--hero-delay": "0.45s" } as CSSProperties}>
            <div className="absolute -right-10 top-10 h-44 w-44 rounded-full bg-primary/10 blur-2xl dark:bg-primary/20" />
            <div className="relative h-full overflow-hidden rounded-[32px] border border-white/40 bg-linear-to-br from-white/60 via-white/40 to-white/10 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:from-primary/5 dark:via-background/40 dark:to-background/60">
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

      {/* Price Board */}
      <PriceBoard />

      {/* Calendar */}
      <section className="space-y-6 rounded-[36px] border border-emerald-100/70 bg-linear-to-br from-white/95 to-emerald-50/60 p-6 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-emerald-500/15 dark:bg-linear-to-br dark:from-[#07100b]/90 dark:to-[#0f1f16]/85 dark:shadow-[0_30px_90px_rgba(4,8,6,0.85)] md:p-8">
        <div className="flex flex-col gap-4 border-b border-emerald-100/70 pb-6 dark:border-emerald-500/25 lg:flex-row lg:items-center lg:justify-between">
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
                ? "تتبع الأحداث الاقتصادية الهامة في الوقت الفعلي"
                : "Track important economic events in real-time"}
            </p>
          </div>
        </div>
        <EconomicCalendarWidget />
      </section>

      {/* Market + News */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[32px] border border-emerald-100/60 bg-white/92 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-lg dark:border-emerald-500/20 dark:bg-[#0a1510]/85 dark:shadow-[0_24px_70px_rgba(5,10,7,0.75)]">
          <MarketOverviewCard />
        </div>
        <div className="rounded-[32px] border border-emerald-100/60 bg-white/92 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-lg dark:border-emerald-500/20 dark:bg-[#0a1510]/85 dark:shadow-[0_24px_70px_rgba(5,10,7,0.75)]">
          <HomeNewsRail />
        </div>
      </section>
    </div>
  )
}
