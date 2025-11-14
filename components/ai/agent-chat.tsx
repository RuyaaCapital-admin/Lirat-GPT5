"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { SendHorizontal, Sparkles, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

type UiMessage = {
  id: string
  role: "assistant" | "user" | "tool"
  content: string
  meta?: { label?: string }
}

type ToolInvocation = {
  name: string
  args: Record<string, unknown>
  result?: Record<string, unknown>
}

export type AgentChatHandle = {
  sendPrompt: (prompt: string) => void
}

interface AgentChatProps {
  className?: string
}

export const AgentChat = forwardRef<AgentChatHandle, AgentChatProps>(function AgentChat(
  { className },
  ref,
) {
  const { session } = useAuth()
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Marḥabā! Ask me for live FX, bullion moves, or quick technical checks. I can fetch FMP prices, generate trade signals, and summarize market headlines for you.",
    },
  ])
  const [input, setInput] = useState("")
  const [status, setStatus] = useState<"idle" | "thinking" | "error">("idle")
  const [toolEvents, setToolEvents] = useState<ToolInvocation[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const isAuthenticated = Boolean(session?.access_token)

  useImperativeHandle(ref, () => ({
    sendPrompt(prompt: string) {
      submitMessage(prompt)
    },
  }))

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, status])

  const formatToolEvent = (event: ToolInvocation) => {
    if (event.name === "get_symbol_price" && event.result) {
      const price = event.result.price
      const symbol = event.result.symbol || event.args.symbol
      return `Fetched ${symbol}: ${price ?? "n/a"}`
    }
    if (event.name === "submit_trade_signal" && event.result) {
      const signal = event.result.signal
      const symbol = event.result.symbol || event.args.symbol
      return `Signal for ${symbol}: ${signal ?? "neutral"}`
    }
    return `${event.name} executed`
  }

  const submitMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || status === "thinking") return

    const userMessage: UiMessage = { id: crypto.randomUUID(), role: "user", content: trimmed }
    const optimistic = [...messages, userMessage]
    setMessages(optimistic)
    setInput("")
    setStatus("thinking")

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (isAuthenticated && session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const payload = {
        messages: optimistic.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }

      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      const additions: UiMessage[] =
        data.additions?.map((entry: any) => ({
          id: crypto.randomUUID(),
          role: entry.role,
          content: entry.content,
        })) ?? []

      setToolEvents(data.tools ?? [])
      setMessages((prev) => [...prev, ...additions])
      setStatus("idle")
    } catch (error) {
      console.error("[AgentChat] request failed", error)
      setStatus("error")
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I couldn’t reach our AI service just now. Please try again in a few seconds or refresh the page.",
        },
      ])
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitMessage(input)
  }

  const headerStatus = useMemo(() => {
    if (status === "thinking") return "Analyzing markets…"
    if (status === "error") return "Temporarily unavailable"
    return "Live"
  }, [status])

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[32px] border border-emerald-100/70 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] dark:border-emerald-500/20 dark:bg-[#09110c]/95 dark:shadow-[0_36px_110px_rgba(5,10,7,0.85)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-emerald-100/60 px-6 py-4 text-sm text-muted-foreground dark:border-white/5">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Liirat Agent</p>
          <p className="text-base font-semibold text-foreground">Markets companion</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em]",
            status === "error"
              ? "border-amber-400 text-amber-600 dark:border-amber-500/50 dark:text-amber-200"
              : "border-primary/40 text-primary",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {headerStatus}
        </span>
      </div>

      {toolEvents.length > 0 && status !== "thinking" && (
        <div className="border-b border-emerald-100/60 px-6 py-2 text-xs text-muted-foreground dark:border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <Workflow className="h-3 w-3 text-primary" />
            {toolEvents.map((event, index) => (
              <span
                key={`${event.name}-${index}`}
                className="rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary"
              >
                {formatToolEvent(event)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                message.role === "assistant" &&
                  "bg-emerald-50/80 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-50",
                message.role === "user" && "bg-primary text-primary-foreground",
                message.role === "tool" &&
                  "bg-muted text-muted-foreground dark:bg-white/5 dark:text-white/70",
              )}
            >
              {message.role === "assistant" && (
                <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.4em] text-primary/70">
                  <Sparkles className="h-3 w-3" />
                  Agent
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {status === "thinking" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Calling market tools…
          </div>
        )}
      </div>

        <form onSubmit={handleSubmit} className="border-t border-emerald-100/70 px-6 py-4 dark:border-white/5">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100/80 bg-white px-4 py-2 dark:border-white/10 dark:bg-white/5">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask for live FX, signals, or news…"
              className="flex-1 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
              disabled={status === "thinking"}
            />
            <Button
              type="submit"
              size="icon"
              disabled={status === "thinking" || !input.trim()}
              className="rounded-full"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </form>
    </div>
  )
})

