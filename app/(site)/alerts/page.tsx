"use client"

import { useState } from "react"
import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"

interface Alert {
  id: string
  symbol: string
  type: "price" | "event"
  condition: string
  value: number
  status: "active" | "triggered" | "expired"
  createdAt: Date
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      symbol: "XAUUSD",
      type: "price",
      condition: "above",
      value: 2050,
      status: "active",
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: "2",
      symbol: "EURUSD",
      type: "price",
      condition: "below",
      value: 1.08,
      status: "triggered",
      createdAt: new Date(Date.now() - 172800000),
    },
    {
      id: "3",
      symbol: "GBPUSD",
      type: "price",
      condition: "above",
      value: 1.27,
      status: "active",
      createdAt: new Date(Date.now() - 259200000),
    },
  ])

  const [newAlert, setNewAlert] = useState({
    symbol: "XAUUSD",
    condition: "above",
    value: "",
  })

  const { locale } = useLocale()

  const handleCreateAlert = () => {
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
    setNewAlert({ symbol: "XAUUSD", condition: "above", value: "" })
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
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

  const activeAlerts = alerts.filter((alert) => alert.status === "active").length
  const triggeredAlerts = alerts.filter((alert) => alert.status === "triggered").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{getTranslation(locale, "alerts")}</h1>
        <p className="text-muted-foreground">
          Manage your price alerts and get notified when market conditions are met
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Currently monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggeredAlerts}</div>
            <p className="text-xs text-muted-foreground">Alerts triggered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Alert */}
        <div className="lg:col-span-1">
          <ModernPanel>
            <ModernPanelHeader>
              <ModernPanelTitle className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Alert</span>
              </ModernPanelTitle>
            </ModernPanelHeader>
            <ModernPanelContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Symbol</label>
                  <Select
                    value={newAlert.symbol}
                    onValueChange={(value) => setNewAlert({ ...newAlert, symbol: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XAUUSD">Gold/USD</SelectItem>
                      <SelectItem value="EURUSD">EUR/USD</SelectItem>
                      <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                      <SelectItem value="USDJPY">USD/JPY</SelectItem>
                      <SelectItem value="USDCHF">USD/CHF</SelectItem>
                      <SelectItem value="AUDUSD">AUD/USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Condition</label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Price Above</SelectItem>
                      <SelectItem value="below">Price Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Price Level</label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Enter price level"
                    value={newAlert.value}
                    onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateAlert} className="w-full" disabled={!newAlert.value}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            </ModernPanelContent>
          </ModernPanel>
        </div>

        {/* Alerts List */}
        <div className="lg:col-span-2">
          <ModernPanel>
            <ModernPanelHeader>
              <ModernPanelTitle>Your Alerts</ModernPanelTitle>
            </ModernPanelHeader>
            <ModernPanelContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alerts created yet</p>
                    <p className="text-sm">Create your first alert to get started</p>
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
                          {alert.condition} {alert.value.toFixed(alert.symbol.includes("JPY") ? 2 : 4)}
                        </div>
                        {getStatusBadge(alert.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">{alert.createdAt.toLocaleDateString()}</span>
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
    </div>
  )
}
