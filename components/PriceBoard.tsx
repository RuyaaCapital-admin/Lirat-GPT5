'use client'

import type { ReactElement, ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Minus,
  RefreshCw,
  Sparkles,
  Wifi,
} from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"
import type { RatesApiResponse } from "@/lib/fmpClient"
import TradingViewWidget from "@/components/tradingview-widget"

type Trend = "up" | "down" | "flat"

type RateRowDefinition = {
  id: string
  label: string
  code?: string
  unit: string
  value: number | null
  suffix: string
  decimals: number
  icon?: ReactNode
  flagCode?: string
}

type RateRow = RateRowDefinition & {
  trend: Trend
}

type LiveStatus = "idle" | "connecting" | "open" | "error"

type Copy = {
  heading: string
  subheading: string
  goldTitle: string
  fxTitle: string
  updated: string
  waiting: string
  live: string
  connecting: string
  reconnecting: string
  retry: string
  refresh: string
  success: string
  error: string
  perGram: string
  usdPerOunce: string
  tryPer: (code: string) => string
  sypPerUsd: string
}

const FLAG_SIZE = 18

const FLAG_MAP: Record<string, ReactElement> = {
  USD: (
    <svg width={FLAG_SIZE} height={FLAG_SIZE * 0.7} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="2" y="0" fill="#B22234" />
      <rect width="20" height="2" y="4" fill="#B22234" />
      <rect width="20" height="2" y="8" fill="#B22234" />
      <rect width="20" height="2" y="12" fill="#B22234" />
      <rect width="8.8" height="7.7" fill="#3C3B6E" />
    </svg>
  ),
  EUR: (
    <svg width={FLAG_SIZE} height={FLAG_SIZE * 0.7} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" rx="2" fill="#1245B3" />
      {[...Array(10)].map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        const cx = 10 + 4 * Math.cos(angle)
        const cy = 7 + 3 * Math.sin(angle)
        return <circle key={i} cx={cx} cy={cy} r="0.7" fill="#F7C948" />
      })}
    </svg>
  ),
  GBP: (
    <svg width={FLAG_SIZE} height={FLAG_SIZE * 0.7} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#00247D" rx="2" />
      <path d="M0 0h20L0 14Zm20 0L0 14" fill="#fff" opacity="0.85" />
      <path d="M20 0h-2.4L0 10.4V14h2.4L20 3.6Z" fill="#CF142B" />
      <path d="M11.6 0v5.6H20v2.8h-8.4V14H8.4V8.4H0V5.6h8.4V0Z" fill="#fff" />
      <path d="M12.4 0v6.4H20v1.2h-7.6V14h-2.8V7.6H0V6.4h9.6V0Z" fill="#CF142B" />
    </svg>
  ),
  LYD: (
    <svg width={FLAG_SIZE} height={FLAG_SIZE * 0.7} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#D7151A" />
      <rect width="20" height="9.3" fill="#000" />
      <rect width="20" height="4.6" fill="#048243" />
      <path d="M10.4 6.8a2.2 2.2 0 1 0 0-1.6 1.4 1.4 0 1 1 0 1.6ZM12.5 5.97l1.3-.42-0.8 1.1 0.8 1.1-1.3-.42-0.5 1.24-0.5-1.24-1.3.42 0.8-1.1-0.8-1.1 1.3.42 0.5-1.24Z" fill="#fff" />
    </svg>
  ),
  SYP: (
    <svg width={FLAG_SIZE} height={FLAG_SIZE * 0.7} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#CE2028" />
      <rect width="20" height="9.3" y="2.35" fill="#fff" />
      <rect width="20" height="4.6" y="4.7" fill="#000" />
      {[6.5, 13.5].map((cx, idx) => (
        <path
          key={idx}
          d="M0-1.8 0.54-.55 1.85-.42 0.92.45 1.21 1.74 0 1.05-1.21 1.74-.92.45-1.85-.42-0.54-.55 0-1.8Z"
          transform={`translate(${cx} 7)`}
          fill="#2CAA3F"
        />
      ))}
    </svg>
  ),
  EGP: (
    <svg width={FLAG_SIZE} height={FLAG_SIZE * 0.7} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#D7151A" />
      <rect width="20" height="9.3" fill="#fff" />
      <rect width="20" height="4.6" fill="#000" />
      <path d="M10 4.2l1 2.6h2.6l-2.1 1.5 0.8 2.5L10 9.2 7.7 10.8l0.8-2.5-2.1-1.5h2.6Z" fill="#C9A135" />
    </svg>
  ),
  IQD: (
    <svg width={FLAG_SIZE} height={FLAG_SIZE * 0.7} viewBox="0 0 20 14" aria-hidden="true">
      <rect width="20" height="14" fill="#CE2028" />
      <rect width="20" height="9.3" fill="#fff" />
      <rect width="20" height="4.6" fill="#0C1C8C" />
      <path d="M6 7h8" stroke="#1CAB5B" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.2 5.5v3.2M10.8 5.5v3.2" stroke="#1CAB5B" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
}

