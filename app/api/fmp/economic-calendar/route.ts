export const dynamic = "force-dynamic"

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
    console.error("[v0] FMP_API_KEY missing")
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const economicUrl = `https://financialmodelingprep.com/api/v3/economic_calendar?apikey=${token}`

    console.log("[v0] Fetching FMP economic calendar...")
    const economicResponse = await fetch(economicUrl, { cache: "no-store" })

    if (!economicResponse.ok) {
      console.error("[v0] Economic calendar API status:", economicResponse.status)
      throw new Error(`Economic calendar API error: ${economicResponse.status}`)
    }

    const economicData = await economicResponse.json()

    const items = Array.isArray(economicData) ? economicData : []

    console.log("[v0] Economic calendar items count:", items.length)

    const normalizedItems = items.map((item: any) => {
      const eventDate = new Date(item.date)
      return {
        id: `${item.event}-${item.country}-${item.date}`,
        event: item.event || "",
        countryCode: item.country || "",
        country: COUNTRY_NAMES[item.country] || item.country || "Unknown",
        date: item.date || "",
        actual: item.actual !== null && item.actual !== undefined ? item.actual : null,
        forecast: item.estimate !== null && item.estimate !== undefined ? item.estimate : null,
        previous: item.previous !== null && item.previous !== undefined ? item.previous : null,
        change: item.change !== null && item.change !== undefined ? item.change : null,
        changePercentage:
          item.changePercentage !== null && item.changePercentage !== undefined ? item.changePercentage : null,
        impact: item.impact || "Medium",
        timestamp: eventDate.getTime(),
      }
    })

    normalizedItems.sort((a: any, b: any) => b.timestamp - a.timestamp)

    console.log("[v0] Normalized items count:", normalizedItems.length)
    if (normalizedItems.length > 0) {
      console.log("[v0] Sample item:", JSON.stringify(normalizedItems[0]))
    }

    return Response.json({ items: normalizedItems, count: normalizedItems.length })
  } catch (error) {
    console.error("[v0] Economic calendar fetch error:", error instanceof Error ? error.message : String(error))
    return Response.json({ items: [], count: 0, error: "Failed to fetch economic calendar" }, { status: 200 })
  }
}
