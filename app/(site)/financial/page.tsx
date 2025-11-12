"use client"

import { useEffect, useState } from "react"
import { DataTable, type Row } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/hooks/use-locale"
import { convertToEnglishNumbers, getTranslation } from "@/lib/i18n"
import { Clock, Newspaper, ArrowUpRight } from "lucide-react"

export default function FinancialPage() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const { locale } = useLocale()

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/fmp/news?locale=${locale}`, { cache: "no-store" })
      if (response.ok) {
        const result = await response.json()
        setData(result.items || [])
      } else {
        console.error("Failed to fetch financial data:", response.status)
        setData([])
      }
    } catch (error) {
      console.error("Failed to fetch financial data:", error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [locale])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "N/A"
    try {
      const date = new Date(timeStr)
      const formatter = new Intl.DateTimeFormat(
        locale === "ar" ? "ar-EG-u-ca-gregory-nu-latn" : "en-GB",
        {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      )
      return convertToEnglishNumbers(formatter.format(date))
    } catch {
      return convertToEnglishNumbers(timeStr)
    }
  }

  const columns = [
    {
      accessorKey: "publishedDate",
      header: () => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{getTranslation(locale, "time")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => (
        <div className="font-mono text-sm whitespace-nowrap">{formatTime(row.getValue("publishedDate"))}</div>
      ),
    },
    {
      accessorKey: "title",
      header: () => (
        <div className="flex items-center gap-1">
          <Newspaper className="h-4 w-4" />
          <span>{getTranslation(locale, "headline")}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const title = row.getValue("title")
        const link = row.original?.link
        return (
          <div className="max-w-[520px]">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex max-w-full items-start gap-2 text-left"
              >
                <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 translate-y-[1px] text-muted-foreground transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                <span className="font-medium leading-snug text-foreground transition-colors duration-200 group-hover:text-primary line-clamp-2">
                  {title ? String(title) : "N/A"}
                </span>
              </a>
            ) : (
              <span className="font-medium line-clamp-2 break-words">{title ? String(title) : "N/A"}</span>
            )}
          </div>
        )
      },
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
      accessorKey: "source",
      header: () => (
        <div className="flex items-center gap-1">
          <Newspaper className="h-4 w-4" />
          <span>{locale === "ar" ? "المصدر" : "Source"}</span>
        </div>
      ),
      cell: ({ row }: { row: any }) => {
        const source = row.getValue("source")
        return source ? (
          <Badge variant="outline" className="text-xs font-medium">
            {source}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">N/A</span>
        )
      },
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

      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {locale === "ar" ? "لا توجد أخبار متاحة الآن" : "No news available at this time"}
          </p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        title={getTranslation(locale, "financial")}
        searchPlaceholder={locale === "ar" ? "ابحث عن العناوين والرموز..." : "Search headlines, symbols..."}
        loading={loading}
        onRefresh={fetchData}
      />
    </div>
  )
}