const DEFAULT_FLAG = (
  <div
    className="h-6 w-6 rounded-full border border-emerald-200/40 bg-emerald-400/15 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
    aria-hidden="true"
  />
)

function getFlag(code?: string) {
  if (!code) return DEFAULT_FLAG
  return FLAG_MAP[code] ?? DEFAULT_FLAG
}

const GoldIcon = () => (
  <svg viewBox="0 0 32 32" className="h-6 w-6 text-amber-300" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="goldGradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE68A" />
        <stop offset="0.5" stopColor="#FACC15" />
        <stop offset="1" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
    <rect x="4" y="6" width="24" height="20" rx="6" fill="url(#goldGradient)" />
    <rect x="6.5" y="8.5" width="19" height="15" rx="4" fill="rgba(255,255,255,0.08)" />
    <path d="M10 16h12" stroke="rgba(16,24,16,0.35)" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M10 12h12M10 20h12" stroke="rgba(16,24,16,0.15)" strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const fetcher = async (url: string): Promise<RatesApiResponse> => {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json()
}

function formatNumber(value: number | null, locale: string, decimals: number) {
  if (value === null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(value)
}

function formatRelativeTime(iso: string | undefined, locale: string) {
  if (!iso) return locale === "ar" ? "—" : "—"
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return locale === "ar" ? "—" : "—"
  const diff = dt.getTime() - Date.now()
  const absSeconds = Math.round(Math.abs(diff) / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { numeric: "auto" })

  if (absSeconds < 60) {
    return formatter.format(Math.round(diff / 1000), "second")
  }

  const minutes = Math.round(diff / (1000 * 60))
  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute")
  }

  const hours = Math.round(diff / (1000 * 60 * 60))
  return formatter.format(hours, "hour")
}

function formatStale(seconds: number, locale: string) {
  if (Number.isNaN(seconds) || seconds < 0) return locale === "ar" ? "قديمة" : "stale"
  return locale === "ar" ? `قديمة منذ ${seconds}ث` : `stale ${seconds}s`
}

