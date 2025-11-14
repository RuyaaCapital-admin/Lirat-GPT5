import { NextResponse } from "next/server"

const USER_AGENT = "LIIRAT-Calendar/1.0"

type CalendarItem = {
  event: string
  country: string
  impact: string
  actual: string | null
  forecast: string | null
  previous: string | null
  timestamp: number
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0]
}

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return value.toString()
  if (typeof value === "string" && value.trim().length > 0) return value
  return null
}

function normalizeEvent(raw: any): CalendarItem | null {
  if (!raw?.event || !raw?.date) return null
  const timestamp = new Date(raw.date).getTime()
  if (Number.isNaN(timestamp)) return null

  return {
    event: String(raw.event),
    country: raw.country || "Global",
    impact: raw.impact || "Medium",
    actual: normalizeValue(raw.actual),
    forecast: normalizeValue(raw.estimate ?? raw.forecast),
    previous: normalizeValue(raw.previous),
    timestamp,
  }
}

function formatTimeLabel(locale: string, timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export async function POST(req: Request) {
  let body: { prompt?: string; locale?: string } = {}
  try {
    body = await req.json()
  } catch {
    // ignore parse errors
  }

  const prompt = body.prompt?.trim()
  const locale = body.locale === "ar" ? "ar" : "en"

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  const token = process.env.FMP_API_KEY
  if (!token) {
    return NextResponse.json({ error: "FMP_API_KEY missing" }, { status: 500 })
  }

  try {
    const now = new Date()
    const from = new Date(now.getTime() - 6 * 60 * 60 * 1000)
    const to = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${formatDate(from)}&to=${formatDate(
      to,
    )}&apikey=${token}`

    const response = await fetch(url, { cache: "no-store", headers: { "User-Agent": USER_AGENT } })
    if (!response.ok) {
      throw new Error(`Economic calendar error (${response.status})`)
    }

    const payload = await response.json()
    const normalized = (Array.isArray(payload) ? payload : []).map(normalizeEvent).filter(Boolean) as CalendarItem[]

    const upcoming = normalized.filter((item) => item.timestamp >= from.getTime()).sort((a, b) => a.timestamp - b.timestamp)

    const query = prompt.toLowerCase()
    const tokens = query.split(/\s+/).filter(Boolean)

    const scored = upcoming.map((item) => {
      let score = 0
      if (item.impact === "High") score += 3
      if (item.impact === "Medium") score += 1
      if (item.country && query.includes(item.country.toLowerCase())) score += 2
      if (tokens.some((token) => item.event.toLowerCase().includes(token))) score += 2
      if (query.includes("today")) {
        const isToday = new Date(item.timestamp).getDate() === now.getDate()
        score += isToday ? 1.5 : 0
      }
      return { item, score }
    })

    const ranked = scored
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.timestamp - b.item.timestamp)
      .slice(0, 4)

    const fallback = upcoming.slice(0, 4).map((item) => ({ item, score: 0 }))
    const selections = ranked.length ? ranked : fallback

    const items = selections.map(({ item }) => ({
      title: item.event,
      country: item.country,
      time: formatTimeLabel(locale, item.timestamp),
      impact: item.impact,
      actual: item.actual,
      forecast: item.forecast,
      previous: item.previous,
    }))

    const summary =
      locale === "ar"
        ? ranked.length
          ? "أهم ما يجب مراقبته في الأيام المقبلة"
          : "لا توجد تطابقات مباشرة، هذه أبرز الأحداث القادمة"
        : ranked.length
          ? "Top events to watch over the next sessions"
          : "No direct matches—showing the next impactful events"

    return NextResponse.json({ summary, items })
  } catch (error) {
    console.error("[calendar/insights] failed", error)
    return NextResponse.json(
      { error: "Unable to build insights from the calendar right now." },
      { status: 500 },
    )
  }
}
