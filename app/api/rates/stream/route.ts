import { NextResponse } from "next/server"
import { ratesManager } from "@/lib/fmpClient"

export const runtime = "nodejs"

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
  let onUpdate: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const sendSnapshot = () => {
        const snapshot = ratesManager.getSerializableSnapshot()
        if (snapshot) {
          controller.enqueue(streamJson(snapshot))
        }
      }

      onUpdate = () => {
        sendSnapshot()
      }

      ratesManager.on("update", onUpdate)

      controller.enqueue(streamComment("connected"))
      sendSnapshot()

      keepAlive = setInterval(() => {
        controller.enqueue(streamComment("keepalive"))
      }, 15_000)
    },
    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive)
        keepAlive = null
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