export default function PriceBoard() {
  const { locale } = useLocale()
  const { theme, resolvedTheme } = useTheme()
  const isRTL = locale === "ar"
  const isDark = resolvedTheme === "dark" || theme === "dark"
  const copy = useMemo<Copy>(
    () => ({
      heading: isRTL ? "لوحة أسعار ليرات" : "Liirat Price Board",
      subheading: isRTL
        ? "أسعار العملات والذهب مع تحديثات حية وتحديث آمن عند الانقطاع"
        : "Currencies & bullion with real-time streaming updates and safe fallbacks",
      goldTitle: isRTL ? "أسعار الذهب بالليرة التركية" : "Gold priced in Turkish Lira",
      fxTitle: isRTL ? "أسعار الصرف مقابل الليرة" : "FX versus Turkish Lira",
      updated: isRTL ? "آخر تحديث" : "Last updated",
      waiting: isRTL ? "بانتظار أول تحديث..." : "Waiting for the first update…",
      live: isRTL ? "متصل" : "Live",
      connecting: isRTL ? "جاري الاتصال" : "Connecting",
      reconnecting: isRTL ? "إعادة الاتصال..." : "Reconnecting…",
      retry: isRTL ? "إعادة المحاولة" : "Retry",
      refresh: isRTL ? "تحديث" : "Refresh",
      success: isRTL ? "تم تحديث الأسعار الآن" : "Live prices updated",
      error: isRTL
        ? "تعذر تحديث الأسعار. نعرض آخر بيانات متوفرة."
        : "We couldn’t refresh prices. Showing the last available snapshot.",
      perGram: isRTL ? "₺ لكل غرام" : "TRY per gram",
      usdPerOunce: isRTL ? "دولار لكل أونصة" : "USD per ounce",
      tryPer: (code: string) => (isRTL ? `₺ لكل 1 ${code}` : `TRY per 1 ${code}`),
      sypPerUsd: isRTL ? "ليرة سورية لكل 1 دولار" : "SYP per 1 USD",
    }),
    [isRTL],
  )

  const { data, error, isLoading, mutate } = useSWR<RatesApiResponse>("/api/rates", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60_000,
    dedupingInterval: 30_000,
  })

  const [liveData, setLiveData] = useState<RatesApiResponse | null>(null)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle")
  const [feedbackTs, setFeedbackTs] = useState<number | null>(null)
  const previousValuesRef = useRef<Record<string, number | null>>({})

  const resolvedData = liveData ?? data ?? null

  useEffect(() => {
    if (typeof window === "undefined") return

    let source: EventSource | null = null
    let retryTimer: number | null = null
    let cancelled = false

    const connect = () => {
      if (cancelled) return
      setLiveStatus((current) => (current === "open" ? "open" : "connecting"))
      source = new EventSource("/api/rates/stream")

      source.onopen = () => {
        setLiveStatus("open")
      }

      source.onmessage = (event) => {
        if (!event.data) return
        try {
          const payload = JSON.parse(event.data) as RatesApiResponse
          setLiveData(payload)
          setFeedbackTs(Date.now())
          mutate(payload, false)
        } catch (streamError) {
          console.error("[PriceBoard] failed to parse stream message", streamError)
        }
      }

      source.onerror = () => {
        setLiveStatus("error")
        source?.close()
        if (!cancelled) {
          retryTimer = window.setTimeout(connect, 5_000)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer)
      }
      source?.close()
    }
  }, [mutate])

  useEffect(() => {
    if (feedbackTs === null) return
    const timeoutId = window.setTimeout(() => setFeedbackTs(null), 3_500)
    return () => window.clearTimeout(timeoutId)
  }, [feedbackTs])

  const rows = useMemo(() => {
    const fxData = resolvedData?.fx
    const goldData = resolvedData?.gold

    const definitions: RateRowDefinition[] = [
      {
        id: "gold_k24",
        label: isRTL ? "ذهب عيار 24" : "Gold 24K",
        code: "24K",
        unit: copy.perGram,
        value: goldData?.k24 ?? null,
        suffix: "₺",
        decimals: 0,
        icon: <GoldIcon />,
      },
      {
        id: "gold_k22",
        label: isRTL ? "ذهب عيار 22" : "Gold 22K",
        code: "22K",
        unit: copy.perGram,
        value: goldData?.k22 ?? null,
        suffix: "₺",
        decimals: 0,
        icon: <GoldIcon />,
      },
      {
        id: "gold_k21",
        label: isRTL ? "ذهب عيار 21" : "Gold 21K",
        code: "21K",
        unit: copy.perGram,
        value: goldData?.k21 ?? null,
        suffix: "₺",
        decimals: 0,
        icon: <GoldIcon />,
      },
      {
        id: "gold_k18",
        label: isRTL ? "ذهب عيار 18" : "Gold 18K",
        code: "18K",
        unit: copy.perGram,
        value: goldData?.k18 ?? null,
        suffix: "₺",
        decimals: 0,
        icon: <GoldIcon />,
      },
      {
        id: "gold_k14",
        label: isRTL ? "ذهب عيار 14" : "Gold 14K",
        code: "14K",
        unit: copy.perGram,
        value: goldData?.k14 ?? null,
        suffix: "₺",
        decimals: 0,
        icon: <GoldIcon />,
      },
      {
        id: "gold_tam",
        label: isRTL ? "الليرة الذهبية (تم)" : "Full Ottoman Coin",
        code: isRTL ? "الليرة التامة" : "Tam Coin",
        unit: isRTL ? "₺ لكل ليرة ذهبية" : "TRY per coin",
        value: goldData?.tamAltin ?? null,
        suffix: "₺",
        decimals: 0,
        icon: <GoldIcon />,
      },
      {
        id: "gold_ounce",
        label: isRTL ? "أونصة الذهب بالدولار" : "Gold Ounce (XAUUSD)",
        code: "XAUUSD",
        unit: copy.usdPerOunce,
        value: goldData?.ounceUSD ?? null,
        suffix: "USD",
        decimals: 2,
        icon: <GoldIcon />,
      },
      {
        id: "fx_usd",
        label: "USD",
        code: "USD/TRY",
        unit: copy.tryPer("USD"),
        value: fxData?.USD_TRY ?? null,
        suffix: "₺",
        decimals: 3,
        flagCode: "USD",
      },
      {
        id: "fx_eur",
        label: "EUR",
        code: "EUR/TRY",
        unit: copy.tryPer("EUR"),
        value: fxData?.EUR_TRY ?? null,
        suffix: "₺",
        decimals: 3,
        flagCode: "EUR",
      },
      {
        id: "fx_gbp",
        label: "GBP",
        code: "GBP/TRY",
        unit: copy.tryPer("GBP"),
        value: fxData?.GBP_TRY ?? null,
        suffix: "₺",
        decimals: 3,
        flagCode: "GBP",
      },
      {
        id: "fx_lyd",
        label: "LYD",
        code: "LYD/TRY",
        unit: copy.tryPer("LYD"),
        value: fxData?.LYD_TRY ?? null,
        suffix: "₺",
        decimals: 3,
        flagCode: "LYD",
      },
      {
        id: "fx_egp",
        label: "EGP",
        code: "EGP/TRY",
        unit: copy.tryPer("EGP"),
        value: fxData?.EGP_TRY ?? null,
        suffix: "₺",
        decimals: 3,
        flagCode: "EGP",
      },
      {
        id: "fx_iqd",
        label: "IQD",
        code: "IQD/TRY",
        unit: copy.tryPer("IQD"),
        value: fxData?.IQD_TRY ?? null,
        suffix: "₺",
        decimals: 4,
        flagCode: "IQD",
      },
      {
        id: "fx_syp",
        label: isRTL ? "الليرة السورية" : "Syrian Pound",
        code: "USD/SYP",
        unit: copy.sypPerUsd,
        value: fxData?.SYP.USD_SYP ?? null,
        suffix: isRTL ? "ل.س" : "SYP",
        decimals: 0,
        flagCode: "SYP",
      },
    ]

    const rowsWithTrend: RateRow[] = definitions.map((definition) => {
      const prev = previousValuesRef.current[definition.id]
      const current = definition.value
      let trend: Trend = "flat"

      if (prev !== null && prev !== undefined && current !== null && current !== undefined) {
        let threshold = 0.0001
        if (definition.decimals === 0) {
          threshold = 0.5
        } else if (definition.decimals === 3) {
          threshold = 0.0005
        } else if (definition.decimals === 4) {
          threshold = 0.00005
        } else if (definition.decimals === 2) {
          threshold = 0.01
        }

        const delta = current - prev
        if (Math.abs(delta) > threshold) {
          trend = delta > 0 ? "up" : "down"
        }
      } else if (prev === undefined && current !== null) {
        trend = "up"
      }

      return { ...definition, trend }
    })

    return rowsWithTrend
  }, [resolvedData, copy, isRTL])

  useEffect(() => {
    if (!resolvedData) return
    const next: Record<string, number | null> = {}
    for (const row of rows) {
      next[row.id] = row.value
    }
    previousValuesRef.current = next
  }, [resolvedData, rows])

  const goldRows = rows.slice(0, 7)
  const fxRows = rows.slice(7)

  const crossPairs = useMemo(() => {
    const entries = [
      {
        id: "eurusd",
        label: "EUR/USD",
        value:
          resolvedData?.fx.EUR_TRY && resolvedData?.fx.USD_TRY
            ? resolvedData.fx.EUR_TRY / resolvedData.fx.USD_TRY
            : null,
      },
      {
        id: "gbpusd",
        label: "GBP/USD",
        value:
          resolvedData?.fx.GBP_TRY && resolvedData?.fx.USD_TRY
            ? resolvedData.fx.GBP_TRY / resolvedData.fx.USD_TRY
            : null,
      },
      {
        id: "eurgbp",
        label: "EUR/GBP",
        value:
          resolvedData?.fx.EUR_TRY && resolvedData?.fx.GBP_TRY
            ? resolvedData.fx.EUR_TRY / resolvedData.fx.GBP_TRY
            : null,
      },
    ]

    return entries.map((chip) => ({
      ...chip,
      display:
        chip.value === null
          ? "—"
          : new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            }).format(chip.value),
    }))
  }, [resolvedData, locale])

  const staleSeconds =
    resolvedData && Number.isFinite(resolvedData.meta.staleForMs)
      ? Math.round(resolvedData.meta.staleForMs / 1000)
      : null

  const showErrorInline = Boolean(error && !resolvedData)
  const hasValidRates = rows.some((row) => typeof row.value === "number" && row.value !== null)

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative isolate w-full overflow-hidden px-3 py-4 sm:px-4"
    >
      <ModernPanel
        className={cn(
          "mx-auto w-full max-w-3xl border shadow-lg",
          isDark
            ? "border-emerald-500/25 bg-[#0b1611]/95"
            : "border-emerald-100/70 bg-white/95"
        )}
      >
        <ModernPanelHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "relative h-8 w-8 overflow-hidden rounded-lg border",
                  isDark
                    ? "border-emerald-500/40 bg-[#0f2218]"
                    : "border-emerald-100 bg-emerald-50/80"
                )}
              >
                <Image src="/images/liirat-logo.png" alt="Liirat logo" fill className="object-contain p-1.5" priority />
              </div>
              <div className="space-y-0.5">
                <ModernPanelTitle className="text-base">{copy.heading}</ModernPanelTitle>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {resolvedData?.meta.stale && typeof staleSeconds === "number" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isDark
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      : "border-amber-400/60 bg-amber-50 text-amber-700"
                  )}
                >
                  {formatStale(staleSeconds, locale)}
                </Badge>
              )}
            </div>
          </div>
        </ModernPanelHeader>

        <ModernPanelContent className="pt-0">

          {feedbackTs && resolvedData && !resolvedData.meta.stale && (
            <InlineFeedback message={copy.success} isDark={isDark} />
          )}

          {showErrorInline && (
            <InlineError message={copy.error} onRetry={() => mutate()} copy={copy} isDark={isDark} />
          )}

          {!hasValidRates ? (
            <div className="w-full">
              <TradingViewWidget />
            </div>
          ) : (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                <RatesCard
                  title={copy.goldTitle}
                  rows={goldRows}
                  locale={locale}
                  isLoading={isLoading && !resolvedData}
                  isDark={isDark}
                />
                <RatesCard
                  title={copy.fxTitle}
                  rows={fxRows}
                  locale={locale}
                  isLoading={isLoading && !resolvedData}
                  isDark={isDark}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {crossPairs.map((chip) => (
                  <Chip key={chip.id} label={chip.label} value={chip.display} isDark={isDark} />
                ))}
              </div>
            </>
          )}

          {!showErrorInline && error && resolvedData && (
            <InlineError message={copy.error} onRetry={() => mutate()} copy={copy} subtle isDark={isDark} />
          )}
        </ModernPanelContent>
      </ModernPanel>
    </section>
  )
}

