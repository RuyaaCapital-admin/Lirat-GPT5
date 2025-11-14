export const dynamic = "force-dynamic"

const USER_AGENT = "LIIRAT-ForexPanel/1.0"

type Pair = {
  base: string
  quote: string
}

type FxQuote = {
  pair: string
  price: number | null
  change: number | null
  changePercent: number | null
  timestamp: number
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeSymbol(symbol: string) {
  return symbol.replace(/[^A-Za-z]/g, "").toUpperCase()
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

function coerceQuote(
  payload: any,
  symbolKey: string,
): { price: number | null; change: number | null; changePercent: number | null; timestamp: number } | null {
  if (!payload || typeof payload !== "object") return null
  const price =
    toNumber(payload.price) ?? toNumber(payload.rate) ?? toNumber(payload.bid) ?? toNumber(payload.ask) ?? null

  const change = toNumber(payload.change) ?? toNumber(payload.changes) ?? null
  const changePercent =
    toNumber(payload.changesPercentage) ??
    toNumber(payload.changePercent) ??
    toNumber(payload.changes_percentage) ??
    null

  const timestampSource = toNumber(payload.timestamp) ?? toNumber(payload.updated) ?? toNumber(payload.updatedAt)
  const timestamp = timestampSource ? (timestampSource > 10_000 ? timestampSource : timestampSource * 1000) : Date.now()

  if (price === null) return null

  const symbolRaw = normalizeSymbol(String(payload.symbol ?? payload.ticker ?? payload.pair ?? symbolKey))
  if (symbolRaw && symbolRaw !== symbolKey) {
    return null
  }

  return {
    price,
    change,
    changePercent,
    timestamp,
  }
}

function tryParseRealTimePayload(
  payload: unknown,
  symbolKey: string,
): { price: number | null; change: number | null; changePercent: number | null; timestamp: number } | null {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as any)?.data)
      ? (payload as any).data
      : null

  if (list) {
    for (const entry of list) {
      const parsed = coerceQuote(entry, symbolKey)
      if (parsed) {
        return parsed
      }
    }
  }

  if (payload && typeof payload === "object") {
    const entries = Object.values(payload)
    for (const entry of entries) {
      const parsed = coerceQuote(entry, symbolKey)
      if (parsed) {
        return parsed
      }
    }
  }

  return null
}

async function fetchFxQuote(base: string, quote: string, token: string) {
  const symbolKey = normalizeSymbol(`${base}${quote}`)
  const endpoints: {
    url: string
    parser: (payload: unknown, symbolKey: string) =>
      | { price: number | null; change: number | null; changePercent: number | null; timestamp: number }
      | null
  }[] = [
    {
      url: `https://financialmodelingprep.com/api/v3/fx/real-time?symbol=${symbolKey}&apikey=${token}`,
      parser: tryParseRealTimePayload,
    },
    {
      url: `https://financialmodelingprep.com/api/v3/fx/real-time-rate/${base}/${quote}?apikey=${token}`,
      parser: (payload) => coerceQuote(payload, symbolKey),
    },
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        cache: "no-store",
        headers: { "User-Agent": USER_AGENT },
      })

      if (!response.ok) {
        const details = await response.text()
        console.error("[forex] upstream error", response.status, endpoint.url, details)
        continue
      }

      const json = await response.json()
      const parsed = endpoint.parser(json, symbolKey)
      if (parsed) {
        return parsed
      }
    } catch (error) {
      console.error("[forex] failed request", endpoint.url, error)
    }
  }

  return null
}

function enrichDerivedPairs(quotes: FxQuote[]) {
  const map = new Map(quotes.map((quote) => [quote.pair, quote]))
  const usdTry = map.get("USD-TRY")
  const usdSyp = map.get("USD-SYP")
  const trySyp = map.get("TRY-SYP")

  if (trySyp && (trySyp.price === null || Number.isNaN(trySyp.price))) {
    map.delete("TRY-SYP")
  }

  if ((!trySyp || trySyp.price === null) && usdTry?.price && usdSyp?.price) {
    const computedPrice = usdSyp.price / usdTry.price
    const prevUsdTry =
      usdTry.price !== null && usdTry.change !== null ? usdTry.price - usdTry.change : null
    const prevUsdSyp =
      usdSyp.price !== null && usdSyp.change !== null ? usdSyp.price - usdSyp.change : null
    const prevComputed =
      prevUsdTry !== null && prevUsdSyp !== null && prevUsdTry !== 0 ? prevUsdSyp / prevUsdTry : null

    const change = prevComputed !== null ? computedPrice - prevComputed : null
    const changePercent =
      change !== null && prevComputed !== null && prevComputed !== 0 ? (change / prevComputed) * 100 : null

    const derived: FxQuote = {
      pair: "TRY-SYP",
      price: Number(computedPrice.toFixed(0)),
      change: change !== null ? Number(change.toFixed(2)) : null,
      changePercent: changePercent !== null ? Number(changePercent.toFixed(2)) : null,
      timestamp: Math.max(usdTry.timestamp, usdSyp.timestamp),
    }
    quotes.push(derived)
  }

  return quotes
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
        const pairKey = `${base}-${quote}`
        try {
          const payload = await fetchFxQuote(base, quote, token)
          return {
            pair: pairKey,
            price: payload?.price ?? null,
            change: payload?.change ?? null,
            changePercent: payload?.changePercent ?? null,
            timestamp: payload?.timestamp ?? Date.now(),
          }
        } catch (error) {
          console.error("[forex] failed to resolve pair", pairKey, error)
          return {
            pair: pairKey,
            price: null,
            change: null,
            changePercent: null,
            timestamp: Date.now(),
          }
        }
      }),
    )

    const enriched = enrichDerivedPairs(results)
    return Response.json({ rates: enriched })
  } catch (error) {
    console.error("[forex] fatal", error)
    return Response.json({ error: "Failed to fetch forex rates" }, { status: 500 })
  }
}
