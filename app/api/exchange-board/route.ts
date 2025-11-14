import { NextResponse } from "next/server"

const USER_AGENT = "LIIRAT-ExchangeBoard/1.0"

type FxPair = {
  key: string
  base: string
  quote: string
}

const FX_PAIRS: FxPair[] = [
  { key: "USD_TRY", base: "USD", quote: "TRY" },
  { key: "EUR_TRY", base: "EUR", quote: "TRY" },
  { key: "GBP_TRY", base: "GBP", quote: "TRY" },
  { key: "LYD_TRY", base: "LYD", quote: "TRY" },
  { key: "EGP_TRY", base: "EGP", quote: "TRY" },
  { key: "IQD_TRY", base: "IQD", quote: "TRY" },
  { key: "USD_SYP", base: "USD", quote: "SYP" },
]

type FxQuote = {
  price: number | null
  changePercent: number | null
  timestamp: number
}

type ExchangeBoardResponse = {
  updatedAt: number
  fx: Record<string, FxQuote>
  gold: Record<string, number | null>
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function pickChangePercent(entry: any, fallbackPrice: number | null, fallbackChange: number | null) {
  const percent =
    toNumber(entry?.changesPercentage) ??
    toNumber(entry?.changePercent) ??
    toNumber(entry?.changes_percentage)
  if (percent !== null) return percent

  if (fallbackPrice !== null && fallbackChange !== null && fallbackPrice - fallbackChange !== 0) {
    const previous = fallbackPrice - fallbackChange
    if (previous !== 0) {
      return (fallbackChange / previous) * 100
    }
  }
  return null
}

function normalizeSymbol(symbol: string) {
  return symbol.replace(/[^A-Za-z]/g, "").toUpperCase()
}

function coerceQuote(entry: any, symbolKey: string): FxQuote | null {
  if (!entry) return null
  const price =
    toNumber(entry.price) ??
    toNumber(entry.rate) ??
    toNumber(entry.bid) ??
    toNumber(entry.ask) ??
    null
  if (price === null) return null

  const change = toNumber(entry.change)
  const changePercent = pickChangePercent(entry, price, change)
  const symbol = normalizeSymbol(entry.symbol ?? entry.pair ?? entry.ticker ?? symbolKey)
  if (symbol !== symbolKey) {
    return null
  }

  const timestampRaw = toNumber(entry.timestamp) ?? toNumber(entry.updated) ?? Date.now()
  const timestamp = timestampRaw && timestampRaw < 10_000 ? timestampRaw * 1000 : timestampRaw

  return {
    price,
    changePercent,
    timestamp: timestamp ?? Date.now(),
  }
}

async function fetchFxQuote(base: string, quote: string, token: string): Promise<FxQuote | null> {
  const symbolKey = `${base}${quote}`.toUpperCase()
  const endpoints = [
    `https://financialmodelingprep.com/api/v3/fx/real-time?symbol=${symbolKey}&apikey=${token}`,
    `https://financialmodelingprep.com/api/v3/fx/real-time-rate/${base}/${quote}?apikey=${token}`,
  ]

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": USER_AGENT },
      })
      if (!response.ok) {
        continue
      }
      const payload = await response.json()
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [payload]
      for (const entry of list) {
        const parsed = coerceQuote(entry, symbolKey)
        if (parsed) {
          return parsed
        }
      }
    } catch (error) {
      console.error("[exchange-board] fx fetch failed", url, error)
    }
  }

  return null
}

function deriveGoldFromGram(gram24: number | null) {
  if (gram24 === null) {
    return {
      k24: null,
      k22: null,
      k21: null,
      k18: null,
      k14: null,
      tamAltin: null,
    }
  }

  return {
    k24: Math.round(gram24),
    k22: Math.round(gram24 * 0.916),
    k21: Math.round(gram24 * 0.875),
    k18: Math.round(gram24 * 0.75),
    k14: Math.round(gram24 * 0.583),
    tamAltin: Math.round(gram24 * 7.016),
  }
}

async function fetchGold(token: string, usdTry: number | null) {
  try {
    const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/XAUUSD?apikey=${token}`, {
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT },
    })

    if (!response.ok) {
      throw new Error(`XAUUSD error ${response.status}`)
    }

    const payload = await response.json()
    const quote = Array.isArray(payload) ? payload[0] : payload
    const ounceUSD = toNumber(quote?.price)
    let gram24: number | null = null
    if (ounceUSD !== null && usdTry) {
      gram24 = Number(((ounceUSD * usdTry) / 31.1035).toFixed(0))
    }

    const derived = deriveGoldFromGram(gram24)
    return { ounceUSD, ...derived }
  } catch (error) {
    console.error("[exchange-board] gold fetch failed", error)
    return {
      ounceUSD: null,
      ...deriveGoldFromGram(null),
    }
  }
}

export async function GET() {
  const token = process.env.FMP_API_KEY
  if (!token) {
    return NextResponse.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const fxEntries: Record<string, FxQuote> = {}
    await Promise.all(
      FX_PAIRS.map(async (pair) => {
        const quote = await fetchFxQuote(pair.base, pair.quote, token)
        fxEntries[pair.key] = quote ?? { price: null, changePercent: null, timestamp: Date.now() }
      }),
    )

    const usdTry = fxEntries["USD_TRY"]?.price ?? null
    const usdSyp = fxEntries["USD_SYP"]?.price ?? null
    if (usdTry && usdSyp) {
      const computed = usdSyp / usdTry
      fxEntries["TRY_SYP"] = {
        price: Number(computed.toFixed(0)),
        changePercent: null,
        timestamp: Date.now(),
      }
    } else {
      fxEntries["TRY_SYP"] = { price: null, changePercent: null, timestamp: Date.now() }
    }

    const gold = await fetchGold(token, usdTry)

    const response: ExchangeBoardResponse = {
      updatedAt: Date.now(),
      fx: fxEntries,
      gold,
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    console.error("[exchange-board] fatal", error)
    return NextResponse.json({ error: "Unable to load exchange board" }, { status: 500 })
  }
}
