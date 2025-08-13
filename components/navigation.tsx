"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { LiiratLogo } from "@/components/liirat-logo"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation, isRTL } from "@/lib/i18n"
import { BarChart3, Newspaper, TrendingUp, Bot, Bell, LayoutDashboard } from "lucide-react"

const navigationItems = [
  {
    key: "dashboard" as const,
    href: "/",
    icon: LayoutDashboard,
  },
  {
    key: "economic" as const,
    href: "/economic",
    icon: Newspaper,
  },
  {
    key: "financial" as const,
    href: "/financial",
    icon: TrendingUp,
  },
  {
    key: "markets" as const,
    href: "/markets",
    icon: BarChart3,
  },
  {
    key: "ai" as const,
    href: "/ai",
    icon: Bot,
  },
  {
    key: "alerts" as const,
    href: "/alerts",
    icon: Bell,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const { locale } = useLocale()
  const rtl = isRTL(locale)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* LIIRAT Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <LiiratLogo size="md" showText={true} />
            <span className="ml-2 text-sm text-muted-foreground font-medium">News</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const label = getTranslation(locale, item.key)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  rtl && "flex-row-reverse space-x-reverse",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center space-x-1">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center p-2 rounded-lg transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
