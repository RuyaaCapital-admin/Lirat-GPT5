const KEY = process.env.FMP_KEY ?? process.env.FMP_API_KEY

if (!KEY) {
  // Surface a descriptive error early in development while avoiding runtime crashes in production builds.
  console.warn("[fmp] Missing FMP_KEY (or FMP_API_KEY) environment variable. Price board data will fail to load.")
}

export async function getFxPair(base: string, quote: string, smart = false): Promise<number> {
  const direct = await fx(base, quote)
  if (direct !== null) return direct
  if (!smart) throw new Error(`pair ${base}/${quote} not available`)

  if (base !== "USD" && quote !== "USD") {
    const bUsd = (await fx(base, "USD")) ?? invert(await fx("USD", base))
    const usdQ = (await fx("USD", quote)) ?? invert(await fx(quote, "USD"))
    if (bUsd !== null && usdQ !== null) return bUsd * usdQ
  }

  const inverse = await fx(quote, base)
  if (inverse !== null) return 1 / inverse

  throw new Error(`pair ${base}/${quote} not derivable`)
}

export async function getXAUUSD(): Promise<number> {
  ensureKey()
  const url = `https://financialmodelingprep.com/api/v3/quotes/commodity/XAUUSD?apikey=${KEY}`
  const payload = await fetch(url, { next: { revalidate: 30 } })
  if (!payload.ok) {
    throw new Error(`XAUUSD request failed: ${payload.status}`)
  }
  const json = await payload.json()
  const price = Array.isArray(json) ? json[0]?.price ?? json[0]?.bid ?? json[0]?.ask : json?.price ?? json?.bid ?? json?.ask
  if (!price) {
    throw new Error("XAUUSD missing")
  }
  return Number(price)
}

async function fx(base: string, quote: string): Promise<number | null> {
  ensureKey()
  const url = `https://financialmodelingprep.com/api/v3/fx/${base}/${quote}?apikey=${KEY}`
  try {
    const response = await fetch(url, { next: { revalidate: 30 } })
    if (!response.ok) {
      return null
    }
    const json = await response.json()
    const price = Array.isArray(json)
      ? json[0]?.price ?? json[0]?.bid ?? json[0]?.ask
      : json?.price ?? json?.bid ?? json?.ask
    return price !== undefined && price !== null ? Number(price) : null
  } catch (error) {
    console.error("[fmp] fx fetch error:", error)
    return null
  }
}

function invert(value?: number | null) {
  return value && Number.isFinite(value) ? 1 / value : null
}

function ensureKey() {
  if (!KEY) {
    throw new Error("Missing FMP_KEY (or FMP_API_KEY) environment variable")
  }
}
