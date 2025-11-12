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
      { code: "USD", label: "USD", value: num(data?.fx.USD_TRY), suffix: "₺" },
      { code: "EUR", label: "EUR", value: num(data?.fx.EUR_TRY), suffix: "₺" },
      { code: "GBP", label: "GBP", value: num(data?.fx.GBP_TRY), suffix: "₺" },
      { code: "LYD", label: "LYD", value: num(data?.fx.LYD_TRY), suffix: "₺" },
      {
        code: "SYP",
        label: isRTL ? "الليرة السورية (USD/SYP)" : "Syrian Pound (USD/SYP)",
        value: num(data?.fx.SYP.USD_SYP, 0),
        suffix: isRTL ? "ل.س" : "SYP",
      },
      { code: "EGP", label: "EGP", value: num(data?.fx.EGP_TRY), suffix: "₺" },
      { code: "IQD", label: "IQD", value: num(data?.fx.IQD_TRY, 4), suffix: "₺" },
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
      className="relative isolate w-full overflow-hidden bg-gradient-to-br from-[#06110b] via-[#081a11] to-[#06110b] px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-teal-400/10 blur-[140px]" />
        <div className="absolute -bottom-40 right-0 h-72 w-72 rounded-full bg-lime-400/10 blur-[160px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-[28px] border border-emerald-200/15 bg-white/5 p-6 shadow-[0_50px_140px_rgba(6,17,11,0.55)] backdrop-blur-xl md:p-10 lg:p-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-emerald-200/40 bg-white/10 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <Image src="/liirat-logo.png" alt="Liirat logo" fill className="object-contain p-2" priority />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold tracking-[0.35em] text-emerald-100 uppercase sm:text-xl">
                {LABELS.heading}
              </p>
              <p className="text-sm text-emerald-200/80 sm:text-base">{LABELS.subheading}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-emerald-200/70 sm:text-sm">
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
              <MetricRow key={row.label} label={row.label} value={row.value} suffix={row.suffix} code={row.code} />
            ))}
          </GlassCard>
        </div>

        <div className="flex flex-wrap gap-3">
          {crossChips.map((chip) => (
            <Chip key={chip.label} label={chip.label} value={chip.value} />
          ))}
        </div>

        {error && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <span>{isRTL ? "تعذر تحميل الأسعار. تأكد من الاتصال بالإنترنت أو أعد المحاولة." : "We couldn’t load live rates. Please check your connection and try again."}</span>
            <button
              type="button"
              onClick={load}
              className="rounded-full border border-red-200/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-100 transition hover:border-red-100 hover:text-red-50"
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
    <div className="relative overflow-hidden rounded-[24px] border border-emerald-200/15 bg-white/5 p-6 shadow-[0_35px_90px_rgba(6,17,11,0.45)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -top-10 right-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-[140px]" />
      </div>
      <div className="relative flex items-center gap-3 pb-5">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-100 sm:text-xs md:text-sm">{title}</h3>
      </div>
      <div className="relative space-y-4">{children}</div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  suffix,
  code,
}: {
  label: string
  value: string
  suffix: string
  code?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-emerald-100 shadow-[0_18px_55px_rgba(6,17,11,0.35)] backdrop-blur-lg">
      <div className="flex items-center gap-3">
        {code ? (
          <div className="grid h-9 w-9 place-items-center rounded-full border border-emerald-200/30 bg-emerald-400/10 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            {code}
          </div>
        ) : (
          <div className="grid h-2 w-2 place-items-center rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        )}
        <span className="text-sm font-medium text-emerald-50/90">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tracking-tight text-emerald-50 sm:text-xl">{value}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">{suffix}</span>
      </div>
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100 shadow-[0_16px_40px_rgba(6,17,11,0.4)] backdrop-blur-md">
      <span>{label}</span>
      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100/90">{value}</span>
    </div>
  )
}
