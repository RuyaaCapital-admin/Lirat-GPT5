export const isRTL = (process.env.SITE_LANG ?? process.env.NEXT_PUBLIC_SITE_LANG ?? "ar") === "ar"

export function num(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat(isRTL ? "ar" : "en", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(value)
}

export function tsPretty(iso: string): string {
  if (!iso) return "—"
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return "—"
  return new Intl.DateTimeFormat(isRTL ? "ar" : "en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt)
}
