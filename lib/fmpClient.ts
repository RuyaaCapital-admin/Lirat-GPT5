import { EventEmitter } from "node:events"

type FxPair = {
  base: string
  quote: string
  optional?: boolean
  decimals: number
}

export type RatesPayload = {
  ts: string
  gold: {
    k14: number | null
    k18: number | null
    k21: number | null
    k22: number | null
    k24: number | null
    tamAltin: number | null
    ounceUSD: number | null
  }
  fx: {
    USD_TRY: number | null
    EUR_TRY: number | null
    GBP_TRY: number | null
    LYD_TRY: number | null
    EGP_TRY: number | null
    IQD_TRY: number | null
    SYP: {
      USD_SYP: number | null
    }
  }
}

export type RatesSnapshot = {
  payload: RatesPayload
  fetchedAt: number
  source: "rest" | "ws"
  lastWsAt?: number
}

export type RatesMeta = {
  stale: boolean
  staleForMs: number
  fetchedAt: string
  source: RatesSnapshot["source"] | "cache"
  lastWsAt?: string
  live: boolean
}

export type RatesApiResponse = RatesPayload & {
  meta: RatesMeta
}

const FX_PAIRS: FxPair[] = [
  { base: "USD", quote: "TRY", decimals: 3 },
  { base: "EUR", quote: "TRY", decimals: 3 },
  { base: "GBP", quote: "TRY", decimals: 3 },
  { base: "LYD", quote: "TRY", decimals: 3, optional: true },
  { base: "EGP", quote: "TRY", decimals: 3, optional: true },
  { base: "IQD", quote: "TRY", decimals: 5, optional: true },
  { base: "USD", quote: "SYP", decimals: 0, optional: true },
]

const STREAM_SYMBOL_MAP: Record<
  string,
  {
    path: "fx" | "gold" | "syp"
    key: keyof RatesPayload["fx"] | keyof RatesPayload["gold"] | "USD_SYP"
    invert?: boolean
  }
> = {
  USDTRY: { path: "fx", key: "USD_TRY" },
  EURTRY: { path: "fx", key: "EUR_TRY" },
  GBPTRY: { path: "fx", key: "GBP_TRY" },
  LYDTRY: { path: "fx", key: "LYD_TRY" },
  EGPTRY: { path: "fx", key: "EGP_TRY" },
  IQDTRY: { path: "fx", key: "IQD_TRY" },
  USDSYP: { path: "syp", key: "USD_SYP", invert: true },
  XAUUSD: { path: "gold", key: "ounceUSD" },
}

const DEFAULT_PAYLOAD: RatesPayload = {
  ts: new Date(0).toISOString(),
  gold: {
    k14: null,
    k18: null,
    k21: null,
    k22: null,
    k24: null,
    tamAltin: null,
    ounceUSD: null,
  },
  fx: {
    USD_TRY: null,
    EUR_TRY: null,
    GBP_TRY: null,
    LYD_TRY: null,
    EGP_TRY: null,
    IQD_TRY: null,
    SYP: {
      USD_SYP: null,
    },
  },
}

const BACKOFF_BASE_MS = 750
const REST_CACHE_TTL_MS = 45_000
const WS_STALE_THRESHOLD_MS = 30_000

function log(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[fmpClient]", ...args)
  }
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

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, attempts = 3, backoff = BACKOFF_BASE_MS): Promise<Response> {
  let error: unknown = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "LiiratBoard/1.0 (+https://liirat.com)",
        },
      })
      if (!response.ok) {
        error = new Error(`Request failed (${response.status})`)
        await sleep(backoff * (attempt + 1))
        continue
      }
      return response
    } catch (err) {
      error = err
      await sleep(backoff * (attempt + 1))
    }
  }

  throw error instanceof Error ? error : new Error("Request failed")
}

function buildFxEndpoint(apiKey: string, base: string, quote: string) {
  return `https://financialmodelingprep.com/api/v3/fx/real-time-rate/${base}/${quote}?apikey=${apiKey}`
}

