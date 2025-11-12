export type Locale = "en" | "ar"

export const locales: Locale[] = ["en", "ar"]
export const defaultLocale: Locale = "en"

export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    economic: "Economic News",
    financial: "Financial News",
    markets: "Markets",
    ai: "AI Agent",
    alerts: "Alerts",

    // Common
    loading: "Loading...",
    error: "Error",
    noData: "No data available",
    refresh: "Refresh",
    settings: "Settings",
    search: "Search...",

    // Dashboard
    quickMarkets: "Quick Markets",
    recentAlerts: "Recent Alerts",
    marketOverview: "Market Overview",

    // Tables
    time: "Time (Local)",
    country: "Country",
    event: "Event",
    actual: "Actual",
    forecast: "Forecast",
    previous: "Previous",
    impact: "Impact",
    source: "Source",
    headline: "Headline",
    symbol: "Symbol",
    sentiment: "Sentiment",
    date: "Date",

    // Theme & Language
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    english: "English",
    arabic: "العربية",

    // LIIRAT Specific
    liiratNews: "LIIRAT News",
    financialMarkets: "Financial Markets",
    economicCalendar: "Economic Calendar",
    marketAnalysis: "Market Analysis",
    tradingSignals: "Trading Signals",

    // Additional translations
    addAlert: "Alert",
    searchSymbols: "Search symbols...",
    selectSymbol: "Select Symbol",
    noSymbolsFound: "No symbols found",
    high: "High",
    medium: "Medium",
    low: "Low",
    noEventsAvailable: "No events available",
  },
  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    economic: "الأخبار الاقتصادية",
    financial: "الأخبار المالية",
    markets: "الأسواق",
    ai: "الذكاء الاصطناعي",
    alerts: "التنبيهات",

    // Common
    loading: "جاري التحميل...",
    error: "خطأ",
    noData: "لا توجد بيانات متاحة",
    refresh: "تحديث",
    settings: "الإعدادات",
    search: "بحث...",

    // Dashboard
    quickMarkets: "الأسواق السريعة",
    recentAlerts: "التنبيهات الأخيرة",
    marketOverview: "نظرة عامة على السوق",

    // Tables
    time: "الوقت (المحلي)",
    country: "الدولة",
    event: "الحدث",
    actual: "الفعلي",
    forecast: "المتوقع",
    previous: "السابق",
    impact: "التأثير",
    source: "المصدر",
    headline: "العنوان",
    symbol: "الرمز",
    sentiment: "المشاعر",
    date: "التاريخ",

    // Theme & Language
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    language: "اللغة",
    english: "English",
    arabic: "العربية",

    // LIIRAT Specific
    liiratNews: "أخبار ليرات",
    financialMarkets: "الأسواق المالية",
    economicCalendar: "التقويم الاقتصادي",
    marketAnalysis: "تحليل السوق",
    tradingSignals: "إشارات التداول",

    // Additional translations
    addAlert: "تنبيه",
    searchSymbols: "البحث عن الرموز...",
    selectSymbol: "اختر الرمز",
    noSymbolsFound: "لم يتم العثور على رموز",
    high: "مرتفع",
    medium: "متوسط",
    low: "منخفض",
    noEventsAvailable: "لا توجد أحداث متاحة",
  },
} as const

export function getTranslation(locale: Locale, key: keyof typeof translations.en): string {
  return translations[locale][key] || translations.en[key]
}

export function isRTL(locale: Locale): boolean {
  return locale === "ar"
}
