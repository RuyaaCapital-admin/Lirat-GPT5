import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 30 // Maximum 30 seconds for price fetch

/**
 * Get Price API Route for Agent Builder
 * 
 * This endpoint provides real-time price data for any symbol.
 * Used by ChatKit agent as a function tool.
 * 
 * @param symbol - Stock, crypto, or forex symbol (e.g., "AAPL", "BTCUSD", "EURUSD")
 * @returns Price data with symbol, price, change, volume, etc.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")?.toUpperCase().trim()

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
    // Use FMP Premium quote endpoint
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${token}`

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "LIIRAT-Agent/1.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[FMP Price] Error for ${symbol}:`, response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch price for ${symbol}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const quote = Array.isArray(data) ? data[0] : data

    if (!quote || !quote.symbol) {
      return NextResponse.json(
        { error: `No price data found for symbol: ${symbol}` },
        { status: 404 }
      )
    }

    // Return normalized, agent-friendly format
    // Ensure all values are proper types (no null, all numbers are numbers)
    const result = {
      symbol: String(quote.symbol || symbol),
      name: String(quote.name || symbol || ""),
      price: Number(quote.price) || 0,
      change: Number(quote.change) || 0,
      changePercent: Number(quote.changesPercentage) || 0,
      volume: Number(quote.volume) || 0,
      marketCap: quote.marketCap ? Number(quote.marketCap) : undefined,
      high: quote.dayHigh ? Number(quote.dayHigh) : undefined,
      low: quote.dayLow ? Number(quote.dayLow) : undefined,
      open: quote.open ? Number(quote.open) : undefined,
      previousClose: quote.previousClose ? Number(quote.previousClose) : undefined,
      timestamp: quote.timestamp ? Number(quote.timestamp) : Date.now(),
      exchange: quote.exchange ? String(quote.exchange) : undefined,
    }
    
    // Remove undefined fields to keep response clean
    Object.keys(result).forEach(key => {
      if (result[key as keyof typeof result] === undefined) {
        delete result[key as keyof typeof result]
      }
    })

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    console.error(`[FMP Price] Unexpected error for ${symbol}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch price data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

