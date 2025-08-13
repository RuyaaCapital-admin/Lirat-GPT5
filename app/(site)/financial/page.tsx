"use client"

import { useEffect, useState } from "react"
import { DataTable, type Row } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"
import { Clock, Building, Newspaper, TrendingUp } from "lucide-react"

export default function FinancialPage() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const { locale } = useLocale()

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/eodhd/financial", { cache: "no-store" })
      if (response.ok) {
        const result = await response.json()
        setData(result.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch financial data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getSentimentBadge = (sentiment: string) => {
    const sentimentLower = sentiment?.toLowerCase()
    switch (sentimentLower) {
      case "positive":
      case "bullish":
        return (
          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
            Positive
          </Badge>
        )
      case "negative":
      case "bearish":
        return (
          <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
            Negative
          </Badge>
        )
      case "neutral":
        return (
          <Badge variant="outline" className="text-xs">
            Neutral
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {sentiment || "N/A"}
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
      accessorKey: "ts",
      header: () => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{getTranslation(locale, "time")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => <div className="font-mono text-sm">{formatTime(row.getValue("ts"))}</div>,
    },
    {
      accessorKey: "source",
      header: () => (
        <div className="flex items-center space-x-1">
          <Building className="h-4 w-4" />
          <span>{getTranslation(locale, "source")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => <div className="font-medium">{row.getValue("source") || "N/A"}</div>,
    },
    {
      accessorKey: "headline",
      header: () => (
        <div className="flex items-center space-x-1">
          <Newspaper className="h-4 w-4" />
          <span>{getTranslation(locale, "headline")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => (
        <div className="max-w-[400px]">
          <div className="font-medium line-clamp-3">{row.getValue("headline") || "N/A"}</div>
        </div>
      ),
    },
    {
      accessorKey: "symbol",
      header: getTranslation(locale, "symbol"),
      cell: ({ row }: { row: any }) => {
        const symbol = row.getValue("symbol")
        return symbol ? (
          <Badge variant="outline" className="font-mono text-xs">
            {symbol}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        )
      },
    },
    {
      accessorKey: "sentiment",
      header: () => (
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-4 w-4" />
          <span>{getTranslation(locale, "sentiment")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => getSentimentBadge(row.getValue("sentiment")),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "financial")}</h1>
        <p className="text-muted-foreground">Latest financial news and market updates from trusted sources worldwide</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        title="Financial News Feed"
        searchPlaceholder="Search headlines, sources, symbols..."
        loading={loading}
        onRefresh={fetchData}
      />
    </div>
  )
}
