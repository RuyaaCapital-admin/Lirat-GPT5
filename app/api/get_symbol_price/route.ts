import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const USER_AGENT = "LIIRAT-Agent/1.0"
const FX_PAIR_REGEX = /^([A-Z]{3})[-/\s]?([A-Z]{3})$/

type NormalizedQuote = {
  symbol: string
  name?: string
  price: number
  change?: number | null
  changePercent?: number | null
  volume?: number | null
  marketCap?: number | null
  high?: number | null
  low?: number | null
  open?: number | null
  previousClose?: number | null
  timestamp: number
  exchange?: string
  source: string
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

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": USER_AGENT,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upstream ${response.status}: ${errorText || "unknown error"}`)
  }

  return response.json()
}

function normalizeResponse(result: NormalizedQuote) {
  const cleaned: Record<string, unknown> = {}
  Object.entries(result).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleaned[key] = value
    }
  })
  return cleaned
}

async function resolveEquityQuote(symbol: string, token: string): Promise<NormalizedQuote | null> {
  const endpoint = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${token}`
  const payload = await fetchJson(endpoint)
  const quote = Array.isArray(payload) ? payload[0] : payload
  if (!quote || !quote.symbol) {
    return null
  }

  return {
    symbol: String(quote.symbol),
    name: quote.name ? String(quote.name) : undefined,
    price: toNumber(quote.price) ?? 0,
    change: toNumber(quote.change),
    changePercent: toNumber(quote.changesPercentage),
    volume: toNumber(quote.volume),
    marketCap: toNumber(quote.marketCap),
    high: toNumber(quote.dayHigh),
    low: toNumber(quote.dayLow),
    open: toNumber(quote.open),
    previousClose: toNumber(quote.previousClose),
    timestamp: quote.timestamp ? Number(quote.timestamp) : Date.now(),
    exchange: quote.exchange ? String(quote.exchange) : undefined,
    source: "quote",
  }
}

function extractFxQuote(entry: any, fallbackSymbol: string) {
  const price =
    toNumber(entry?.price) ??
    toNumber(entry?.rate) ??
    toNumber(entry?.bid) ??
    toNumber(entry?.ask) ??
    null

  if (price === null) return null

  const change = toNumber(entry?.change)
  const changePercent =
    toNumber(entry?.changesPercentage) ?? toNumber(entry?.changePercent) ?? null
  const timestampValue =
    toNumber(entry?.timestamp) ?? toNumber(entry?.updated) ?? Date.now()

  return {
    symbol: fallbackSymbol,
    price,
    change,
    changePercent,
    timestamp: timestampValue && timestampValue < 10_000 ? timestampValue * 1000 : timestampValue,
  }
}

async function resolveFxQuote(base: string, quote: string, token: string): Promise<NormalizedQuote | null> {
  const symbolCompact = `${base}${quote}`
  const symbolDisplay = `${base}/${quote}`

  const candidates = [
    {
      source: "fx-real-time",
      url: `https://financialmodelingprep.com/api/v3/fx/real-time?symbol=${symbolCompact}&apikey=${token}`,
    },
    {
      source: "fx-real-time-rate",
      url: `https://financialmodelingprep.com/api/v3/fx/real-time-rate/${base}/${quote}?apikey=${token}`,
    },
    {
      source: "quote",
      url: `https://financialmodelingprep.com/api/v3/quote/${symbolCompact}?apikey=${token}`,
    },
  ]

  for (const candidate of candidates) {
    try {
      const payload = await fetchJson(candidate.url)
      const container = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [payload]
      for (const entry of container) {
        const parsed = extractFxQuote(entry, symbolDisplay.replace("/", ""))
        if (parsed) {
          return {
            symbol: symbolDisplay,
            name: symbolDisplay,
            price: parsed.price,
            change: parsed.change,
            changePercent: parsed.changePercent,
            timestamp: parsed.timestamp ?? Date.now(),
            exchange: "FX",
            source: candidate.source,
          }
        }
      }
    } catch (error) {
      console.error("[get_symbol_price] FX endpoint failed", candidate.url, error)
    }
  }

  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawSymbol = searchParams.get("symbol")
  const sanitized = rawSymbol?.replace(/\s+/g, "").toUpperCase()

  if (!sanitized) {
    return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 })
  }

  const token = process.env.FMP_API_KEY
  if (!token) {
    return NextResponse.json({ error: "FMP_API_KEY not configured" }, { status: 500 })
  }

  try {
    let quote: NormalizedQuote | null = null
    const fxMatch = sanitized.match(FX_PAIR_REGEX)

    if (fxMatch) {
      quote = await resolveFxQuote(fxMatch[1], fxMatch[2], token)
    }

    if (!quote) {
      quote = await resolveEquityQuote(sanitized, token)
    }

    if (!quote) {
      return NextResponse.json({ error: `No price data found for ${sanitized}` }, { status: 404 })
    }

    return NextResponse.json(normalizeResponse(quote), {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    console.error("[get_symbol_price] fatal", error)
    return NextResponse.json(
      {
        error: "Failed to fetch price data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

