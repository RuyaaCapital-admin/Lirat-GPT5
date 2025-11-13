export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "AAPL").toUpperCase()
  const period = searchParams.get("period") || "5min" // 5min, 15min, 30min, 1hour, 4hour
  const limit = Number(searchParams.get("limit") || 100)
  const token = process.env.FMP_API_KEY

  if (!token) {
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const url = `https://financialmodelingprep.com/stable/historical-chart/${period}/${symbol}?limit=${limit}&apikey=${token}`

    console.log("[v0] Fetching FMP historical data for:", symbol)

    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`)
    }

    const data = await response.json()

    // FMP returns data in descending order, reverse to ascending
    const ohlcv = (Array.isArray(data) ? data : []).reverse().map((bar: any) => ({
      time: new Date(bar.date).getTime() / 1000,
      open: Number.parseFloat(bar.open),
      high: Number.parseFloat(bar.high),
      low: Number.parseFloat(bar.low),
      close: Number.parseFloat(bar.close),
      volume: Number.parseInt(bar.volume) || 0,
    }))

    return Response.json({ symbol, period, ohlcv })
  } catch (error) {
    console.error("[v0] FMP historical data fetch error:", error)
    return Response.json({ error: "Failed to fetch historical data" }, { status: 500 })
  }
}
