'use client'

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { isRTL, num, tsPretty } from "@/lib/format"

type Data = {
  ts: string
  gold: {
    k14: number
    k18: number
    k21: number
    k22: number
    k24: number
    tamAltin: number
    ounceUSD: number
  }
  fx: {
    USD_TRY: number
    EUR_TRY: number
    GBP_TRY: number
    LYD_TRY: number | null
    EGP_TRY: number | null
    IQD_TRY: number | null
    SYP: {
      USD_SYP: number | null
    }
  }
}

const LABELS = {
  heading: isRTL ? "لوحة أسعار ليرات" : "Liirat Price Board",
  subheading: isRTL ? "سعر الصرف والذهب محدث كل دقيقة" : "Exchange & bullion levels, refreshed every minute",
  goldTitle: isRTL ? "الذهب بالليرة التركية" : "Gold in Turkish Lira",
  fxTitle: isRTL ? "العملات مقابل الليرة التركية" : "Currencies vs Turkish Lira",
  updated: isRTL ? "آخر تحديث" : "Last update",
  retry: isRTL ? "إعادة المحاولة" : "Retry",
}

const FLAG_SIZE = 20

const FLAG_MAP: Record<string, JSX.Element> = {
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
  <div className="h-5 w-5 rounded-full border border-emerald-200/40 bg-emerald-400/15 shadow-[0_0_12px_rgba(16,185,129,0.35)]" aria-hidden="true" />
)

