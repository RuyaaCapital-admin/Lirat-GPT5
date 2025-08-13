export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "XAUUSD").toUpperCase()
  const token = process.env.EODHD_API_TOKEN

  if (!token) {
    return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  }

  try {
    const url = `${process.env.EODHD_BASE}/real-time/${symbol}?api_token=${token}&fmt=json`
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`)
    }

    const data = await response.json()
    return Response.json({
      symbol,
      price: +data.close,
      change: +data.change,
      changePercent: +data.change_p,
      ts: Math.floor(new Date(data.timestamp || Date.now()).getTime() / 1000),
    })
  } catch (error) {
    console.error("Realtime data fetch error:", error)
    return Response.json({ error: "Failed to fetch realtime data" }, { status: 500 })
  }
}
