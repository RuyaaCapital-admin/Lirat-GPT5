"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Plus } from "lucide-react"
import { toast } from "sonner"
import { convertToEnglishNumbers } from "@/lib/i18n"

interface AlertButtonProps {
  eventTitle: string
  eventTime?: string
  symbol?: string
  type?: "economic" | "financial"
}

export function AlertButton({ eventTitle, eventTime, symbol, type = "economic" }: AlertButtonProps) {
  const [open, setOpen] = useState(false)
  const [alertType, setAlertType] = useState<"before" | "ontime">("before")
  const [minutesBefore, setMinutesBefore] = useState("15")

  const handleCreateAlert = () => {
    // Here you would typically save the alert to your backend/state management
    const alertData = {
      eventTitle,
      eventTime,
      symbol,
      type,
      alertType,
      minutesBefore: alertType === "before" ? Number.parseInt(minutesBefore) : 0,
      createdAt: new Date(),
    }

    // For now, just show a toast notification
    toast.success(
      `Alert set for "${eventTitle}" ${alertType === "before" ? `${minutesBefore} minutes before` : "at event time"}`,
    )

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Set Event Alert</span>
          </DialogTitle>
        </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event</Label>
              <Input id="event-title" value={eventTitle} readOnly className="bg-muted/50" />
            </div>

            {eventTime && (
              <div className="space-y-2">
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  value={convertToEnglishNumbers(new Date(eventTime).toLocaleString())}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
            )}

          {symbol && (
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input id="symbol" value={symbol} readOnly className="bg-muted/50" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alert-type">Alert Timing</Label>
            <Select value={alertType} onValueChange={(value: "before" | "ontime") => setAlertType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Before Event</SelectItem>
                <SelectItem value="ontime">At Event Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {alertType === "before" && (
            <div className="space-y-2">
              <Label htmlFor="minutes-before">Minutes Before</Label>
              <Select value={minutesBefore} onValueChange={setMinutesBefore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleCreateAlert} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
