"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowUpRight, RefreshCw } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { convertToEnglishNumbers } from "@/lib/i18n"
import TradingViewWidget from "@/components/tradingview-widget"
import type { RatesApiResponse } from "@/lib/fmpClient"

type RateSource = "fx" | "gold" | "derived"

type RateConfig = {
  id: string
  labelEn: string
  labelAr: string
  badge: string
  type: RateSource
  key: string
  decimals: number
  suffix: string
}

const CONFIG: RateConfig[] = [
  { id: "usd-try", labelEn: "USD / TRY", labelAr: "دولار / ليرة", badge: "USD", type: "fx", key: "USD_TRY", decimals: 3, suffix: "₺" },
  { id: "eur-try", labelEn: "EUR / TRY", labelAr: "يورو / ليرة", badge: "EUR", type: "fx", key: "EUR_TRY", decimals: 3, suffix: "₺" },
  { id: "gbp-try", labelEn: "GBP / TRY", labelAr: "جنيه / ليرة", badge: "GBP", type: "fx", key: "GBP_TRY", decimals: 3, suffix: "₺" },
  { id: "usd-syp", labelEn: "USD / SYP", labelAr: "دولار / ليرة سورية", badge: "SYP", type: "fx", key: "SYP.USD_SYP", decimals: 0, suffix: "SYP" },
  { id: "gold-24", labelEn: "Gold 24K", labelAr: "ذهب عيار 24", badge: "Au", type: "gold", key: "k24", decimals: 0, suffix: "₺/g" },
  { id: "gold-ounce", labelEn: "Gold Ounce", labelAr: "أونصة ذهب", badge: "XAU", type: "gold", key: "ounceUSD", decimals: 2, suffix: "USD" },
]

function formatNumber(value: number | null, fraction = 4) {
  if (value === null || Number.isNaN(value)) return "—"
  const rounded = fraction <= 2 ? value.toFixed(fraction) : value.toPrecision(fraction)
  return convertToEnglishNumbers(rounded)
}

function formatDelta(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—"
  const formatted = Math.abs(value) > 99 ? value.toFixed(0) : value.toFixed(2)
  return convertToEnglishNumbers(formatted)
}

function resolveValue(payload: RatesApiResponse | null, config: RateConfig): number | null {
  if (!payload) return null
  if (config.type === "gold") {
    return payload.gold?.[config.key as keyof typeof payload.gold] ?? null
  }
  if (config.type === "fx" && config.key.includes(".")) {
    const [group, field] = config.key.split(".")
    return (payload.fx as any)?.[group]?.[field] ?? null
  }
  if (config.type === "fx") {
    return (payload.fx as any)?.[config.key] ?? null
  }
  if (config.type === "derived" && config.key === "TRY_SYP") {
    const usdTry = (payload.fx as any)?.USD_TRY
    const usdSyp = (payload.fx as any)?.SYP?.USD_SYP
    if (!usdTry || !usdSyp || usdTry === 0) return null
    return usdSyp / usdTry
  }
  return null
}

export function ExchangeRatesPanel() {
  const { locale } = useLocale()
  const [snapshot, setSnapshot] = useState<RatesApiResponse | null>(null)
  const [rowsState, setRowsState] = useState<Record<string, { price: number | null; changePercent: number | null }>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [fallbackActive, setFallbackActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fetchRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const previousPrices = useRef<Record<string, number | null>>({})

  useEffect(() => {
    let isMounted = true

    const fetchRates = async () => {
      try {
        setLoading(true)
        setErrorMessage(null)
        const response = await fetch("/api/rates", { cache: "no-store" })
        if (!response.ok) {
          throw new Error(await response.text())
        }
        const json: RatesApiResponse = await response.json()
        if (!isMounted) return

        const nextRows: typeof rowsState = {}
        for (const config of CONFIG) {
          const price = resolveValue(json, config)
          const prev = previousPrices.current[config.id]
          let changePercent: number | null = null
          if (price !== null && prev !== null && prev !== undefined && prev !== 0) {
            changePercent = ((price - prev) / prev) * 100
          }
          nextRows[config.id] = { price, changePercent }
        }
        previousPrices.current = Object.fromEntries(
          Object.entries(nextRows).map(([key, value]) => [key, value.price ?? null]),
        )

        setRowsState(nextRows)
        setSnapshot(json)
        setFallbackActive(false)
      } catch (error) {
        console.error("[ExchangeRatesPanel] rates fetch failed", error)
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : "Unable to reach rates engine.")
        setFallbackActive(true)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchRates()
    fetchRef.current = fetchRates
    const interval = window.setInterval(fetchRates, 60_000)
    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [])

  const rows = useMemo(
    () =>
      CONFIG.map((config) => ({
        ...config,
        price: rowsState[config.id]?.price ?? null,
        changePercent: rowsState[config.id]?.changePercent ?? null,
      })),
    [rowsState],
  )

  const hasLiveRates = rows.some((row) => row.price !== null && Number.isFinite(row.price))
  const showTradingViewFallback = fallbackActive || (!loading && !hasLiveRates)
  const lastUpdated = snapshot?.meta?.fetchedAt

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
            href="/ai"
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 px-4 py-1.5 text-xs font-medium text-primary transition hover:border-primary hover:text-primary dark:border-primary/40 dark:text-primary-foreground/80"
          >
            {locale === "ar" ? "تحكم عبر الوكيل الذكي" : "Control with the AI agent"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {lastUpdated && (
          <p className="text-right text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {locale === "ar" ? "آخر تحديث" : "Last updated"} ·{" "}
            {new Date(lastUpdated).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {locale === "ar"
                ? "نعرض النسخة الاحتياطية بسبب تأخر البيانات."
                : "Showing fallback data while rates recover."}
            </span>
            <button
              type="button"
              onClick={() => {
                setFallbackActive(false)
                setLoading(true)
                fetchRef.current()
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.3em] text-amber-800 transition hover:border-amber-500 hover:text-amber-900 dark:border-amber-400/40 dark:text-amber-100 dark:hover:border-amber-300"
            >
              <RefreshCw className="h-3 w-3" />
              {locale === "ar" ? "تحديث" : "Retry"}
            </button>
          </div>
        )}

        {showTradingViewFallback ? (
          <div className="rounded-[28px] border border-dashed border-emerald-200/70 bg-white/80 p-3 shadow-inner dark:border-emerald-500/20 dark:bg-white/5">
            <TradingViewWidget />
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const positive = (row.changePercent ?? 0) >= 0
              const formattedPrice = formatNumber(row.price, row.decimals)
              const formattedChange = formatDelta(row.changePercent)

              return (
                <div
                  key={row.id}
                  className={cn(
                    "group relative flex items-center justify-between gap-6 overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-6 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-background/80 dark:shadow-[0_24px_70px_rgba(2,6,23,0.55)]",
                  )}
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/15 dark:via-primary/5" />
                  </div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary dark:bg-primary/15 dark:text-primary-foreground">
                      {row.badge}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {locale === "ar" ? row.labelAr : row.labelEn}
                      </p>
                      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">
                        {convertToEnglishNumbers(row.badge)}
                      </p>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-4">
                    <span className="text-2xl font-semibold text-foreground">{formattedPrice}</span>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                        positive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
                      )}
                    >
                      {formattedChange === "—" ? formattedChange : `${positive ? "+" : ""}${formattedChange}%`}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{row.suffix}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {loading && (
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 rounded-3xl border border-white/50 bg-white/70 shadow-inner animate-pulse dark:border-white/10 dark:bg-background/70"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
