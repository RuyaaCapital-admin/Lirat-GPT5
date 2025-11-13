import { NextResponse } from "next/server"
import { getFxPair, getXAUUSD } from "@/lib/fmp"

const TTL_MS = 55_000

type CachedPayload = {
  t: number
  data: any
}

let cache: CachedPayload | null = null

export async function GET() {
  try {
    if (cache && Date.now() - cache.t < TTL_MS) {
      return NextResponse.json(cache.data, {
        headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
      })
    }

    const [usdtry, eurtry, gbptry] = await Promise.all([
      getFxPair("USD", "TRY", true),
      getFxPair("EUR", "TRY", true),
      getFxPair("GBP", "TRY", true),
    ])

    const [lydtry, egptry, iqdtry, sypusd] = await Promise.all([
      getFxPair("LYD", "TRY", true).catch(() => null),
      getFxPair("EGP", "TRY", true).catch(() => null),
      getFxPair("IQD", "TRY", true).catch(() => null),
      getFxPair("SYP", "USD", true).catch(() => null),
    ])

    const xauusd = await getXAUUSD()
    const gram24 = (xauusd * usdtry) / 31.1035

    const gold = {
      k14: Math.round(gram24 * 0.583),
      k18: Math.round(gram24 * 0.75),
      k21: Math.round(gram24 * 0.875),
      k22: Math.round(gram24 * 0.916),
      k24: Math.round(gram24),
      tamAltin: Math.round(gram24 * 7.016),
      ounceUSD: Number(xauusd.toFixed(2)),
    }

    const fx = {
      USD_TRY: Number(usdtry.toFixed(2)),
      EUR_TRY: Number(eurtry.toFixed(2)),
      GBP_TRY: Number(gbptry.toFixed(2)),
      LYD_TRY: lydtry !== null ? Number(lydtry.toFixed(2)) : null,
      EGP_TRY: egptry !== null ? Number(egptry.toFixed(2)) : null,
      IQD_TRY: iqdtry !== null ? Number(iqdtry.toFixed(4)) : null,
      SYP: {
        USD_SYP: sypusd && sypusd !== 0 ? Number((1 / sypusd).toFixed(0)) : null,
      },
    }

    const payload = { ts: new Date().toISOString(), gold, fx }

    cache = { t: Date.now(), data: payload }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    })
  } catch (error) {
    console.error("[rates] fetch_failed:", error)
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 })
  }
}