function getFlag(code?: string) {
  if (!code) return DEFAULT_FLAG
  return FLAG_MAP[code] ?? DEFAULT_FLAG
}
export default function PriceBoard() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)

  const load = async () => {
    try {
      const response = await fetch("/api/rates", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Failed to fetch rates")
      }
      const json = await response.json()
      setData(json)
      setError(false)
    } catch (err) {
      console.error("[PriceBoard] fetch error:", err)
      setError(true)
    }
  }

  useEffect(() => {
    load()
    const id = window.setInterval(load, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const goldRows = useMemo(
    () => [
        { label: isRTL ? "ذهب عيار 24" : "Gold 24K", value: num(data?.gold.k24, 0), suffix: "₺" },
        { label: isRTL ? "ذهب عيار 22" : "Gold 22K", value: num(data?.gold.k22, 0), suffix: "₺" },
        { label: isRTL ? "ذهب عيار 21" : "Gold 21K", value: num(data?.gold.k21, 0), suffix: "₺" },
        { label: isRTL ? "ذهب عيار 18" : "Gold 18K", value: num(data?.gold.k18, 0), suffix: "₺" },
        { label: isRTL ? "ذهب عيار 14" : "Gold 14K", value: num(data?.gold.k14, 0), suffix: "₺" },
        { label: isRTL ? "الليرة الذهبية (تم)" : "Full Coin (Tam)", value: num(data?.gold.tamAltin, 0), suffix: "₺" },
        { label: isRTL ? "أونصة الذهب بالدولار" : "Gold Ounce (XAUUSD)", value: num(data?.gold.ounceUSD, 2), suffix: "USD" },
    ],
    [data],
  )

  const fxRows = useMemo(
    () => [
      { code: "USD", label: "USD", value: num(data?.fx.USD_TRY), suffix: "₺", flagCode: "USD" },
      { code: "EUR", label: "EUR", value: num(data?.fx.EUR_TRY), suffix: "₺", flagCode: "EUR" },
      { code: "GBP", label: "GBP", value: num(data?.fx.GBP_TRY), suffix: "₺", flagCode: "GBP" },
      { code: "LYD", label: "LYD", value: num(data?.fx.LYD_TRY), suffix: "₺", flagCode: "LYD" },
      {
        code: "SYP",
        label: isRTL ? "الليرة السورية (USD/SYP)" : "Syrian Pound (USD/SYP)",
        value: num(data?.fx.SYP.USD_SYP, 0),
        suffix: isRTL ? "ل.س" : "SYP",
        flagCode: "SYP",
      },
      { code: "EGP", label: "EGP", value: num(data?.fx.EGP_TRY), suffix: "₺", flagCode: "EGP" },
      { code: "IQD", label: "IQD", value: num(data?.fx.IQD_TRY, 4), suffix: "₺", flagCode: "IQD" },
    ],
    [data],
  )

  const crossChips = useMemo(() => {
    if (!data) {
      return [
        { label: "EUR/USD", value: "—" },
        { label: "GBP/USD", value: "—" },
        { label: "EUR/GBP", value: "—" },
      ]
    }

    const { fx } = data
    const safeDivide = (numerator: number | null, denominator: number | null, decimals = 4) => {
      if (!numerator || !denominator || denominator === 0) return "—"
      return num(numerator / denominator, decimals)
    }

    return [
      { label: "EUR/USD", value: safeDivide(fx.EUR_TRY, fx.USD_TRY, 4) },
      { label: "GBP/USD", value: safeDivide(fx.GBP_TRY, fx.USD_TRY, 4) },
      { label: "EUR/GBP", value: safeDivide(fx.EUR_TRY, fx.GBP_TRY, 4) },
    ]
  }, [data])

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative isolate w-full overflow-hidden bg-gradient-to-br from-[#06110b] via-[#07150f] to-[#04110b] px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-teal-400/10 blur-[140px]" />
        <div className="absolute -bottom-40 right-0 h-72 w-72 rounded-full bg-lime-400/10 blur-[160px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-[28px] border border-emerald-200/10 bg-[#0a1711]/80 p-6 shadow-[0_45px_130px_rgba(6,17,11,0.55)] backdrop-blur-xl md:p-10 lg:p-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-emerald-200/40 bg-white/15 shadow-[0_0_18px_rgba(16,185,129,0.45)]">
              <Image src="/images/liirat-logo.png" alt="Liirat logo" fill className="object-contain p-1.5" priority />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold tracking-[0.3em] text-emerald-100 uppercase sm:text-lg">
                {LABELS.heading}
              </p>
              <p className="text-xs text-emerald-200/80 sm:text-sm">{LABELS.subheading}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-emerald-200/70 sm:text-xs">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            <span>
              {LABELS.updated}: {data ? tsPretty(data.ts) : "—"}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard title={LABELS.goldTitle}>
            {goldRows.map((row) => (
              <MetricRow key={row.label} label={row.label} value={row.value} suffix={row.suffix} />
            ))}
          </GlassCard>

          <GlassCard title={LABELS.fxTitle}>
            {fxRows.map((row) => (
              <MetricRow
                key={row.label}
                label={row.label}
                value={row.value}
                suffix={row.suffix}
                flag={getFlag(row.flagCode)}
                code={row.code}
              />
            ))}
          </GlassCard>
        </div>

        <div className="flex flex-wrap gap-2">
          {crossChips.map((chip) => (
            <Chip key={chip.label} label={chip.label} value={chip.value} />
          ))}
        </div>

        {error && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100 sm:text-sm">
            <span>{isRTL ? "تعذر تحميل الأسعار. تأكد من الاتصال بالإنترنت أو أعد المحاولة." : "We couldn’t load live rates. Please check your connection and try again."}</span>
            <button
              type="button"
              onClick={load}
              className="rounded-full border border-red-200/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-red-100 transition hover:border-red-100 hover:text-red-50"
            >
              {LABELS.retry}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function GlassCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-emerald-200/15 bg-[#0d1c15]/80 p-6 shadow-[0_35px_90px_rgba(6,17,11,0.45)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-10 right-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-emerald-500/10 blur-[130px]" />
      </div>
      <div className="relative flex items-center gap-3 pb-4">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100 sm:text-[13px]">{title}</h3>
      </div>
      <div className="relative space-y-3.5">{children}</div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  suffix,
  flag,
  code,
}: {
  label: string
  value: string
  suffix: string
  flag?: ReactNode
  code?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-emerald-100/10 bg-white/8 px-3.5 py-3 text-emerald-100 shadow-[0_18px_55px_rgba(6,17,11,0.25)] backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200/25 bg-emerald-400/10">
          {flag ?? DEFAULT_FLAG}
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-emerald-50/90">{label}</span>
          {code && <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-200/60">{code}</span>}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-semibold tracking-tight text-emerald-50 sm:text-lg">{value}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">{suffix}</span>
      </div>
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100 shadow-[0_16px_40px_rgba(6,17,11,0.35)] backdrop-blur-md">
      <span>{label}</span>
      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100/90">{value}</span>
    </div>
  )
}
