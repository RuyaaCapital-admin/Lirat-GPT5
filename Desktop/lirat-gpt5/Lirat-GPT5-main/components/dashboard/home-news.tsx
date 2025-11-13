"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { convertToEnglishNumbers } from "@/lib/i18n"

interface HomeNewsItem {
  title: string
  link: string
  source: string
  publishedDate: string
}

function formatTime(locale: string, time: string) {
  try {
    const date = new Date(time)
    const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-ca-gregory" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
      hour12: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    return convertToEnglishNumbers(formatter.format(date))
  } catch {
    return convertToEnglishNumbers(time)
  }
}

export function HomeNewsRail() {
  const { locale } = useLocale()
  const [news, setNews] = useState<HomeNewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/fmp/news?locale=${locale}&limit=6`, { cache: "no-store" })
        if (!response.ok) throw new Error("Failed to fetch news")
        const json = await response.json()
        if (!isMounted) return

        const mapped = (json.items || []).slice(0, 4).map((item: any) => ({
          title: item.title,
          link: item.link,
          source: item.source,
          publishedDate: item.publishedDate,
        }))
        setNews(mapped)
      } catch (error) {
        console.error("[v0] Home news rail:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    const interval = window.setInterval(load, 5 * 60_000)
    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [locale])

  return (
    <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-lg dark:border-white/10 dark:bg-background/75 dark:shadow-[0_24px_70px_rgba(2,6,23,0.6)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
            {locale === "ar" ? "آخر التحليلات" : "Latest insights"}
          </p>
          <h3 className="text-xl font-semibold text-foreground">
            {locale === "ar" ? "شريط أخبار ليرات المختارة" : "Liirat curated highlights"}
          </h3>
        </div>
        <Link
          href="/financial"
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 px-3 py-1.5 text-xs font-medium text-primary transition hover:border-primary hover:text-primary dark:border-primary/40 dark:text-primary-foreground/80"
        >
          {locale === "ar" ? "عرض الكل" : "View all"}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3">
        {loading && (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 rounded-2xl bg-white/70 shadow-inner animate-pulse dark:bg-background/70" />
            ))}
          </div>
        )}

        {!loading &&
          news.map((item) => (
            <Link
              key={`${item.link}-${item.publishedDate}`}
              href={item.link || "/financial"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-white/50 bg-white/75 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-background/80 dark:shadow-[0_16px_40px_rgba(2,6,23,0.55)]"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary">
                  {item.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(locale, item.publishedDate)}
                  </span>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          ))}
      </div>
    </div>
  )
}
