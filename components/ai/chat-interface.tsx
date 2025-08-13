"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModernPanel, ModernPanelContent, ModernPanelHeader, ModernPanelTitle } from "@/components/modern-panel"
import { Send, Bot, User } from "lucide-react"
import { useLocale } from "@/hooks/use-locale"
import { getTranslation } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  actions?: ChartAction[]
}

interface ChartAction {
  type: "addLevel" | "setSymbol" | "setTimeframe"
  params: any
  description: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI trading assistant. I can help you analyze markets, control charts, and provide trading insights. Try asking me about market trends, price levels, or technical analysis.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { locale } = useLocale()

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const executeChartActions = (actions: ChartAction[]) => {
    actions.forEach((action) => {
      const chartAPI = (window as any).ChartAPI
      if (chartAPI) {
        switch (action.type) {
          case "addLevel":
            chartAPI.addLevel(action.params.price, action.params.title)
            break
          case "setSymbol":
            chartAPI.setSymbol(action.params.symbol)
            break
          case "setTimeframe":
            chartAPI.setTimeframe(action.params.timeframe)
            break
        }
      }
    })
  }

  const generateAIResponse = async (userMessage: string): Promise<{ content: string; actions?: ChartAction[] }> => {
    // Simulate AI processing with realistic financial responses
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const lowerMessage = userMessage.toLowerCase()

    // Chart control responses
    if (lowerMessage.includes("add level") || lowerMessage.includes("support") || lowerMessage.includes("resistance")) {
      const priceMatch = userMessage.match(/(\d+\.?\d*)/g)
      const price = priceMatch ? Number.parseFloat(priceMatch[0]) : 2050

      return {
        content: `I've added a price level at ${price}. This level could act as potential support or resistance based on historical price action. Monitor how price reacts when it approaches this level.`,
        actions: [
          {
            type: "addLevel",
            params: { price, title: `Level ${price}` },
            description: `Added price level at ${price}`,
          },
        ],
      }
    }

    if (lowerMessage.includes("gold") || lowerMessage.includes("xauusd")) {
      return {
        content: `Switching to Gold (XAUUSD) analysis. Gold is currently showing interesting price action. Key levels to watch include psychological levels around 2000, 2050, and 2100. Gold often reacts to USD strength, inflation data, and geopolitical events.`,
        actions: [
          {
            type: "setSymbol",
            params: { symbol: "XAUUSD" },
            description: "Switched to XAUUSD",
          },
        ],
      }
    }

    if (lowerMessage.includes("eur") || lowerMessage.includes("eurusd")) {
      return {
        content: `Analyzing EUR/USD pair. This is the most traded currency pair globally. Key factors affecting EURUSD include ECB policy decisions, US Federal Reserve actions, and economic data from both regions. Watch for breaks above 1.10 or below 1.05 for significant moves.`,
        actions: [
          {
            type: "setSymbol",
            params: { symbol: "EURUSD" },
            description: "Switched to EURUSD",
          },
        ],
      }
    }

    if (lowerMessage.includes("timeframe") || lowerMessage.includes("1h") || lowerMessage.includes("4h")) {
      const timeframe = lowerMessage.includes("1h") ? "1h" : lowerMessage.includes("4h") ? "4h" : "15m"
      return {
        content: `Switched to ${timeframe} timeframe. This timeframe is excellent for ${
          timeframe === "1h"
            ? "intraday analysis and short-term trend identification"
            : timeframe === "4h"
              ? "swing trading and medium-term trend analysis"
              : "scalping and quick entries"
        }.`,
        actions: [
          {
            type: "setTimeframe",
            params: { timeframe },
            description: `Changed timeframe to ${timeframe}`,
          },
        ],
      }
    }

    // Market analysis responses
    if (lowerMessage.includes("trend") || lowerMessage.includes("analysis")) {
      return {
        content: `Based on current market conditions, I'm seeing mixed signals across major pairs. The USD is showing strength against most currencies, while Gold is consolidating near key levels. For trend analysis, I recommend looking at multiple timeframes - use higher timeframes for trend direction and lower timeframes for entry points.`,
      }
    }

    if (lowerMessage.includes("news") || lowerMessage.includes("economic")) {
      return {
        content: `Economic events can significantly impact market volatility. High-impact news like NFP, CPI, and central bank decisions often cause major price movements. I recommend checking the economic calendar before taking positions and being cautious around news releases.`,
      }
    }

    if (lowerMessage.includes("strategy") || lowerMessage.includes("trading")) {
      return {
        content: `For effective trading strategies, consider these key principles: 1) Always use proper risk management (1-2% risk per trade), 2) Follow the trend on higher timeframes, 3) Use multiple confirmations before entering trades, 4) Keep a trading journal, and 5) Stay disciplined with your plan.`,
      }
    }

    // Default responses
    const responses = [
      "I can help you analyze market trends, set price levels on charts, and provide trading insights. What specific market or instrument would you like to discuss?",
      "Market analysis requires looking at multiple factors including technical indicators, economic events, and market sentiment. What aspect interests you most?",
      "I can control the trading charts for you. Try asking me to add support/resistance levels, change symbols, or switch timeframes.",
      "Risk management is crucial in trading. Always consider your position size, stop losses, and risk-reward ratios before entering any trade.",
    ]

    return {
      content: responses[Math.floor(Math.random() * responses.length)],
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await generateAIResponse(userMessage.content)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Execute chart actions if any
      if (response.actions) {
        executeChartActions(response.actions)
      }
    } catch (error) {
      console.error("Error generating AI response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <ModernPanel className="h-[600px] flex flex-col">
      <ModernPanelHeader>
        <ModernPanelTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span>{getTranslation(locale, "ai")}</span>
        </ModernPanelTitle>
      </ModernPanelHeader>
      <ModernPanelContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`flex-1 space-y-2 ${message.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-12"
                        : "bg-muted text-muted-foreground mr-12"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.actions.map((action, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {action.description}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="rounded-lg bg-muted px-3 py-2 text-sm mr-12">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about markets, trading strategies, or chart analysis..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ModernPanelContent>
    </ModernPanel>
  )
}
