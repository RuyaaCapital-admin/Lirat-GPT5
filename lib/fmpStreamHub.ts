import { EventEmitter } from "node:events"

type StreamListener = (payload: StreamPayload) => void

export type StreamPayload = {
  symbol: string
  price: number
  timestamp: number
  volume?: number | null
}

const BACKOFF_BASE_MS = 1_000
const MAX_BACKOFF_MS = 25_000

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
  return symbol.replace(/[^0-9A-Za-z:_./-]/g, "").toUpperCase()
}

class FmpStreamHub extends EventEmitter {
  private readonly apiKey: string | undefined

  private readonly streamUrl: string

  private ws: WebSocket | null = null

  public readonly available: boolean

  private reconnectDelay = BACKOFF_BASE_MS

  private reconnectTimer: NodeJS.Timeout | null = null

  private connected = false

  private symbolListeners = new Map<string, Set<StreamListener>>()

  private subscribedSymbols = new Set<string>()

  constructor() {
    super()
    this.apiKey = process.env.FMP_API_KEY ?? process.env.FMP_KEY ?? process.env.FMP_SECRET
    this.available = Boolean(this.apiKey)
    this.streamUrl = process.env.FMP_STREAM_URL ?? "wss://streaming.financialmodelingprep.com"

    if (!this.available) {
      console.warn(
        "[fmpStreamHub] Missing FMP_API_KEY. Real-time chart streaming will be disabled until a key is configured.",
      )
      return
    }

    this.connect()
  }

  subscribe(rawSymbol: string, listener: StreamListener) {
    const symbol = normalizeSymbol(rawSymbol)
    if (!symbol) {
      throw new Error("Invalid symbol")
    }

    let listeners = this.symbolListeners.get(symbol)
    if (!listeners) {
      listeners = new Set()
      this.symbolListeners.set(symbol, listeners)
      if (this.connected) {
        this.sendSubscribe(symbol)
      }
    }
    listeners.add(listener)

    if (!this.connected && this.apiKey) {
      this.connect()
    }

    return () => {
      const current = this.symbolListeners.get(symbol)
      if (!current) return
      current.delete(listener)
      if (current.size === 0) {
        this.symbolListeners.delete(symbol)
        this.sendUnsubscribe(symbol)
      }
    }
  }

  private connect() {
    if (!this.apiKey) return

    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore
      }
      this.ws = null
    }

    const url = `${this.streamUrl}?apikey=${this.apiKey}`
    const ws = new WebSocket(url)
    this.ws = ws

    ws.addEventListener("open", () => {
      this.connected = true
      this.reconnectDelay = BACKOFF_BASE_MS
      const symbols = Array.from(this.symbolListeners.keys())
      if (symbols.length > 0) {
        this.sendSubscribe(...symbols)
      }
      this.emit("open")
    })

    ws.addEventListener("message", (event) => {
      this.handleMessage(String(event.data))
    })

    ws.addEventListener("error", (error) => {
      console.error("[fmpStreamHub] WebSocket error:", error)
      this.connected = false
      this.emit("error", error)
      try {
        ws.close()
      } catch {
        // ignore
      }
    })

    ws.addEventListener("close", () => {
      this.connected = false
      this.emit("close")
      this.scheduleReconnect()
    })
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, MAX_BACKOFF_MS)
      this.connect()
    }, this.reconnectDelay)
  }

  private sendSubscribe(...symbols: string[]) {
    const filtered = symbols.map(normalizeSymbol).filter(Boolean)
    if (!this.ws || this.ws.readyState !== this.ws.OPEN || filtered.length === 0) return

    const symbolsToSend = filtered.filter((symbol) => !this.subscribedSymbols.has(symbol))
    if (symbolsToSend.length === 0) return

    try {
      const payload = JSON.stringify({ event: "subscribe", symbols: symbolsToSend.join(",") })
      this.ws.send(payload)
      symbolsToSend.forEach((symbol) => this.subscribedSymbols.add(symbol))
    } catch (error) {
      console.error("[fmpStreamHub] Failed to send subscribe payload:", error)
    }
  }

  private sendUnsubscribe(symbol: string) {
    const normalized = normalizeSymbol(symbol)
    if (!normalized || !this.ws || this.ws.readyState !== this.ws.OPEN) return

    if (!this.subscribedSymbols.has(normalized)) return

    try {
      const payload = JSON.stringify({ event: "unsubscribe", symbols: normalized })
      this.ws.send(payload)
    } catch (error) {
      // Some tiers may not support unsubscribe; ignore errors silently.
      console.warn("[fmpStreamHub] Unsubscribe failed (ignored):", error)
    } finally {
      this.subscribedSymbols.delete(normalized)
    }
  }

  private handleMessage(raw: string) {
    if (!raw) return

    try {
      const payload = JSON.parse(raw)
      if (Array.isArray(payload)) {
        payload.forEach((entry) => this.handleSingle(entry))
      } else {
        this.handleSingle(payload)
      }
    } catch (error) {
      console.error("[fmpStreamHub] Failed to parse stream payload:", error, raw)
    }
  }

  private handleSingle(payload: any) {
    const rawSymbol = payload?.symbol ?? payload?.s ?? payload?.ticker ?? ""
    const symbol = normalizeSymbol(rawSymbol)
    if (!symbol || !this.symbolListeners.has(symbol)) {
      return
    }

    const price =
      toNumber(payload?.price) ??
      toNumber(payload?.p) ??
      toNumber(payload?.last) ??
      toNumber(payload?.ask) ??
      toNumber(payload?.bid)

    if (price === null) {
      return
    }

    let timestamp = toNumber(payload?.timestamp) ?? toNumber(payload?.t) ?? Date.now()
    if (timestamp && timestamp < 1_000_000_000_000) {
      timestamp *= 1000
    }

    const volume = toNumber(payload?.volume ?? payload?.v)

    const listeners = this.symbolListeners.get(symbol)
    if (!listeners || listeners.size === 0) {
      return
    }

    const message: StreamPayload = {
      symbol,
      price,
      timestamp: timestamp ?? Date.now(),
      volume,
    }

    listeners.forEach((listener) => {
      try {
        listener(message)
      } catch (error) {
        console.error("[fmpStreamHub] Listener error:", error)
      }
    })
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __fmpStreamHub: FmpStreamHub | undefined
}

export const fmpStreamHub: FmpStreamHub =
  globalThis.__fmpStreamHub ?? (globalThis.__fmpStreamHub = new FmpStreamHub())
