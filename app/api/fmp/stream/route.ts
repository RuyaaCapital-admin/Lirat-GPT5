import { NextResponse } from "next/server"
import { fmpStreamHub, type StreamPayload } from "@/lib/fmpStreamHub"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // Maximum 60 seconds for Vercel timeout safety

const encoder = new TextEncoder()

function streamJson(data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

function streamComment(comment: string) {
  return encoder.encode(`:${comment}\n\n`)
}

function sanitizeSymbol(symbol: string | null) {
  if (!symbol) return ""
  return symbol.toUpperCase().replace(/[^0-9A-Z._:-]/g, "")
}

export async function GET(request: Request) {
  if (!fmpStreamHub.available) {
    return NextResponse.json({ error: "stream_unavailable" }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const symbol = sanitizeSymbol(searchParams.get("symbol"))

  if (!symbol) {
    return NextResponse.json({ error: "symbol query parameter required" }, { status: 400 })
  }

  let keepAlive: NodeJS.Timeout | null = null
  let timeout: NodeJS.Timeout | null = null
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const push = (payload: StreamPayload) => {
        if (payload.symbol !== symbol) return
        try {
          controller.enqueue(streamJson(payload))
        } catch (error) {
          console.error('[FMP Stream] Enqueue error:', error)
        }
      }

      try {
        unsubscribe = fmpStreamHub.subscribe(symbol, push)
      } catch (error) {
        console.error('[FMP Stream] Subscription error:', error)
        controller.error(error instanceof Error ? error : new Error(String(error)))
        return
      }

      controller.enqueue(streamComment(`subscribed ${symbol}`))

      keepAlive = setInterval(() => {
        try {
          controller.enqueue(streamComment("keepalive"))
        } catch (error) {
          console.error('[FMP Stream] Keepalive error:', error)
        }
      }, 15_000)

      // Close stream after 50 seconds to prevent Vercel timeout
      timeout = setTimeout(() => {
        try {
          controller.enqueue(streamComment("timeout: closing connection"))
          controller.close()
        } catch (error) {
          // Stream may already be closed
        }
      }, 50_000)
    },
    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive)
        keepAlive = null
      }
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Transfer-Encoding": "chunked",
    },
  })
}
