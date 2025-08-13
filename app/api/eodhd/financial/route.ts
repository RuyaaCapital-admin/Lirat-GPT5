export const dynamic = "force-dynamic"

export async function GET() {
  const token = process.env.EODHD_API_TOKEN
  if (!token) {
    return Response.json({ error: "EODHD_API_TOKEN missing" }, { status: 500 })
  }

  try {
    const url = `${process.env.EODHD_BASE}/news?api_token=${token}&fmt=json`
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`)
    }

    const items = await response.json()
    return Response.json({ items })
  } catch (error) {
    console.error("Financial news fetch error:", error)
    return Response.json({ error: "Failed to fetch financial news" }, { status: 500 })
  }
}
