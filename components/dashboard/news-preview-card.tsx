"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ModernPanel, ModernPanelHeader, ModernPanelTitle, ModernPanelContent } from "@/components/modern-panel"
import { ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

interface NewsItem {
  ts?: string
  time?: string
  source?: string
  headline?: string
  event?: string
  country?: string
  impact?: string
}

interface NewsPreviewCardProps {
  type: "economic" | "financial"
  title: string
  href: string
}

export function NewsPreviewCard({ type, title, href }: NewsPreviewCardProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const { locale } = useLocale()

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/eodhd/${type}`)
        if (response.ok) {
          const data = await response.json()
          setNews(data.items?.slice(0, 5) || [])
        }
      } catch (error) {
        console.error(`Failed to fetch ${type} news:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [type])

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "N/A"
    try {
      const date = new Date(timeStr)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return timeStr
    }
  }

  const getImpactColor = (impact?: string) => {
    if (!impact) return "bg-muted"
    switch (impact.toLowerCase()) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-muted"
    }
  }

  return (
    <ModernPanel>
      <ModernPanelHeader>
        <div className="flex items-center justify-between">
          <ModernPanelTitle>{title}</ModernPanelTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={href} className="flex items-center space-x-1">
              <span className="text-xs">View All</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </ModernPanelHeader>
      <ModernPanelContent>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : news.length > 0 ? (
            news.map((item, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium line-clamp-2">
                      {item.headline || item.event || "No title available"}
                    </p>
                    {item.impact && (
                      <div className={`w-2 h-2 rounded-full ${getImpactColor(item.impact)} ml-2 mt-1 flex-shrink-0`} />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(item.ts || item.time)}</span>
                    {item.source && <span>• {item.source}</span>}
                    {item.country && <span>• {item.country}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
              {getTranslation(locale, "noData")}
            </div>
          )}
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}