function buildQuoteEndpoint(apiKey: string, symbol: string) {
  return `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
}

function deriveGoldFromGram(gram24: number | null) {
  if (gram24 === null) {
    return {
      k14: null,
      k18: null,
      k21: null,
      k22: null,
      k24: null,
      tamAltin: null,
    }
  }

  return {
    k24: Math.round(gram24),
    k22: Math.round(gram24 * 0.916),
    k21: Math.round(gram24 * 0.875),
    k18: Math.round(gram24 * 0.75),
    k14: Math.round(gram24 * 0.583),
    tamAltin: Math.round(gram24 * 7.016),
  }
}

function normalizeSymbol(symbol: string) {
  return symbol.replace("/", "").trim().toUpperCase()
}

class FmpRatesManager extends EventEmitter {
  private readonly apiKey: string | undefined

  private readonly streamUrl: string

  private snapshot: RatesSnapshot | null = null

  private restLock: Promise<RatesPayload> | null = null

  private ws: WebSocket | null = null

  private wsConnected = false

  private reconnectDelay = BACKOFF_BASE_MS

  private reconnectHandle: NodeJS.Timeout | null = null

  private lastWsAt = 0

  constructor() {
    super()
    this.apiKey = process.env.FMP_API_KEY ?? process.env.FMP_KEY ?? process.env.FMP_SECRET
    this.streamUrl = process.env.FMP_STREAM_URL ?? "wss://streaming.financialmodelingprep.com"

    if (!this.apiKey) {
      console.warn(
        "[fmpClient] Missing FMP_API_KEY. Live board data will fall back to cached placeholders until the key is configured.",
      )
    }

    if (this.apiKey) {
      this.ensureSnapshot().catch((error) => {
        console.error("[fmpClient] Initial snapshot failed:", error)
      })
      this.connectWebSocket()
    }
  }

  async ensureSnapshot(force = false): Promise<RatesPayload> {
    if (!this.apiKey) {
      throw new Error("FMP_API_KEY is not configured")
    }

    if (!force && this.snapshot && Date.now() - this.snapshot.fetchedAt < REST_CACHE_TTL_MS) {
      return this.snapshot.payload
    }

    if (!this.restLock) {
      this.restLock = this.fetchSnapshotFromRest()
        .then((payload) => {
          this.snapshot = {
            payload,
            fetchedAt: Date.now(),
            source: "rest",
            lastWsAt: this.lastWsAt || undefined,
          }
          this.emit("update", this.snapshot)
          return payload
        })
        .catch((error) => {
          if (!this.snapshot) {
            throw error
          }
          console.error("[fmpClient] Falling back to cached rates after REST failure:", error)
          return this.snapshot.payload
        })
        .finally(() => {
          this.restLock = null
        })
    }

    return this.restLock
  }

  getSnapshot(): RatesSnapshot | null {
    if (!this.snapshot) return null
    return {
      ...this.snapshot,
      lastWsAt: this.lastWsAt || this.snapshot.lastWsAt,
    }
  }

  getSerializableSnapshot(): RatesApiResponse | null {
    const snapshot = this.getSnapshot()
    if (!snapshot) return null

    const staleForMs = Date.now() - snapshot.fetchedAt
    const stale = staleForMs > REST_CACHE_TTL_MS
    const live = this.wsConnected && Date.now() - this.lastWsAt < WS_STALE_THRESHOLD_MS

    return {
      ...snapshot.payload,
      meta: {
        stale,
        staleForMs,
        fetchedAt: new Date(snapshot.fetchedAt).toISOString(),
        source: stale ? "cache" : snapshot.source,
        lastWsAt: snapshot.lastWsAt ? new Date(snapshot.lastWsAt).toISOString() : undefined,
        live,
      },
    }
  }

  private async fetchSnapshotFromRest(): Promise<RatesPayload> {
    if (!this.apiKey) {
      throw new Error("FMP_API_KEY is not configured")
    }

    const results = await Promise.all(
      FX_PAIRS.map(async (pair) => {
        try {
          const endpoint = buildFxEndpoint(this.apiKey!, pair.base, pair.quote)
          const response = await fetchWithRetry(endpoint)
          const json = await response.json()
          const price =
            toNumber(json?.price) ?? toNumber(json?.rate) ?? toNumber(json?.bid) ?? toNumber(json?.ask) ?? null
          if (price === null) {
            if (!pair.optional) {
              throw new Error(`Missing price for ${pair.base}-${pair.quote}`)
            }
            return { pair, value: null }
          }
          return { pair, value: price }
        } catch (error) {
          if (!pair.optional) {
            throw error
          }
          console.warn(`[fmpClient] Optional pair ${pair.base}-${pair.quote} failed:`, error)
          return { pair, value: null }
        }
      }),
    )

    const fx: RatesPayload["fx"] = structuredClone(DEFAULT_PAYLOAD.fx)

    for (const { pair, value } of results) {
      const key = `${pair.base}_${pair.quote}` as keyof RatesPayload["fx"]
      if (pair.base === "USD" && pair.quote === "SYP") {
        fx.SYP.USD_SYP = value !== null ? Math.round(value) : null
      } else if (key in fx) {
        fx[key] = value !== null ? Number(value.toFixed(pair.decimals)) : null
        } else {
          const legacyKey = `${pair.base}${pair.quote}`.toUpperCase()
          if (legacyKey in STREAM_SYMBOL_MAP) {
            const mapping = STREAM_SYMBOL_MAP[legacyKey]
            if (mapping.path === "syp") {
              fx.SYP.USD_SYP = value !== null ? Math.round(mapping.invert ? (value !== 0 ? 1 / value : 0) : value) : null
            } else if (mapping.path === "fx" && typeof mapping.key === "string" && mapping.key in fx) {
              const keyName = mapping.key as keyof RatesPayload["fx"]
              fx[keyName] = value !== null ? Number(value.toFixed(pair.decimals)) : null
            }
          }
        }
    }

    const usdtry = fx.USD_TRY
    let ounceUSD: number | null = null
    let gram24: number | null = null

    try {
      const response = await fetchWithRetry(buildQuoteEndpoint(this.apiKey, "XAUUSD"))
      const json = await response.json()
      const maybeArray = Array.isArray(json) ? json[0] : json
      const price = toNumber(maybeArray?.price) ?? toNumber(maybeArray?.bid) ?? toNumber(maybeArray?.ask)
      ounceUSD = price !== null ? Number(price.toFixed(2)) : null
      if (ounceUSD !== null && usdtry !== null) {
        gram24 = Number(((ounceUSD * usdtry) / 31.1035).toFixed(0))
      }
    } catch (error) {
      console.error("[fmpClient] Failed to fetch gold reference (XAUUSD):", error)
    }

    const goldDerived = deriveGoldFromGram(gram24)

    const payload: RatesPayload = {
      ts: new Date().toISOString(),
      gold: {
        ...goldDerived,
        ounceUSD,
      },
      fx,
    }

    return payload
  }

  private connectWebSocket() {
    if (!this.apiKey || typeof WebSocket === "undefined") {
      return
    }

    if (this.ws) {
      try {
        this.ws.close()
      } catch (error) {
        log("Error closing existing WebSocket:", error)
      }
      this.ws = null
    }

    const url = `${this.streamUrl}?apikey=${this.apiKey}`
    const ws = new WebSocket(url)
    this.ws = ws

    ws.addEventListener("open", () => {
      this.wsConnected = true
      this.reconnectDelay = BACKOFF_BASE_MS
      const symbols = Object.keys(STREAM_SYMBOL_MAP)
      const payload = {
        event: "subscribe",
        symbols,
      }
      try {
        ws.send(JSON.stringify(payload))
        log("Subscribed to FMP stream:", symbols.join(", "))
      } catch (error) {
        console.error("[fmpClient] Failed to send subscribe payload:", error)
      }
    })

    ws.addEventListener("message", (event) => {
      this.handleStreamMessage(String(event.data))
    })

    ws.addEventListener("close", () => {
      this.wsConnected = false
      this.scheduleReconnect()
    })

    ws.addEventListener("error", (error) => {
      console.error("[fmpClient] WebSocket error:", error)
      this.wsConnected = false
      try {
        ws.close()
      } catch {
        // ignore
      }
    })
  }

  private handleStreamMessage(raw: string) {
    if (!raw) return
    try {
      const message = JSON.parse(raw)
      if (!message) return

      const symbolRaw = normalizeSymbol(message.symbol ?? message.s ?? message.ticker ?? "")
      const price = toNumber(message.price ?? message.p ?? message.last ?? message.value)

      if (!symbolRaw || price === null) {
        return
      }

      const mapping = STREAM_SYMBOL_MAP[symbolRaw]
      if (!mapping) {
        return
      }

      const snapshot = this.snapshot ?? {
        payload: structuredClone(DEFAULT_PAYLOAD),
        fetchedAt: Date.now(),
        source: "ws" as const,
      }

        const payload = structuredClone(snapshot.payload)

        if (mapping.path === "syp") {
          payload.fx.SYP.USD_SYP = mapping.invert ? (price !== 0 ? Math.round(1 / price) : null) : Math.round(price)
        } else if (mapping.path === "fx") {
          const key = mapping.key as keyof typeof payload.fx
          const decimals = FX_PAIRS.find(
            (pair) => `${pair.base}_${pair.quote}` === (mapping.key as string),
          )?.decimals
          payload.fx[key] = decimals !== undefined ? Number(price.toFixed(decimals)) : Number(price)
        } else if (mapping.path === "gold") {
          payload.gold.ounceUSD = Number(price.toFixed(2))
        }

      if (payload.gold.ounceUSD && payload.fx.USD_TRY) {
        const gram24 = Number(((payload.gold.ounceUSD * payload.fx.USD_TRY) / 31.1035).toFixed(0))
        const derived = deriveGoldFromGram(gram24)
        payload.gold = {
          ...payload.gold,
          ...derived,
        }
      }

      this.lastWsAt = Date.now()
      this.snapshot = {
        payload: {
          ...payload,
          ts: new Date().toISOString(),
        },
        fetchedAt: this.snapshot?.fetchedAt ?? Date.now(),
        source: "ws",
        lastWsAt: this.lastWsAt,
      }

      this.emit("update", this.snapshot)
    } catch (error) {
      console.error("[fmpClient] Failed to process stream message:", error, raw)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectHandle) {
      clearTimeout(this.reconnectHandle)
    }
    this.reconnectHandle = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 25_000)
      this.connectWebSocket()
    }, this.reconnectDelay)
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __fmpRatesManager: FmpRatesManager | undefined
}

export const ratesManager: FmpRatesManager =
  globalThis.__fmpRatesManager ?? (globalThis.__fmpRatesManager = new FmpRatesManager())