function RatesCard({
  title,
  rows,
  locale,
  isLoading,
  isDark,
}: {
  title: string
  rows: RateRow[]
  locale: string
  isLoading: boolean
  isDark: boolean
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-3",
        isDark
          ? "border-emerald-500/25 bg-[#0d1a13]"
          : "border-emerald-100 bg-[#f4f8f3]"
      )}
    >
      <div className="relative mb-2 flex items-center gap-2">
        <span className={cn(
          "inline-flex h-1.5 w-1.5 rounded-full",
          isDark ? "bg-emerald-400" : "bg-emerald-500"
        )} />
        <h3
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isDark ? "text-emerald-50" : "text-emerald-900"
          )}
        >
          {title}
        </h3>
      </div>
      <div className="relative flex flex-col gap-2">
        {rows.map((row) => (
          <RateRowItem key={row.id} row={row} locale={locale} isLoading={isLoading} isDark={isDark} />
        ))}
      </div>
    </div>
  )
}

function RateRowItem({ row, locale, isLoading, isDark }: { row: RateRow; locale: string; isLoading: boolean; isDark: boolean }) {
  const formatted = formatNumber(row.value, locale, row.decimals)

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-2.5 py-2 transition",
        isDark
          ? "border-emerald-500/25 bg-[#0f1f16]/70 hover:border-emerald-400/30"
          : "border-emerald-100 bg-white/70 hover:border-emerald-200/70"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border",
            isDark
              ? "border-emerald-500/40 bg-[#122218]"
              : "border-emerald-100 bg-emerald-50/80"
          )}
        >
          {row.icon ?? getFlag(row.flagCode)}
        </div>
        <div className="flex flex-col">
          <span
            className={cn(
              "text-xs font-semibold",
              isDark ? "text-emerald-50" : "text-emerald-900"
            )}
          >
            {row.label}
          </span>
          <span
            className={cn(
              "text-[10px] uppercase tracking-wide",
              isDark ? "text-emerald-200" : "text-emerald-600"
            )}
          >
            {row.code ?? row.unit}
          </span>
          {row.code && (
            <span
              className={cn(
                "text-[10px]",
                isDark ? "text-emerald-300/70" : "text-emerald-700/80"
              )}
            >
              {row.unit}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-3 w-12 animate-pulse rounded-full",
                isDark ? "bg-[#16281e]" : "bg-emerald-100"
              )}
            />
            <div
              className={cn(
                "h-3 w-6 animate-pulse rounded-full",
                isDark ? "bg-[#16281e]" : "bg-emerald-100"
              )}
            />
          </div>
        ) : (
          <>
            <TrendIcon trend={row.trend} isDark={isDark} />
            <span
              className={cn(
                "text-sm font-semibold tracking-tight",
                isDark ? "text-emerald-50" : "text-emerald-900"
              )}
              aria-live="polite"
            >
              {formatted}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                isDark ? "text-emerald-300" : "text-emerald-700"
              )}
            >
              {row.suffix}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function TrendIcon({ trend, isDark }: { trend: Trend; isDark: boolean }) {
  if (trend === "up") {
    return <ArrowUpRight className={cn("h-3.5 w-3.5", isDark ? "text-emerald-400" : "text-emerald-600")} />
  }
  if (trend === "down") {
    return <ArrowDownRight className={cn("h-3.5 w-3.5", isDark ? "text-rose-400" : "text-rose-600")} />
  }
  return <Minus className={cn("h-3.5 w-3.5", isDark ? "text-emerald-300/80" : "text-emerald-500/70")} />
}

