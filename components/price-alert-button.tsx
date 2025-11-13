"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Plus } from "lucide-react"
import { toast } from "sonner"
import { appendAlert } from "@/lib/alerts-storage"
import { useLocale } from "@/hooks/use-locale"
import { convertToEnglishNumbers } from "@/lib/i18n"

interface PriceAlertButtonProps {
  symbol: string
  currentPrice?: number | null
  className?: string
}

export function PriceAlertButton({ symbol, currentPrice, className }: PriceAlertButtonProps) {
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState<"above" | "below">("above")
  const formatInitialPrice = (value: number) => {
    const fractionDigits = value >= 100 ? 2 : value >= 1 ? 3 : 4
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: fractionDigits,
      useGrouping: false,
    }).format(value)
  }
  const initialPrice =
    currentPrice !== undefined && currentPrice !== null ? formatInitialPrice(currentPrice) : ""
  const [price, setPrice] = useState<string>(initialPrice)
  const { locale } = useLocale()

  const handleCreate = () => {
    const parsed = Number.parseFloat(price)
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error(locale === "ar" ? "يرجى إدخال سعر صالح" : "Please provide a valid price")
      return
    }

    appendAlert({
      id: Date.now().toString(),
      symbol,
      condition,
      value: parsed,
      status: "active",
      createdAt: new Date().toISOString(),
    })

    const displayValue = convertToEnglishNumbers(parsed.toString())
    toast.success(
      locale === "ar"
        ? `تم ضبط تنبيه لـ ${symbol} عندما يكون السعر ${condition === "above" ? "فوق" : "تحت"} ${displayValue}`
        : `Alert set for ${symbol} when price is ${condition === "above" ? "above" : "below"} ${displayValue}`,
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          title={locale === "ar" ? "ضبط تنبيه سعر" : "Set price alert"}
        >
          <Bell className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span>{locale === "ar" ? "إنشاء تنبيه سعر" : "Create price alert"}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium">{locale === "ar" ? "الرمز" : "Symbol"}</Label>
            <div className="mt-1 rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm">{symbol}</div>
          </div>
          <div>
            <Label className="text-sm font-medium">{locale === "ar" ? "الشرط" : "Condition"}</Label>
            <Select value={condition} onValueChange={(value: "above" | "below") => setCondition(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">{locale === "ar" ? "السعر فوق" : "Price above"}</SelectItem>
                <SelectItem value="below">{locale === "ar" ? "السعر تحت" : "Price below"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">
              {locale === "ar" ? "مستوى السعر" : "Price level"}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              className="mt-1"
              value={price}
              onChange={(event) => setPrice(convertToEnglishNumbers(event.target.value))}
              placeholder={initialPrice ? convertToEnglishNumbers(initialPrice) : "0.00"}
            />
            {currentPrice !== undefined && currentPrice !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {locale === "ar"
                  ? `السعر الحالي: ${convertToEnglishNumbers(currentPrice.toString())}`
                  : `Current price: ${convertToEnglishNumbers(currentPrice.toString())}`}
              </p>
            )}
          </div>
          <Button onClick={handleCreate} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {locale === "ar" ? "إنشاء تنبيه" : "Create alert"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {locale === "ar"
              ? "يمكنك إدارة جميع تنبيهاتك من صفحة التنبيهات."
              : "Manage all alerts anytime from the alerts page."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
