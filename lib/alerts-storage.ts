"use client"

export type StoredAlert = {
  id: string
  symbol: string
  condition: "above" | "below"
  value: number
  status: "active" | "triggered" | "expired"
  createdAt: string
}

const STORAGE_KEY = "liirat.alerts"
const UPDATED_EVENT = "liirat-alerts-updated"

function parseAlerts(raw: string | null): StoredAlert[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => typeof item?.id === "string")
  } catch (error) {
    console.warn("[alerts-storage] failed to parse alerts:", error)
    return []
  }
}

export function loadAlerts(): StoredAlert[] {
  if (typeof window === "undefined") {
    return []
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return parseAlerts(raw)
}

export function saveAlerts(alerts: StoredAlert[]): void {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT))
}

export function appendAlert(alert: StoredAlert): void {
  if (typeof window === "undefined") {
    return
  }
  const alerts = loadAlerts()
  alerts.unshift(alert)
  saveAlerts(alerts)
}

export function onAlertsUpdated(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }
  window.addEventListener(UPDATED_EVENT, listener)
  return () => window.removeEventListener(UPDATED_EVENT, listener)
}
