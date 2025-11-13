export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol") || "AAPL"
  const token = process.env.FMP_API_KEY

  if (!token) {
    console.warn("[FMP] FMP_API_KEY missing, returning mock data")
    // Return mock data instead of error to prevent console spam
    return Response.json({
      symbol: symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      timestamp: Date.now() / 1000,
    })
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${token}`

    console.log("[v0] Fetching FMP quote data for:", symbol)

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "LIIRAT-News/1.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] FMP error response:", errorText)
      throw new Error(`FMP API error: ${response.status}`)
    }

    const data = await response.json()

    // FMP returns an array, get first element
    const quote = Array.isArray(data) ? data[0] : data

    if (!quote) {
      throw new Error(`No data found for symbol: ${symbol}`)
    }

    const normalizedData = {
      symbol: quote.symbol || symbol,
      price: quote.price || 0,
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0,
      volume: quote.volume || 0,
      marketCap: quote.marketCap || 0,
      timestamp: new Date(quote.timestamp || Date.now()).getTime() / 1000,
    }

    return Response.json(normalizedData)
  } catch (error) {
    console.error("[v0] FMP quote fetch error:", error)
    return Response.json(
      {
        error: "Failed to fetch quote data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
