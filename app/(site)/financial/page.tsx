"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/use-locale"
import { convertToEnglishNumbers, getTranslation } from "@/lib/i18n"
import { ArrowUpRight, Clock } from "lucide-react"

interface NewsItem {
  title: string
  link: string
  text?: string
  publishedDate: string
  image?: string
  symbol?: string
}

export default function FinancialPage() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { locale } = useLocale()

  const fetchData = async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch(`/api/fmp/news?locale=${locale}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to fetch financial news")
      }
      const result = await response.json()
      const mapped: NewsItem[] = (result.items || []).slice(0, 40).map((item: any) => ({
        title: item.title,
        link: item.link,
        text: item.text,
        publishedDate: item.publishedDate,
        image: item.image,
        symbol: item.symbol,
      }))
      const deduped = mapped.filter(
        (item, index, array) => array.findIndex((candidate) => candidate.title === item.title) === index,
      )
      const prioritised = deduped
        .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
        .slice(0, 24)
      setItems(prioritised)
    } catch (error) {
      console.error("Failed to fetch financial data:", error)
      setError(true)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [locale])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "—"
    try {
      const date = new Date(timeStr)
      const formatter = new Intl.DateTimeFormat(
        locale === "ar" ? "ar-EG-u-ca-gregory-nu-latn" : "en-GB",
        {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      )
      return convertToEnglishNumbers(formatter.format(date))
    } catch {
      return convertToEnglishNumbers(timeStr)
    }
  }

  const featured = items[0]
  const secondary = items.slice(1, 4)
  const remaining = items.slice(4)

  const headlineLabel = useMemo(
    () =>
      locale === "ar"
        ? { recent: "آخر التحديثات", featured: "أبرز العناوين", quick: "ملخص السوق اليوم" }
        : { recent: "Latest updates", featured: "Spotlight story", quick: "In the market today" },
    [locale],
  )

  return (
    <div className="space-y-10" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{getTranslation(locale, "financial")}</h1>
          <p className="max-w-2xl text-muted-foreground">
            {locale === "ar"
              ? "متابعة تحريرية فورية لأهم تحركات الأسواق، البنوك المركزية، والسلع الحساسة للإقتصاد."
              : "Real-time editorial coverage across currencies, commodities, and the macro signals moving tomorrow’s trade."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-full border border-primary/30">
            <span className="tracking-[0.3em] uppercase text-xs">
              {locale === "ar" ? "تحديث الآن" : "Refresh now"}
            </span>
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            <Clock className="h-3.5 w-3.5" />
            <span>{items.length > 0 ? formatTime(items[0].publishedDate) : "—"}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="h-72 rounded-3xl bg-muted/60 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-3xl bg-muted/40 animate-pulse" />
            ))}
          </div>
          <div className="md:col-span-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="mb-4 h-20 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-red-200/40 bg-red-100/10 px-6 py-8 text-sm text-red-500 shadow-[0_18px_50px_rgba(220,38,38,0.12)] dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200">
          {locale === "ar"
            ? "تعذر تحميل الأخبار المالية في الوقت الحالي. يرجى المحاولة لاحقاً."
            : "We couldn’t retrieve the financial feed right now. Please try again shortly."}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-3xl border border-muted-foreground/10 bg-muted/20 px-6 py-12 text-center text-muted-foreground">
          {locale === "ar" ? "لا توجد أخبار متاحة الآن." : "No news available at this moment."}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-10">
          {featured && (
            <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <FeaturedStory item={featured} formatTime={formatTime} locale={locale} />
              <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                  {headlineLabel.recent}
                </h2>
                {secondary.map((item) => (
                  <SecondaryCard key={item.title + item.publishedDate} item={item} formatTime={formatTime} />
                ))}
              </div>
            </section>
          )}

          {remaining.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                {headlineLabel.quick}
              </h2>
              <div className="rounded-[28px] border border-white/40 bg-white/80 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/70 dark:shadow-[0_30px_70px_rgba(2,6,23,0.65)]">
                <div className="space-y-3">
                  {remaining.map((item) => (
                    <ArticleRow
                      key={item.title + item.publishedDate}
                      item={item}
                      formatTime={formatTime}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function FeaturedStory({
  item,
  formatTime,
  locale,
}: {
  item: NewsItem
  formatTime: (timeStr: string) => string
  locale: string
}) {
  const hasImage = Boolean(item.image)
  const imageStyle = hasImage
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(6,17,11,0.05) 0%, rgba(6,17,11,0.78) 100%), url(${item.image})`,
      }
    : {
        backgroundImage: "linear-gradient(180deg, rgba(28,58,38,0.35) 0%, rgba(6,17,11,0.85) 100%)",
      }

  return (
    <article className="relative overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-br from-white/85 via-white/70 to-white/40 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-white/10 dark:from-primary/10 dark:via-background/80 dark:to-background/70 dark:shadow-[0_40px_120px_rgba(2,6,23,0.6)]">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-56 w-56 rounded-full bg-sky-400/10 blur-[140px]" />
      </div>
      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="relative overflow-hidden rounded-[24px] border border-white/30 shadow-inner dark:border-white/10">
          <div
            className="h-52 w-full transition-transform duration-500 will-change-transform hover:scale-[1.02]"
            style={{
              ...imageStyle,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            {locale === "ar" ? "أبرز العناوين" : "Spotlight story"}
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">
            {item.title}
          </h2>
          {item.text && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">{item.text}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {formatTime(item.publishedDate)}
          </span>
          <a
            href={item.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-primary transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            {locale === "ar" ? "قراءة كاملة" : "Read briefing"}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  )
}

function SecondaryCard({ item, formatTime }: { item: NewsItem; formatTime: (timeStr: string) => string }) {
  const imageStyle = item.image
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(6,17,11,0.05) 0%, rgba(6,17,11,0.75) 100%), url(${item.image})`,
      }
    : {
        backgroundImage: "linear-gradient(180deg, rgba(28,58,38,0.35) 0%, rgba(6,17,11,0.8) 100%)",
      }
  return (
    <article className="group rounded-[22px] border border-white/30 bg-white/80 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-background/75 dark:shadow-[0_26px_80px_rgba(2,6,23,0.55)]">
      <a href={item.link || "#"} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col gap-4">
        <div className="relative h-32 w-full overflow-hidden rounded-[18px] border border-white/30 shadow-inner dark:border-white/10">
          <div
            className="absolute inset-0 transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
            style={{
              ...imageStyle,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
            {item.title}
          </h3>
          {item.text && <p className="text-xs text-muted-foreground line-clamp-3">{item.text}</p>}
        </div>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          <span>{formatTime(item.publishedDate)}</span>
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
        </div>
      </a>
    </article>
  )
}

function ArticleRow({
  item,
  formatTime,
  locale,
}: {
  item: NewsItem
  formatTime: (timeStr: string) => string
  locale: string
}) {
  const ctaLabel = item.symbol ? convertToEnglishNumbers(item.symbol) : locale === "ar" ? "عرض" : "Open"
  const imageStyle = item.image
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(6,17,11,0) 0%, rgba(6,17,11,0.75) 100%), url(${item.image})`,
      }
    : {
        backgroundImage: "linear-gradient(180deg, rgba(28,58,38,0.25) 0%, rgba(6,17,11,0.8) 100%)",
      }
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/30 bg-white/70 p-4 shadow-[0_12px_45px_rgba(15,23,42,0.1)] transition-colors duration-150 hover:border-primary/40 hover:bg-white/85 dark:border-white/10 dark:bg-background/70 dark:hover:border-primary/50 sm:flex-row sm:items-center sm:gap-4">
      <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-inner sm:block dark:border-white/10">
        <div
          className="h-full w-full"
          style={{
            ...imageStyle,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h4 className="text-sm font-semibold text-foreground line-clamp-2">{item.title}</h4>
        {item.text && <p className="text-xs text-muted-foreground line-clamp-2">{item.text}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary/70" />
          {formatTime(item.publishedDate)}
        </span>
        <a
          href={item.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary transition-all duration-150 hover:gap-3"
        >
          {ctaLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  )
}
