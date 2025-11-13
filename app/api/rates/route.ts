import { NextResponse } from "next/server"
import { ratesManager } from "@/lib/fmpClient"

export const runtime = "nodejs"

export async function GET() {
  try {
    await ratesManager.ensureSnapshot()
  } catch (error) {
    console.error("[rates] live refresh failed:", error)
  }

  const snapshot = ratesManager.getSerializableSnapshot()

  if (!snapshot) {
    return NextResponse.json({ error: "rates_unavailable" }, { status: 503 })
  }

  return NextResponse.json(snapshot, {
    status: snapshot.meta.stale ? 206 : 200,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
