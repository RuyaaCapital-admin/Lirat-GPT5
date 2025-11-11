export const dynamic = "force-dynamic"

export async function GET() {
  const token = process.env.FMP_API_KEY
  if (!token) {
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const url = `https://financialmodelingprep.com/stable/earnings-calendar?limit=100&apikey=${token}`

    console.log("[v0] Fetching FMP earnings calendar")

    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`)
    }

    const items = await response.json()

    // Normalize FMP earnings calendar response
    const normalizedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
      symbol: item.symbol,
      company: item.name,
      date: item.date,
      eps: item.eps,
      epsEstimated: item.epsEstimated,
      revenue: item.revenue,
      revenueEstimated: item.revenueEstimated,
      sentiment: item.sentiment || "neutral",
    }))

    return Response.json({ items: normalizedItems })
  } catch (error) {
    console.error("[v0] FMP earnings calendar fetch error:", error)
    return Response.json({ error: "Failed to fetch earnings calendar" }, { status: 500 })
  }
}
