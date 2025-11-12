export const dynamic = "force-dynamic"

export async function GET() {
  const token = process.env.FMP_API_KEY
  if (!token) {
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const url = `https://financialmodelingprep.com/stable/economic-calendar?limit=100&apikey=${token}`

    console.log("[v0] Fetching FMP economic calendar")

    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`)
    }

    const items = await response.json()

    // Normalize FMP economic calendar response
    const normalizedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
      event: item.event,
      country: item.country,
      date: item.releaseDate || "",
      time: item.releaseTime || "",
      actual: item.actual,
      forecast: item.forecast,
      previous: item.previous,
      impact: item.impact || "Medium",
    }))

    console.log("[v0] Normalized items count:", normalizedItems.length)
    console.log("[v0] First item:", normalizedItems[0])

    return Response.json({ items: normalizedItems })
  } catch (error) {
    console.error("[v0] FMP economic calendar fetch error:", error)
    return Response.json({ error: "Failed to fetch economic calendar" }, { status: 500 })
  }
}
