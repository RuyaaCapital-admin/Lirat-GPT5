import { NextResponse } from "next/server"
import { fmpStreamHub, type StreamPayload } from "@/lib/fmpStreamHub"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const push = (payload: StreamPayload) => {
        if (payload.symbol !== symbol) return
        controller.enqueue(streamJson(payload))
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
        controller.enqueue(streamComment("keepalive"))
      }, 15_000)
    },
    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive)
        keepAlive = null
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
