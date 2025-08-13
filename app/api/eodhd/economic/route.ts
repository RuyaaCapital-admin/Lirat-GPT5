export const dynamic = "force-dynamic"

export async function GET() {
  const token = process.env.EODHD_API_TOKEN
  if (!token) {
    return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  }

  try {
    const url = `${process.env.EODHD_BASE}/economic-events?api_token=${token}&fmt=json`
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`)
    }

    const items = await response.json()
    return Response.json({ items })
  } catch (error) {
    console.error("Economic data fetch error:", error)
    return Response.json({ error: "Failed to fetch economic data" }, { status: 500 })
  }
}
