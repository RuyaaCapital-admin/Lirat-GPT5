export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol") || "AAPL.US"
  const token = process.env.EODHD_API_TOKEN

  if (!token) {
    return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  }

  try {
    const baseUrl = "https://eodhd.com"
    const url = `${baseUrl}/api/real-time/${symbol}?api_token=${token}&fmt=json`

    console.log("[v0] Fetching realtime data from:", url.replace(token, "***"))

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "LIIRAT-News/1.0",
      },
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Error response body:", errorText)
      throw new Error(`EODHD API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] Received data for", symbol, ":", data)

    const normalizedData = {
      symbol: data.code || symbol,
      price: Number.parseFloat(data.close || data.price || data.last || 0),
      change: Number.parseFloat(data.change || data.change_abs || 0),
      changePercent: Number.parseFloat(data.change_p || data.change_pct || 0),
      volume: Number.parseFloat(data.volume || 0),
      ts: Math.floor(new Date(data.timestamp || data.gmtoffset || Date.now()).getTime() / 1000),
    }

    return Response.json(normalizedData)
  } catch (error) {
    console.error("[v0] Realtime data fetch error:", error)
    return Response.json(
      {
        error: "Failed to fetch realtime data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
