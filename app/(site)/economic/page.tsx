"use client"

import { useEffect, useState } from "react"
import { DataTable, type Row } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { CountryFlag } from "@/components/country-flag"
import { AlertButton } from "@/components/alert-button"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"
import { Clock, Globe, TrendingUp } from "lucide-react"

export default function EconomicPage() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const { locale } = useLocale()

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/eodhd/economic", { cache: "no-store" })
      if (response.ok) {
        const result = await response.json()
        setData(result.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch economic data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getImpactBadge = (impact: string) => {
    const impactLower = impact?.toLowerCase()
    switch (impactLower) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
            Low
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {impact || "N/A"}
          </Badge>
        )
    }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "N/A"
    try {
      const date = new Date(timeStr)
      return date.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return timeStr
    }
  }

  const columns = [
    {
      accessorKey: "time",
      header: () => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{getTranslation(locale, "time")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => <div className="font-mono text-sm">{formatTime(row.getValue("time"))}</div>,
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
        return (
          <div className="flex items-center space-x-2">
            <CountryFlag countryCode={country} countryName={country} size="sm" />
            <span className="font-medium">{country}</span>
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
        return <div className="font-mono text-sm">{actual !== null && actual !== undefined ? actual : "N/A"}</div>
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
      header: "Alert",
      cell: ({ row }: { row: any }) => (
        <AlertButton
          eventTitle={row.getValue("event") || "Economic Event"}
          eventTime={row.getValue("time")}
          type="economic"
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "economic")}</h1>
        <p className="text-muted-foreground">Real-time economic events and indicators from major economies worldwide</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        title="Economic Calendar"
        searchPlaceholder="Search events, countries..."
        loading={loading}
        onRefresh={fetchData}
      />
    </div>
  )
}
