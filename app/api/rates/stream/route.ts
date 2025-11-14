import { NextResponse } from "next/server"
import { ratesManager } from "@/lib/fmpClient"

export const runtime = "nodejs"
export const maxDuration = 60 // Maximum 60 seconds for Vercel timeout safety

const encoder = new TextEncoder()

function streamJson(data: unknown) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

function streamComment(comment: string) {
  return encoder.encode(`:${comment}\n\n`)
}

export async function GET() {
  try {
    await ratesManager.ensureSnapshot()
  } catch (error) {
    console.error("[rates/stream] preflight snapshot failed:", error)
  }

  let keepAlive: NodeJS.Timeout | null = null
  let timeout: NodeJS.Timeout | null = null
  let onUpdate: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const sendSnapshot = () => {
        try {
          const snapshot = ratesManager.getSerializableSnapshot()
          if (snapshot) {
            controller.enqueue(streamJson(snapshot))
          }
        } catch (error) {
          console.error("[rates/stream] Send snapshot error:", error)
        }
      }

      onUpdate = () => {
        sendSnapshot()
      }

      ratesManager.on("update", onUpdate)

      try {
        controller.enqueue(streamComment("connected"))
        sendSnapshot()
      } catch (error) {
        console.error("[rates/stream] Initial send error:", error)
      }

      keepAlive = setInterval(() => {
        try {
          controller.enqueue(streamComment("keepalive"))
        } catch (error) {
          console.error("[rates/stream] Keepalive error:", error)
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
      if (onUpdate) {
        ratesManager.off("update", onUpdate)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
    },
  })
}
