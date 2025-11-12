export const dynamic = "force-dynamic"

type Pair = {
  base: string
  quote: string
}

function parsePairs(searchParams: URLSearchParams): Pair[] {
  const pairs = searchParams.getAll("pair")
  const unique = new Set<string>()
  const parsed: Pair[] = []

  for (const raw of pairs) {
    if (!raw) continue
    const sanitized = raw.toUpperCase().replace(/\s+/g, "")
    if (!/^[A-Z]{3}-[A-Z]{3}$/.test(sanitized)) continue
    if (unique.has(sanitized)) continue
    unique.add(sanitized)
    const [base, quote] = sanitized.split("-")
    parsed.push({ base, quote })
  }

  return parsed
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const pairs = parsePairs(searchParams)
  const token = process.env.FMP_API_KEY

  if (!token) {
    return Response.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  if (pairs.length === 0) {
    return Response.json({ error: "pair query parameter required e.g. pair=USD-TRY" }, { status: 400 })
  }

  try {
    const results = await Promise.all(
      pairs.map(async ({ base, quote }) => {
        const endpoint = `https://financialmodelingprep.com/api/v3/fx/real-time-rate/${base}/${quote}?apikey=${token}`

        try {
          const response = await fetch(endpoint, {
            cache: "no-store",
            headers: {
              "User-Agent": "LIIRAT-News/1.0",
            },
          })

          if (!response.ok) {
            const errorDetails = await response.text()
            console.error("[v0] FMP forex error:", endpoint, errorDetails)
            return {
              pair: `${base}-${quote}`,
              price: null,
              timestamp: Date.now(),
              change: null,
              changePercent: null,
            }
          }

          const data = await response.json()
          const price = data?.price ?? data?.bid ?? data?.ask ?? null

          return {
            pair: `${base}-${quote}`,
            price,
            timestamp: data?.timestamp ? Number(data.timestamp) * 1000 : Date.now(),
            change: data?.change ?? null,
            changePercent: data?.changesPercentage ?? null,
          }
        } catch (error) {
          console.error("[v0] Forex fetch pair failed:", endpoint, error)
          return {
            pair: `${base}-${quote}`,
            price: null,
            timestamp: Date.now(),
            change: null,
            changePercent: null,
          }
        }
      }),
    )

    return Response.json({ rates: results })
  } catch (error) {
    console.error("[v0] Forex fetch error:", error)
    return Response.json({ error: "Failed to fetch forex rates" }, { status: 500 })
  }
}