function LiveStatusPill({ status, liveMeta, copy, isDark }: { status: LiveStatus; liveMeta?: RatesApiResponse["meta"]; copy: Copy; isDark: boolean }) {
  const isLive = liveMeta?.live && status === "open"

  let label: string
  switch (status) {
    case "open":
      label = copy.live
      break
    case "error":
      label = copy.reconnecting
      break
    case "connecting":
      label = copy.connecting
      break
    default:
      label = copy.waiting
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        isLive
          ? isDark
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
            : "border-emerald-500/40 bg-emerald-50 text-emerald-700"
          : status === "error"
            ? isDark
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-amber-400/40 bg-amber-50 text-amber-700"
            : isDark
              ? "border-emerald-500/20 bg-[#121f17]/70 text-emerald-200"
              : "border-emerald-100 bg-emerald-50 text-emerald-700",
      )}
    >
      <Wifi className={cn(
        "h-3 w-3",
        isLive
          ? isDark ? "text-emerald-400" : "text-emerald-600"
          : status === "error"
            ? isDark
              ? "text-amber-400"
              : "text-amber-600"
            : isDark
              ? "text-emerald-200"
              : "text-emerald-600/70"
      )} />
      <span>{label}</span>
      {isLive && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            isDark ? "bg-emerald-400" : "bg-emerald-500"
          )} />
          <span className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            isDark ? "bg-emerald-400" : "bg-emerald-500"
          )} />
        </span>
      )}
    </span>
  )
}

