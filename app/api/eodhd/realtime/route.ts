export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol") || "AAPL.US"
  const token = process.env.EODHD_API_TOKEN

  if (!token) {
    return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  }

  try {
    // Using correct EODHD API endpoint with hardcoded base URL
    const baseUrl = process.env.EODHD_BASE || "https://eodhd.com"
    const url = `${baseUrl}/api/real-time/${symbol}?api_token=${token}&fmt=json`

    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`)
    }

    const data = await response.json()

    return Response.json({
      symbol: data.code || symbol,
      price: Number.parseFloat(data.close || data.price || 0),
      change: Number.parseFloat(data.change || 0),
      changePercent: Number.parseFloat(data.change_p || 0),
      volume: Number.parseFloat(data.volume || 0),
      ts: Math.floor(new Date(data.timestamp || Date.now()).getTime() / 1000),
    })
  } catch (error) {
    console.error("Realtime data fetch error:", error)
    return Response.json({ error: "Failed to fetch realtime data" }, { status: 500 })
  }
}
