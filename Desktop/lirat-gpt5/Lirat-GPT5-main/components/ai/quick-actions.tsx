"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, BarChart3, Lightbulb, Target } from "lucide-react"

interface QuickActionsProps {
  onActionClick: (message: string) => void
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const actions = [
    {
      icon: TrendingUp,
      title: "Market Analysis",
      description: "Get current market trend analysis",
      message: "Analyze the current market trends and provide insights",
    },
    {
      icon: Target,
      title: "Add Support Level",
      description: "Add key support/resistance levels",
      message: "Add support level at 2050 for Gold",
    },
    {
      icon: BarChart3,
      title: "Switch to Gold",
      description: "Analyze Gold market",
      message: "Switch to Gold and provide analysis",
    },
    {
      icon: Lightbulb,
      title: "Trading Strategy",
      description: "Get trading strategy advice",
      message: "What's a good trading strategy for current market conditions?",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 text-left justify-start bg-transparent hover:bg-muted/50 transition-colors"
                onClick={() => onActionClick(action.message)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <Icon className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{action.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 break-words">{action.description}</div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
