"use client"

import { useEffect, useState } from "react"
import { DataTable, type Row } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { AlertButton } from "@/components/alert-button"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"
import { Clock, Newspaper, TrendingUp } from "lucide-react"

export default function FinancialPage() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const { locale } = useLocale()

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/fmp/news", { cache: "no-store" })
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

  const getSentimentBadge = (sentiment: any) => {
    // Handle sentiment object with polarity, neg, neu, pos structure
    if (sentiment && typeof sentiment === "object") {
      // If it has polarity property, use that
      if (sentiment.polarity !== undefined) {
        const polarity = String(sentiment.polarity).toLowerCase()
        if (polarity === "positive" || polarity === "1" || sentiment.polarity > 0) {
          return (
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
              Positive
            </Badge>
          )
        } else if (polarity === "negative" || polarity === "-1" || sentiment.polarity < 0) {
          return (
            <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
              Negative
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline" className="text-xs">
              Neutral
            </Badge>
          )
        }
      }

      // If it has pos, neg, neu scores, determine sentiment based on highest score
      if (sentiment.pos !== undefined && sentiment.neg !== undefined) {
        const pos = Number.parseFloat(sentiment.pos) || 0
        const neg = Number.parseFloat(sentiment.neg) || 0
        const neu = Number.parseFloat(sentiment.neu) || 0

        if (pos > neg && pos > neu) {
          return (
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
              Positive ({(pos * 100).toFixed(0)}%)
            </Badge>
          )
        } else if (neg > pos && neg > neu) {
          return (
            <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
              Negative ({(neg * 100).toFixed(0)}%)
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline" className="text-xs">
              Neutral ({(neu * 100).toFixed(0)}%)
            </Badge>
          )
        }
      }

      // Fallback for unknown object structure
      return (
        <Badge variant="outline" className="text-xs">
          N/A
        </Badge>
      )
    }

    // Handle string/number sentiment values
    const sentimentStr = sentiment ? String(sentiment).toLowerCase() : ""

    switch (sentimentStr) {
      case "positive":
      case "bullish":
      case "1":
        return (
          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
            Positive
          </Badge>
        )
      case "negative":
      case "bearish":
      case "-1":
        return (
          <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
            Negative
          </Badge>
        )
      case "neutral":
      case "0":
        return (
          <Badge variant="outline" className="text-xs">
            Neutral
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            N/A
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
      accessorKey: "headline",
      header: () => (
        <div className="flex items-center space-x-1">
          <Newspaper className="h-4 w-4" />
          <span>{getTranslation(locale, "headline")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => (
        <div className="max-w-[500px]">
          <div className="font-medium line-clamp-3 break-words overflow-hidden text-ellipsis">
            {row.getValue("headline") || "N/A"}
          </div>
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
    {
      id: "actions",
      header: "Alert",
      cell: ({ row }: { row: any }) => (
        <AlertButton
          eventTitle={row.getValue("headline") || "Financial News"}
          eventTime={row.getValue("ts")}
          symbol={row.getValue("symbol")}
          type="financial"
        />
      ),
    },
  ]

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "financial")}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "أحدث الأخبار المالية وتحديثات السوق من مصادر موثوقة في جميع أنحاء العالم"
            : "Latest financial news and market updates from trusted sources worldwide"}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        title="LIIRAT News Feed"
        searchPlaceholder={locale === "ar" ? "ابحث عن العناوين والرموز..." : "Search headlines, symbols..."}
        loading={loading}
        onRefresh={fetchData}
      />
    </div>
  )
}
