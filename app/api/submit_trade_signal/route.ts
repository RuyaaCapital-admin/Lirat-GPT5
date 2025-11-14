import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const USER_AGENT = "LIIRAT-Agent/1.0"
const DEFAULT_TIMEFRAME = "1d"
const TIMEFRAME_MAP: Record<string, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1hour",
  "4h": "4hour",
  "1d": "1day",
  "1w": "1week",
  "1mo": "1month",
}

type IndicatorPoint = Record<string, unknown>

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

function sanitizeTimeframe(raw: string | null) {
  if (!raw) return { requested: DEFAULT_TIMEFRAME, resolved: TIMEFRAME_MAP[DEFAULT_TIMEFRAME] }
  const lower = raw.toLowerCase()
  if (TIMEFRAME_MAP[lower]) {
    return { requested: lower, resolved: TIMEFRAME_MAP[lower] }
  }
  return { requested: DEFAULT_TIMEFRAME, resolved: TIMEFRAME_MAP[DEFAULT_TIMEFRAME] }
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": USER_AGENT },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upstream ${response.status}: ${errorText || "unknown error"}`)
  }
  return response.json()
}

async function fetchIndicator(
  type: "rsi" | "macd",
  timeframe: string,
  symbol: string,
  token: string,
) {
  const url = `https://financialmodelingprep.com/api/v3/technical_indicator/${timeframe}/${symbol}?period=14&type=${type}&apikey=${token}`
  const data = await fetchJson(url)
  return Array.isArray(data) ? data : []
}

async function fetchQuote(symbol: string, token: string) {
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${token}`
  const data = await fetchJson(url)
  return Array.isArray(data) ? data[0] : data
}

function latestPoint(series: IndicatorPoint[]) {
  if (!Array.isArray(series) || series.length === 0) return null
  return series[series.length - 1]
}

function buildSummary(signal: string, reasons: string[], timeframe: string) {
  if (signal === "BULLISH") {
    return `Buyers have the advantage on the ${timeframe} view${reasons.length ? ` because ${reasons[0].toLowerCase()}` : ""}.`
  }
  if (signal === "BEARISH") {
    return `Sellers are dictating the ${timeframe} tape${reasons.length ? ` with ${reasons[0].toLowerCase()}` : ""}.`
  }
  return `Momentum is balanced on the ${timeframe} timeframe — wait for confirmation.`
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawSymbol = searchParams.get("symbol")
  const symbol = rawSymbol?.replace(/\s+/g, "").toUpperCase()
  const { requested: requestedTimeframe, resolved: fmpTimeframe } = sanitizeTimeframe(
    searchParams.get("timeframe"),
  )

  if (!symbol) {
    return NextResponse.json({ error: "Symbol parameter is required" }, { status: 400 })
  }

  const token = process.env.FMP_API_KEY
  if (!token) {
    return NextResponse.json({ error: "FMP_API_KEY not configured" }, { status: 500 })
  }

  try {
    const [rsiResult, macdResult, quoteResult] = await Promise.allSettled([
      fetchIndicator("rsi", fmpTimeframe, symbol, token),
      fetchIndicator("macd", fmpTimeframe, symbol, token),
      fetchQuote(symbol, token),
    ])

    const latestRsi = rsiResult.status === "fulfilled" ? latestPoint(rsiResult.value) : null
    const latestMacd = macdResult.status === "fulfilled" ? latestPoint(macdResult.value) : null
    const quote =
      quoteResult.status === "fulfilled" && quoteResult.value && quoteResult.value.symbol
        ? quoteResult.value
        : null

    let score = 0
    const reasons: string[] = []

    const rsiValue = latestRsi ? toNumber(latestRsi.rsi ?? latestRsi.RSI) : null
    if (rsiValue !== null) {
      if (rsiValue >= 70) {
        score -= 1
        reasons.push(`RSI overheated at ${rsiValue.toFixed(1)}`)
      } else if (rsiValue <= 30) {
        score += 1
        reasons.push(`RSI oversold at ${rsiValue.toFixed(1)}`)
      }
    }

    const macdValue = latestMacd ? toNumber(latestMacd.macd) : null
    const macdSignal =
      latestMacd ? toNumber(latestMacd.signal ?? latestMacd.macd_signal ?? latestMacd.macdSignal) : null
    const macdHistogram = latestMacd ? toNumber(latestMacd.histogram ?? latestMacd.macdHist) : null

    if (macdValue !== null && macdSignal !== null) {
      if (macdValue > macdSignal) {
        score += 1
        reasons.push("MACD bullish crossover")
      } else if (macdValue < macdSignal) {
        score -= 1
        reasons.push("MACD bearish crossover")
      }
    }

    const changePercent = quote ? toNumber(quote.changesPercentage) : null
    if (changePercent !== null && Math.abs(changePercent) >= 2) {
      const direction = changePercent > 0 ? "up" : "down"
      score += changePercent > 0 ? 0.5 : -0.5
      reasons.push(`Price momentum ${direction} ${changePercent.toFixed(2)}% today`)
    }

    const signal = score > 0.25 ? "BULLISH" : score < -0.25 ? "BEARISH" : "NEUTRAL"
    const signalStrength = Math.min(Math.round(Math.abs(score)), 3)
    const summary = buildSummary(signal, reasons, requestedTimeframe)

    const response = {
      symbol,
      timeframe: requestedTimeframe,
      sourceTimeframe: fmpTimeframe,
      signal,
      signalStrength,
      summary,
      reasons,
      indicators: {
        rsi:
          rsiValue !== null
            ? {
                value: rsiValue,
                zone: rsiValue >= 70 ? "overbought" : rsiValue <= 30 ? "oversold" : "neutral",
                observedAt: latestRsi?.date ?? latestRsi?.timestamp ?? null,
              }
            : undefined,
        macd:
          macdValue !== null && macdSignal !== null
            ? {
                macd: macdValue,
                signal: macdSignal,
                histogram: macdHistogram,
                observedAt: latestMacd?.date ?? latestMacd?.timestamp ?? null,
              }
            : undefined,
      },
      price:
        quote && quote.price !== undefined
          ? {
              current: toNumber(quote.price) ?? 0,
              change: toNumber(quote.change),
              changePercent,
            }
          : undefined,
      timestamp: Date.now(),
      meta: {
        rsiLoaded: rsiResult.status === "fulfilled",
        macdLoaded: macdResult.status === "fulfilled",
        quoteLoaded: Boolean(quote),
      },
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("[submit_trade_signal] fatal", error)
    return NextResponse.json(
      {
        error: "Failed to fetch trading signal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

