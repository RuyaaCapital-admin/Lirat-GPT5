"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { convertToEnglishNumbers } from "@/lib/i18n"

interface ForexRate {
  pair: string
  price: number | null
  change: number | null
  changePercent: number | null
  timestamp: number
}

const pairs = [
  { id: "usd-try", labelEn: "USD to TRY", labelAr: "دولار ↔ ليرة تركية", pair: "USD-TRY" },
  { id: "usd-syp", labelEn: "USD to SYP", labelAr: "دولار ↔ ليرة سورية", pair: "USD-SYP" },
  { id: "try-syp", labelEn: "TRY to SYP", labelAr: "ليرة تركية ↔ ليرة سورية", pair: "TRY-SYP" },
]

function formatNumber(value: number | null, fraction = 4) {
  if (value === null || Number.isNaN(value)) return "—"
  const rounded = fraction <= 2 ? value.toFixed(fraction) : value.toPrecision(fraction)
  return convertToEnglishNumbers(rounded)
}

function formatDelta(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—"
  const formatted = value > 99 ? value.toFixed(0) : value.toFixed(2)
  return convertToEnglishNumbers(formatted)
}

export function ExchangeRatesPanel() {
  const { locale } = useLocale()
  const [rates, setRates] = useState<Record<string, ForexRate>>({})
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchRates = async () => {
      try {
        setLoading(true)
        const query = pairs.map((item) => `pair=${item.pair}`).join("&")
        const response = await fetch(`/api/fmp/forex?${query}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to load forex rates")
        }
        const json = await response.json()
        if (!isMounted) return

        const mapped: Record<string, ForexRate> = {}
        for (const rate of json.rates || []) {
          mapped[rate.pair] = rate
        }
        setRates(mapped)
      } catch (error) {
        console.error("[v0] Forex panel error:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchRates()
    const interval = window.setInterval(fetchRates, 60_000)
    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [])

  const rows = useMemo(
    () =>
      pairs.map((meta) => {
        const rate = rates[meta.pair]
        const price = rate?.price ?? null
        const change = rate?.changePercent ?? null
        return {
          ...meta,
          price,
          change,
        }
      }),
    [rates],
  )

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-lg dark:border-white/10 dark:bg-background/75 dark:shadow-[0_24px_70px_rgba(2,6,23,0.6)]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-10 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-sky-200/20 blur-[110px] dark:bg-sky-600/15" />
      </div>

      <div className="relative flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
              {locale === "ar" ? "أسعار الصرف" : "Exchange monitor"}
            </p>
            <h3 className="text-xl font-semibold text-foreground sm:text-2xl">
              {locale === "ar" ? "التدفقات بين الليرة والدولار" : "Flows between lira and the dollar"}
            </h3>
          </div>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 px-4 py-1.5 text-xs font-medium text-primary transition hover:border-primary hover:text-primary dark:border-primary/40 dark:text-primary-foreground/80"
          >
            {locale === "ar" ? "المزيد في لوحة الأسواق" : "More inside markets"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {rows.map((row) => {
            const positive = (row.change ?? 0) >= 0
            const formattedPrice = formatNumber(row.price, row.pair === "USD-SYP" || row.pair === "TRY-SYP" ? 0 : 3)
            const formattedChange = formatDelta(row.change)

            return (
            <Link
                key={row.id}
                href={`/markets?base=${row.pair}`}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-background/80 dark:shadow-[0_22px_60px_rgba(2,6,23,0.55)]",
                )}
              >
                <div className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-200 group-hover:opacity-10 group-hover:bg-primary" />
                <div className="relative space-y-3">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {locale === "ar" ? row.labelAr : row.labelEn}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-foreground">{formattedPrice}</span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {formattedChange === "—" ? formattedChange : `${positive ? "+" : ""}${formattedChange}%`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === "ar"
                      ? "تحديث خلال ستين ثانية"
                      : "Refreshes every sixty seconds"}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-3xl border border-white/50 bg-white/70 shadow-inner animate-pulse dark:border-white/10 dark:bg-background/70"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
