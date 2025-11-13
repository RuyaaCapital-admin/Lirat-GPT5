import type React from "react"
import type { Metadata } from "next"
import { Inter, Noto_Sans_Arabic } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LocaleProvider } from "@/hooks/use-locale"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
})

export const metadata: Metadata = {
  title: "LIIRAT - Financial Markets Platform",
  description: "Modern financial markets platform with real-time data, economic news, and AI-powered insights",
  generator: "LIIRAT",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <style>{`
            html {
              --font-sans: ${inter.variable};
              --font-arabic: ${notoSansArabic.variable};
            }
            body {
              font-family: ${inter.style.fontFamily};
            }
            [dir="rtl"] {
              font-family: ${notoSansArabic.style.fontFamily};
            }
          `}</style>
          <script
            src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
            async
          />
        </head>
        <body className={`${inter.variable} ${notoSansArabic.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
            <LocaleProvider>{children}</LocaleProvider>
          </ThemeProvider>
        </body>
      </html>
  )
}
