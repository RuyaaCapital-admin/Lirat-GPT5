export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "XAUUSD").toUpperCase()
  const tf = searchParams.get("tf") || "15m"
  const lookback = Number(searchParams.get("lookback") || 500)
  const token = process.env.EODHD_API_TOKEN

  if (!token) {
    return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  }

  try {
    const url = `${process.env.EODHD_BASE}/intraday/${symbol}?period=${tf.replace("m", "")}m&limit=${lookback}&api_token=${token}&fmt=json`
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`)
    }

    const rows = await response.json()
    const ohlcv = rows.map((b: any) => ({
      ts: Math.floor(new Date(b.datetime).getTime() / 1000),
      o: +b.open,
      h: +b.high,
      l: +b.low,
      c: +b.close,
      v: +b.volume,
    }))

    return Response.json({ symbol, tf, ohlcv })
  } catch (error) {
    console.error("OHLCV data fetch error:", error)
    return Response.json({ error: "Failed to fetch OHLCV data" }, { status: 500 })
  }
}
