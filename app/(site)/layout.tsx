import type React from "react"
import { Navigation } from "@/components/navigation"
import { PriceTicker } from "@/components/price-ticker"
import { SiteFooter } from "@/components/footer"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <PriceTicker />
      <main className="container mx-auto max-w-7xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  )
}
