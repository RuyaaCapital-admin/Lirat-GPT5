"use client"

import Link from "next/link"
import { useLocale } from "@/hooks/use-locale"

export function SiteFooter() {
  const { locale } = useLocale()
  const isArabic = locale === "ar"

  return (
    <footer className="border-t border-white/50 bg-white/80 backdrop-blur-lg dark:border-white/10 dark:bg-background/80">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between max-w-7xl">
        <p className="text-xs md:text-sm">
          {isArabic
            ? "© " + new Date().getFullYear() + " ليرات. جميع الحقوق محفوظة."
            : `© ${new Date().getFullYear()} Liirat. All rights reserved.`}
        </p>
        <nav className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
          <Link href="https://liiratnews.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
          </Link>
          <Link href="https://liiratnews.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            {isArabic ? "شروط الاستخدام" : "Terms of Service"}
          </Link>
          <Link href="https://liiratnews.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            {isArabic ? "تواصل معنا" : "Contact"}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
