import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    const apiKey = process.env.FMP_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&apikey=${apiKey}`,
    )

    if (!response.ok) {
      return NextResponse.json({ error: "FMP API error", status: response.status }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ results: data || [] })
  } catch (error) {
    console.error("[v0] FMP search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
