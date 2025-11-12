"use client"

import { useEffect, useState } from "react"
import { DataTable, type Row } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { CountryFlag } from "@/components/country-flag"
import { AlertButton } from "@/components/alert-button"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"
import { getUserTimezoneAbbr } from "@/lib/timezone"
import { Clock, Globe, TrendingUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EconomicPage() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { locale } = useLocale()
  const [timezone, setTimezone] = useState("")

  useEffect(() => {
    setTimezone(getUserTimezoneAbbr())
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("[v0] Fetching economic calendar data...")
      const response = await fetch("/api/fmp/economic-calendar", { cache: "no-store" })
      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Economic calendar data received:", result.count, "items")
        setData(result.items || [])
        if (result.error) {
          setError(result.error)
        }
      } else {
        console.error("[v0] Economic calendar fetch failed with status:", response.status)
        setData([])
        setError("Failed to fetch data")
      }
    } catch (error) {
      console.error("[v0] Economic calendar error:", error)
      setData([])
      setError("Error fetching economic calendar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getImpactBadge = (impact: string) => {
    const impactLower = impact?.toLowerCase()
    const impactText =
      impactLower === "high"
        ? getTranslation(locale, "high")
        : impactLower === "medium"
          ? getTranslation(locale, "medium")
          : impactLower === "low"
            ? getTranslation(locale, "low")
            : impact || "N/A"

    switch (impactLower) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs font-semibold">
            {impactText}
          </Badge>
        )
      case "medium":
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-semibold"
          >
            {impactText}
          </Badge>
        )
      case "low":
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 font-semibold"
          >
            {impactText}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {impactText}
          </Badge>
        )
    }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "N/A"
    try {
      const date = new Date(dateStr)
      const formatted = date.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      return `${formatted} ${timezone}`
    } catch (error) {
      return dateStr
    }
  }

  const columns = [
    {
      accessorKey: "date",
      header: () => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{getTranslation(locale, "time")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const date = row.getValue("date")
        return <div className="font-mono text-sm whitespace-nowrap">{formatTime(date)}</div>
      },
    },
    {
      accessorKey: "country",
      header: () => (
        <div className="flex items-center space-x-1">
          <Globe className="h-4 w-4" />
          <span>{getTranslation(locale, "country")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const country = row.getValue("country") || "N/A"
        const countryName = typeof country === "string" ? country : String(country)
        return (
          <div className="flex items-center space-x-2">
            <CountryFlag countryCode={row.original.countryCode} countryName={countryName} size="sm" />
            <span className="font-medium text-sm line-clamp-1">{countryName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "event",
      header: getTranslation(locale, "event"),
      cell: ({ row }: { row: any }) => (
        <div className="max-w-[300px]">
          <div className="font-medium line-clamp-2 break-words overflow-hidden text-ellipsis">
            {row.getValue("event") || "N/A"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "actual",
      header: getTranslation(locale, "actual"),
      cell: ({ row }: { row: any }) => {
        const actual = row.getValue("actual")
        return (
          <div className="font-mono text-sm font-semibold">
            {actual !== null && actual !== undefined ? actual : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "forecast",
      header: getTranslation(locale, "forecast"),
      cell: ({ row }: { row: any }) => {
        const forecast = row.getValue("forecast")
        return (
          <div className="font-mono text-sm text-muted-foreground">
            {forecast !== null && forecast !== undefined ? forecast : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "previous",
      header: getTranslation(locale, "previous"),
      cell: ({ row }: { row: any }) => {
        const previous = row.getValue("previous")
        return (
          <div className="font-mono text-sm text-muted-foreground">
            {previous !== null && previous !== undefined ? previous : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "changePercentage",
      header: getTranslation(locale, "change"),
      cell: ({ row }: { row: any }) => {
        const change = row.getValue("changePercentage")
        const isPositive = typeof change === "number" && change > 0
        return (
          <div className={`font-mono text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {change !== null && change !== undefined ? `${isPositive ? "+" : ""}${change.toFixed(2)}%` : "N/A"}
          </div>
        )
      },
    },
    {
      accessorKey: "impact",
      header: () => (
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-4 w-4" />
          <span>{getTranslation(locale, "impact")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => getImpactBadge(row.getValue("impact")),
    },
    {
      id: "actions",
      header: getTranslation(locale, "addAlert"),
      cell: ({ row }: { row: any }) => (
        <AlertButton
          eventTitle={row.getValue("event") || "Economic Event"}
          eventTime={row.original.date}
          type="economic"
        />
      ),
    },
  ]

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "economic")}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "أحداث اقتصادية حقيقية ومؤشرات من أكبر الاقتصادات العالمية"
            : "Real-time economic events and indicators from major economies worldwide"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {data.length === 0 && !loading && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">
            {locale === "ar" ? "لا توجد أحداث متاحة الآن" : "No events available at this time"}
          </p>
          <Button onClick={fetchData} variant="outline" size="sm" className="mx-auto bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        title={getTranslation(locale, "economicCalendar")}
        searchPlaceholder={locale === "ar" ? "ابحث عن الأحداث والدول..." : "Search events, countries..."}
        loading={loading}
        onRefresh={fetchData}
      />
    </div>
  )
}
