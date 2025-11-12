export const dynamic = "force-dynamic"

// Country code to name mapping for display
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  JP: "Japan",
  DE: "Germany",
  FR: "France",
  CN: "China",
  IN: "India",
  BR: "Brazil",
  CA: "Canada",
  AU: "Australia",
  MX: "Mexico",
  RU: "Russia",
  KR: "South Korea",
  IT: "Italy",
  ES: "Spain",
  CH: "Switzerland",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  BE: "Belgium",
  AT: "Austria",
  PL: "Poland",
  TR: "Turkey",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  SG: "Singapore",
  HK: "Hong Kong",
  NZ: "New Zealand",
  ZA: "South Africa",
  TH: "Thailand",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  VN: "Vietnam",
  EU: "European Union",
}

export async function GET() {
  const token = process.env.FMP_API_KEY
  if (!token) {
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?apikey=${token}`

    console.log("[v0] Fetching FMP economic calendar from:", url)

    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      console.error("[v0] FMP API response status:", response.status)
      throw new Error(`FMP API error: ${response.status}`)
    }

    const data = await response.json()
    const items = data.result || []

    const normalizedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
      event: item.event || "",
      countryCode: item.country || "",
      country: COUNTRY_NAMES[item.country] || item.country || "Unknown",
      date: item.releaseDate || "",
      time: item.releaseTime || "",
      actual: item.actual || null,
      forecast: item.forecast || null,
      previous: item.previous || null,
      impact: item.impact || "Medium",
    }))

    console.log("[v0] Normalized items count:", normalizedItems.length)
    if (normalizedItems.length > 0) {
      console.log("[v0] First item:", JSON.stringify(normalizedItems[0]))
    }

    return Response.json({ items: normalizedItems })
  } catch (error) {
    console.error("[v0] FMP economic calendar fetch error:", error)
    return Response.json({ items: [], error: "Failed to fetch economic calendar" }, { status: 200 })
  }
}
