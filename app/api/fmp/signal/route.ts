import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Get Trading Signal API Route for Agent Builder
 * 
 * This endpoint provides technical analysis and trading signals for any symbol.
 * Uses FMP Premium technical indicators endpoints.
 * 
 * @param symbol - Stock, crypto, or forex symbol (e.g., "AAPL", "BTCUSD")
 * @param timeframe - Optional: "1d", "1w", "1M" (default: "1d")
 * @returns Technical indicators and trading signals
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.toUpperCase().trim()
  const timeframe = searchParams.get("timeframe") || "1d"

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    )
  }

  const token = process.env.FMP_API_KEY

  if (!token) {
    return NextResponse.json(
      { error: "FMP_API_KEY not configured" },
      { status: 500 }
    )
  }

  try {
    // Fetch technical indicators from FMP Premium
    // Using multiple endpoints for comprehensive signal analysis
    const [rsiData, macdData, quoteData] = await Promise.allSettled([
      // RSI (Relative Strength Index)
      fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/${timeframe}/${symbol}?period=14&type=rsi&apikey=${token}`,
        { cache: "no-store" }
      ),
      // MACD
      fetch(
        `https://financialmodelingprep.com/api/v3/technical_indicator/${timeframe}/${symbol}?period=14&type=macd&apikey=${token}`,
        { cache: "no-store" }
      ),
      // Current quote for price context
      fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${token}`,
        { cache: "no-store" }
      ),
    ])

    const quote =
      quoteData.status === "fulfilled" && quoteData.value.ok
        ? await quoteData.value.json().then((d) => (Array.isArray(d) ? d[0] : d))
        : null

    const rsi =
      rsiData.status === "fulfilled" && rsiData.value.ok
        ? await rsiData.value.json()
        : []

    const macd =
      macdData.status === "fulfilled" && macdData.value.ok
        ? await macdData.value.json()
        : []

    // Get latest RSI and MACD values
    const latestRsi = Array.isArray(rsi) && rsi.length > 0 ? rsi[rsi.length - 1] : null
    const latestMacd = Array.isArray(macd) && macd.length > 0 ? macd[macd.length - 1] : null

    // Calculate signal strength
    let signal = "NEUTRAL"
    let signalStrength = 0
    const reasons: string[] = []

    if (latestRsi && latestRsi.rsi) {
      const rsiValue = Number(latestRsi.rsi)
      if (rsiValue > 70) {
        signal = "BEARISH"
        signalStrength += 1
        reasons.push(`RSI overbought (${rsiValue.toFixed(2)})`)
      } else if (rsiValue < 30) {
        signal = "BULLISH"
        signalStrength += 1
        reasons.push(`RSI oversold (${rsiValue.toFixed(2)})`)
      }
    }

    if (latestMacd && latestMacd.macd && latestMacd.signal) {
      const macdValue = Number(latestMacd.macd)
      const signalValue = Number(latestMacd.signal)
      if (macdValue > signalValue) {
        signal = signal === "BEARISH" ? "NEUTRAL" : "BULLISH"
        signalStrength += 1
        reasons.push("MACD bullish crossover")
      } else if (macdValue < signalValue) {
        signal = signal === "BULLISH" ? "NEUTRAL" : "BEARISH"
        signalStrength += 1
        reasons.push("MACD bearish crossover")
      }
    }

    if (quote && quote.changePercent) {
      const changePercent = Number(quote.changePercent)
      if (Math.abs(changePercent) > 2) {
        reasons.push(`Significant price movement: ${changePercent.toFixed(2)}%`)
      }
    }

    const result = {
      symbol,
      signal, // "BULLISH", "BEARISH", or "NEUTRAL"
      signalStrength: Math.min(signalStrength, 3), // 0-3 scale
      reasons,
      indicators: {
        rsi: latestRsi
          ? {
              value: Number(latestRsi.rsi) || null,
              date: latestRsi.date || null,
            }
          : null,
        macd: latestMacd
          ? {
              macd: Number(latestMacd.macd) || null,
              signal: Number(latestMacd.signal) || null,
              histogram: Number(latestMacd.histogram) || null,
              date: latestMacd.date || null,
            }
          : null,
      },
      price: quote
        ? {
            current: quote.price || null,
            change: quote.change || null,
            changePercent: quote.changesPercentage || null,
          }
        : null,
      timeframe,
      timestamp: Date.now(),
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error(`[FMP Signal] Unexpected error for ${symbol}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch trading signal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

