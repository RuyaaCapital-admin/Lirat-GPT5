export const dynamic = "force-dynamic"

export async function GET() {
  const token = process.env.FMP_API_KEY
  if (!token) {
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const url = `https://financialmodelingprep.com/stable/news/stock-latest?limit=50&apikey=${token}`

    console.log("[v0] Fetching FMP financial news")

    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`)
    }

    const items = await response.json()

    // Normalize FMP news response
    const normalizedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
      title: item.title,
      text: item.text,
      link: item.link,
      source: item.site,
      publishedDate: item.publishedDate,
      image: item.image,
      symbol: item.symbol,
      sentiment: item.sentiment || "neutral",
    }))

    return Response.json({ items: normalizedItems })
  } catch (error) {
    console.error("[v0] FMP news fetch error:", error)
    return Response.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}
