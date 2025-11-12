export const dynamic = "force-dynamic"

type Locale = "en" | "ar"

async function translateText(text: string, target: Locale): Promise<string> {
  if (!text || target === "en") {
    return text
  }

  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: target,
    dt: "t",
    q: text,
  })

  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Translation request failed with status ${response.status}`)
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      return text
    }

    const segments = data[0]
    if (!Array.isArray(segments)) {
      return text
    }

    return segments.map((segment: any) => segment[0]).join("")
  } catch (error) {
    console.error("[v0] Translation error:", error)
    return text
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const localeParam = url.searchParams.get("locale")
  const locale: Locale = localeParam === "ar" ? "ar" : "en"
  const token = process.env.FMP_API_KEY
  if (!token) {
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const requestUrl = `https://financialmodelingprep.com/stable/news/stock-latest?limit=50&apikey=${token}`

    console.log("[v0] Fetching FMP financial news")

    const response = await fetch(requestUrl, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`)
    }

    const items = await response.json()

    // Normalize FMP news response
    let normalizedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
      title: item.title,
      text: item.text,
      link: item.link,
      source: item.site,
      publishedDate: item.publishedDate,
      image: item.image,
      symbol: item.symbol,
      sentiment: item.sentiment || "neutral",
    }))

    if (locale === "ar") {
      const translated = await Promise.all(
        normalizedItems.map(async (item) => {
          const truncatedText = typeof item.text === "string" ? item.text.slice(0, 1200) : ""
          const [title, text] = await Promise.all([
            translateText(item.title ?? "", "ar"),
            translateText(truncatedText, "ar"),
          ])

          return {
            ...item,
            title: title || item.title,
            text: text ? `${text}${truncatedText.length < (item.text?.length ?? 0) ? "…" : ""}` : item.text,
          }
        }),
      )

      normalizedItems = translated
    }

    return Response.json({ items: normalizedItems })
  } catch (error) {
    console.error("[v0] FMP news fetch error:", error)
    return Response.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}