function InlineFeedback({ message, isDark }: { message: string; isDark: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
      isDark
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
        : "border-emerald-400/60 bg-emerald-50 text-emerald-700"
    )}>
      <Sparkles className={cn("h-3.5 w-3.5", isDark ? "text-emerald-400" : "text-emerald-600")} />
      <span className="font-medium">{message}</span>
    </div>
  )
}

function InlineError({ message, onRetry, copy, subtle = false, isDark }: { message: string; onRetry: () => void; copy: Copy; subtle?: boolean; isDark: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        subtle
          ? isDark
            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
            : "border-amber-400/60 bg-amber-50 text-amber-700"
          : isDark
            ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
            : "border-rose-400/60 bg-rose-50 text-rose-700",
      )}
    >
      <AlertCircle className={cn(
        "h-3.5 w-3.5 shrink-0",
        subtle
          ? isDark ? "text-amber-400" : "text-amber-600"
          : isDark ? "text-rose-400" : "text-rose-600"
      )} />
      <span className="flex-1 min-w-[180px]">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
          subtle
            ? isDark
              ? "border-amber-500/40 text-amber-300 hover:border-amber-400 hover:text-amber-200"
              : "border-amber-400/60 text-amber-700 hover:border-amber-500 hover:text-amber-800"
            : isDark
              ? "border-rose-500/40 text-rose-300 hover:border-rose-400 hover:text-rose-200"
              : "border-rose-400/60 text-rose-700 hover:border-rose-500 hover:text-rose-800",
        )}
      >
        <RefreshCw className="h-3 w-3" />
        <span>{copy.retry}</span>
      </button>
    </div>
  )
}

function Chip({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
        isDark
          ? "border-emerald-500/25 bg-[#102017]/70 text-emerald-200"
          : "border-emerald-100 bg-emerald-50 text-emerald-900"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px]",
          isDark
            ? "bg-[#193224] text-emerald-50"
            : "bg-emerald-100 text-emerald-900"
        )}
      >
        {value}
      </span>
    </div>
  )
}
