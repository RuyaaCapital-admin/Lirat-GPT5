"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LiiratLogo } from "@/components/liirat-logo"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation, isRTL } from "@/lib/i18n"
import { Newspaper, TrendingUp, Bot, Bell, LayoutDashboard, LogIn, LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const { user, loading, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-transparent bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.08)] dark:bg-background/70 dark:shadow-[0_8px_32px_rgba(2,6,23,0.6)]">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* LIIRAT Logo */}
        <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse gap-3")}>
          <Link
            href="/"
            onClick={(event) => {
              if (pathname === "/") {
                event.preventDefault()
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
            }}
            className="flex items-center gap-3"
          >
            <LiiratLogo size="md" showText={false} />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 rounded-full bg-white/60 px-2 py-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:bg-background/60 md:flex">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const label = getTranslation(locale, item.key)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(57,179,107,0.35)]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                  rtl && "flex-row-reverse",
                )}
              >
                <Icon className={cn("h-4 w-4", !isActive && "text-muted-foreground group-hover:text-foreground")} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Navigation */}
        <nav className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 shadow-[0_8px_24px_rgba(15,23,42,0.1)] backdrop-blur md:hidden">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center rounded-full p-2 transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(57,179,107,0.35)]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            )
          })}
        </nav>

        {/* Auth & Settings */}
        <div className="flex items-center gap-2">
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Signed in</p>
                      </div>
                    </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
