"use client"

import { useState, useEffect } from "react"
import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Edit, RefreshCw, Search } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { convertToEnglishNumbers } from "@/lib/i18n"

interface Alert {
  id: string
  symbol: string
  type: "price" | "event"
  condition: string
  value: number
  status: "active" | "triggered" | "expired"
  createdAt: Date
}

interface MarketPrice {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface FMPSymbol {
  symbol: string
  name: string
  exchangeShortName: string
}

const INITIAL_SYMBOLS = [
  { value: "AAPL", label: "Apple Inc" },
  { value: "GOOGL", label: "Alphabet Inc" },
  { value: "MSFT", label: "Microsoft" },
  { value: "TSLA", label: "Tesla Inc" },
  { value: "AMZN", label: "Amazon" },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [currentPrices, setCurrentPrices] = useState<Record<string, MarketPrice>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [symbolSearch, setSymbolSearch] = useState("")
  const [symbolSearchResults, setSymbolSearchResults] = useState<FMPSymbol[]>([])
  const [searchingSymbols, setSearchingSymbols] = useState(false)
  const [availableSymbols, setAvailableSymbols] = useState<{ value: string; label: string }[]>(INITIAL_SYMBOLS)

  const [newAlert, setNewAlert] = useState({
    symbol: "AAPL",
    condition: "above",
    value: "",
  })

  const { locale } = useLocale()

  const searchFMPSymbols = async (query: string) => {
    if (!query || query.length < 1) {
      setSymbolSearchResults([])
      return
    }

    setSearchingSymbols(true)
    try {
      const response = await fetch(`/api/fmp/search?query=${query}`)
      if (response.ok) {
        const data = await response.json()
        const results = data.results?.slice(0, 10) || []
        setSymbolSearchResults(results)
      }
    } catch (error) {
      console.error("Failed to search symbols:", error)
    } finally {
      setSearchingSymbols(false)
    }
  }

  const handleSelectSymbol = (symbol: string, name: string) => {
    setNewAlert({ ...newAlert, symbol })
    setSymbolSearch("")
    setSymbolSearchResults([])

    // Add to available symbols if not already present
    if (!availableSymbols.find((s) => s.value === symbol)) {
      setAvailableSymbols((prev) => [...prev, { value: symbol, label: name }])
    }

    // Fetch current price immediately
    fetchCurrentPrice(symbol)
  }

  const fetchCurrentPrice = async (symbol: string): Promise<MarketPrice | null> => {
    try {
      const response = await fetch(`/api/fmp/quote?symbol=${symbol}`)
      if (response.ok) {
        const data = await response.json()
        const price: MarketPrice = {
          symbol,
          price: data.price || 0,
          change: data.change || 0,
          changePercent: data.changePercent || 0,
        }
        setCurrentPrices((prev) => ({ ...prev, [symbol]: price }))
        return price
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error)
    }
    return null
  }

  const fetchAllPrices = async () => {
    setLoadingPrices(true)
    try {
      const symbols = availableSymbols.map((s) => s.value)
      const promises = symbols.map((symbol) => fetchCurrentPrice(symbol))
      await Promise.all(promises)
    } catch (error) {
      console.error("Failed to fetch prices:", error)
    } finally {
      setLoadingPrices(false)
    }
  }

  useEffect(() => {
    fetchAllPrices()
    const interval = setInterval(fetchAllPrices, 30000)
    return () => clearInterval(interval)
  }, [availableSymbols])

  const handleCreateAlert = async () => {
    if (!newAlert.value) return

    const alert: Alert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol,
      type: "price",
      condition: newAlert.condition,
      value: Number.parseFloat(newAlert.value),
      status: "active",
      createdAt: new Date(),
    }

    setAlerts((prev) => [alert, ...prev])
    setNewAlert({ symbol: "AAPL", condition: "above", value: "" })
    toast.success("Price alert created successfully!")
  }

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert)
    setEditDialogOpen(true)
  }

  const handleUpdateAlert = () => {
    if (!editingAlert) return

    setAlerts((prev) => prev.map((alert) => (alert.id === editingAlert.id ? editingAlert : alert)))
    setEditDialogOpen(false)
    setEditingAlert(null)
    toast.success("Alert updated successfully!")
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
    toast.success("Alert deleted successfully!")
  }

  const getStatusBadge = (status: Alert["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Active</Badge>
      case "triggered":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Triggered</Badge>
      case "expired":
        return <Badge variant="secondary">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatPrice = (price: number, symbol: string) => {
    let formatted: string
    if (symbol.includes("JPY")) formatted = price.toFixed(2)
    else if (symbol.includes("USD") && !symbol.includes(".US")) formatted = price.toFixed(4)
    else formatted = price.toFixed(2)
    return convertToEnglishNumbers(formatted)
  }

  const getCurrentPrice = (symbol: string) => {
    const price = currentPrices[symbol]
    return price ? formatPrice(price.price, symbol) : "Loading..."
  }

  const activeAlerts = alerts.filter((alert) => alert.status === "active").length
  const triggeredAlerts = alerts.filter((alert) => alert.status === "triggered").length

  return (
    <div className="space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "alerts")}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "إدارة تنبيهات الأسعار والإخطارات الخاصة بك عند تحقق شروط السوق"
            : "Manage your price alerts and get notified when market conditions are met"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "ar" ? "التنبيهات النشطة" : "Active Alerts"}
            </CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "ar" ? "قيد المراقبة حالياً" : "Currently monitoring"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "ar" ? "المُطلقة اليوم" : "Triggered Today"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggeredAlerts}</div>
            <p className="text-xs text-muted-foreground">{locale === "ar" ? "تنبيهات مُطلقة" : "Alerts triggered"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "ar" ? "إجمالي التنبيهات" : "Total Alerts"}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">{locale === "ar" ? "كل الوقت" : "All time"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Alert */}
        <div className="lg:col-span-1">
          <ModernPanel>
            <ModernPanelHeader>
              <div className="flex items-center justify-between">
                <ModernPanelTitle className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>{locale === "ar" ? "إنشاء تنبيه" : "Create Alert"}</span>
                </ModernPanelTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAllPrices}
                  disabled={loadingPrices}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingPrices ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </ModernPanelHeader>
            <ModernPanelContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {locale === "ar" ? "البحث عن الرمز" : "Search Symbol"}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={getTranslation(locale, "searchSymbols")}
                      value={symbolSearch}
                      onChange={(e) => {
                        setSymbolSearch(e.target.value)
                        searchFMPSymbols(e.target.value)
                      }}
                      className="pl-8"
                    />
                  </div>

                  {/* Symbol search results dropdown */}
                  {symbolSearch && (
                    <div className="absolute mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {searchingSymbols ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          {locale === "ar" ? "جاري البحث..." : "Searching..."}
                        </div>
                      ) : symbolSearchResults.length > 0 ? (
                        symbolSearchResults.map((result: FMPSymbol) => (
                          <button
                            key={result.symbol}
                            onClick={() => handleSelectSymbol(result.symbol, result.name)}
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b last:border-b-0 text-sm"
                          >
                            <div className="font-medium">{result.symbol}</div>
                            <div className="text-xs text-muted-foreground">{result.name}</div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          {getTranslation(locale, "noSymbolsFound")}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected symbol or dropdown */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{locale === "ar" ? "الرمز" : "Symbol"}</label>
                  <Select
                    value={newAlert.symbol}
                    onValueChange={(value) => setNewAlert({ ...newAlert, symbol: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSymbols.map((symbol) => (
                        <SelectItem key={symbol.value} value={symbol.value}>
                          {symbol.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{locale === "ar" ? "السعر الحالي:" : "Current Price:"}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-semibold">{getCurrentPrice(newAlert.symbol)}</span>
                      {currentPrices[newAlert.symbol] && (
                        <div
                          className={`flex items-center space-x-1 text-xs ${
                            currentPrices[newAlert.symbol].changePercent >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {currentPrices[newAlert.symbol].changePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>
                            {currentPrices[newAlert.symbol].changePercent >= 0 ? "+" : ""}
                            {currentPrices[newAlert.symbol].changePercent.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{locale === "ar" ? "الشرط" : "Condition"}</label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">{locale === "ar" ? "السعر فوق" : "Price Above"}</SelectItem>
                      <SelectItem value="below">{locale === "ar" ? "السعر تحت" : "Price Below"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {locale === "ar" ? "مستوى السعر" : "Price Level"}
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder={locale === "ar" ? "أدخل مستوى السعر" : "Enter price level"}
                    value={newAlert.value}
                    onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateAlert} className="w-full" disabled={!newAlert.value}>
                  <Plus className="h-4 w-4 mr-2" />
                  {locale === "ar" ? "إنشاء تنبيه" : "Create Alert"}
                </Button>
              </div>
            </ModernPanelContent>
          </ModernPanel>
        </div>

        {/* Alerts List */}
        <div className="lg:col-span-2">
          <ModernPanel>
            <ModernPanelHeader>
              <ModernPanelTitle>{locale === "ar" ? "تنبيهاتك" : "Your Alerts"}</ModernPanelTitle>
            </ModernPanelHeader>
            <ModernPanelContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{locale === "ar" ? "لم يتم إنشاء تنبيهات بعد" : "No alerts created yet"}</p>
                    <p className="text-sm">
                      {locale === "ar" ? "أنشئ تنبيهك الأول للبدء" : "Create your first alert to get started"}
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {alert.condition === "above" ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-mono font-medium">{alert.symbol}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {alert.condition} {formatPrice(alert.value, alert.symbol)}
                        </div>
                        {getStatusBadge(alert.status)}
                        {currentPrices[alert.symbol] && (
                          <div className="text-xs text-muted-foreground">
                            {locale === "ar" ? "الحالي:" : "Current:"}{" "}
                            {formatPrice(currentPrices[alert.symbol].price, alert.symbol)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">{alert.createdAt.toLocaleDateString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAlert(alert)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ModernPanelContent>
          </ModernPanel>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>{locale === "ar" ? "تعديل التنبيه" : "Edit Alert"}</span>
            </DialogTitle>
          </DialogHeader>
          {editingAlert && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-symbol">{locale === "ar" ? "الرمز" : "Symbol"}</Label>
                <Select
                  value={editingAlert.symbol}
                  onValueChange={(value) => setEditingAlert({ ...editingAlert, symbol: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSymbols.map((symbol) => (
                      <SelectItem key={symbol.value} value={symbol.value}>
                        {symbol.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{locale === "ar" ? "السعر الحالي:" : "Current Price:"}</span>
                  <span className="font-mono text-sm font-semibold">{getCurrentPrice(editingAlert.symbol)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-condition">{locale === "ar" ? "الشرط" : "Condition"}</Label>
                <Select
                  value={editingAlert.condition}
                  onValueChange={(value) => setEditingAlert({ ...editingAlert, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">{locale === "ar" ? "السعر فوق" : "Price Above"}</SelectItem>
                    <SelectItem value="below">{locale === "ar" ? "السعر تحت" : "Price Below"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-value">{locale === "ar" ? "مستوى السعر" : "Price Level"}</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="0.0001"
                  value={editingAlert.value}
                  onChange={(e) => setEditingAlert({ ...editingAlert, value: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">{locale === "ar" ? "الحالة" : "Status"}</Label>
                <Select
                  value={editingAlert.status}
                  onValueChange={(value: "active" | "triggered" | "expired") =>
                    setEditingAlert({ ...editingAlert, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{locale === "ar" ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="triggered">{locale === "ar" ? "مُطلق" : "Triggered"}</SelectItem>
                    <SelectItem value="expired">{locale === "ar" ? "منتهي الصلاحية" : "Expired"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleUpdateAlert} className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                {locale === "ar" ? "تحديث التنبيه" : "Update Alert"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
