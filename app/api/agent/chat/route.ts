import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createServerClient } from "@/lib/supabase"
import { insertNotification } from "@/lib/notifications.server"

const MODEL_NAME = process.env.OPENAI_AGENT_MODEL ?? "gpt-4o-mini"
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type ClientMessage = {
  role: "assistant" | "user" | "tool"
  content: string
}

type ToolInvocation = {
  name: string
  args: Record<string, unknown>
  result?: Record<string, unknown>
}

const SYSTEM_PROMPT = `
You are Liirat's bilingual trading co-pilot. 
- Always respond in the same language the user used.
- For factual market data, ALWAYS call the appropriate tool first.
- Summaries must be concise, bulleted when possible, and cite actual numbers from the tool response.
- If a tool fails, apologise briefly and offer an alternative.
`.trim()

const TOOL_DEFINITIONS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_symbol_price",
      description: "Fetch the latest market price, change %, and volume for any stock, crypto, or FX pair.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Ticker or FX pair (e.g. AAPL, BTCUSD, EURUSD).",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_trade_signal",
      description: "Pull latest technical signal (RSI, MACD, etc.) for a symbol.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Ticker or FX pair (e.g. AAPL, BTCUSD).",
          },
          timeframe: {
            type: "string",
            description: "Timeframe such as 1d, 1w, 1M. Default 1d.",
          },
        },
        required: ["symbol"],
      },
    },
  },
]

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 })
  }

  let userId: string | null = null
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "")
    try {
      const supabase = createServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser(token)
      userId = user?.id ?? null
    } catch (error) {
      console.error("[agent/chat] failed to resolve user", error)
    }
  }

  let body: { messages?: ClientMessage[] } = {}
  try {
    body = await request.json()
  } catch {
    // ignore
  }

  const origin = new URL(request.url).origin
  const clientMessages = Array.isArray(body.messages) ? body.messages : []
  if (clientMessages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 })
  }

  try {
    const { additions, tools } = await runAgent(clientMessages, origin)

    if (userId && tools.length > 0) {
      await logNotifications(userId, tools)
    }

    return NextResponse.json({ additions, tools })
  } catch (error) {
    console.error("[agent/chat] fatal", error)
    return NextResponse.json(
      { error: "Unable to reach Liirat agent right now. Please try again shortly." },
      { status: 500 },
    )
  }
}

async function runAgent(messages: ClientMessage[], origin: string) {
  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ]

  const additions: { role: "assistant" | "tool"; content: string }[] = []
  const toolInvocations: ToolInvocation[] = []

  while (true) {
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      temperature: 0.3,
      messages: openaiMessages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
    })

    const choice = completion.choices[0]
    const responseMessage = choice.message

    if (choice.finish_reason === "tool_calls" && responseMessage?.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const name = toolCall.function.name
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(toolCall.function.arguments || "{}")
        } catch (error) {
          console.error("[agent/chat] failed to parse tool args", error)
        }

        const result = await invokeTool(name, args, origin)
        toolInvocations.push({ name, args, result })

        openaiMessages.push({
          role: "tool",
          content: JSON.stringify(result ?? { error: "No data" }),
          tool_call_id: toolCall.id,
        })

        if (result) {
          additions.push({
            role: "tool",
            content: summarizeToolResult(name, args, result),
          })
        }
      }
      continue
    }

    const assistantContent =
      responseMessage?.content && typeof responseMessage.content === "string"
        ? responseMessage.content
        : Array.isArray(responseMessage?.content)
          ? responseMessage?.content.map((entry) => ("text" in entry ? entry.text : "")).join("\n")
          : "I'm ready for the next request."

    additions.push({
      role: "assistant",
      content: assistantContent,
    })

    return { additions, tools: toolInvocations }
  }
}

async function invokeTool(name: string, args: Record<string, unknown>, origin: string) {
  const symbol = typeof args.symbol === "string" ? args.symbol : undefined
  switch (name) {
    case "get_symbol_price": {
      if (!symbol) return { error: "symbol required" }
      const url = new URL(`/api/get_symbol_price?symbol=${encodeURIComponent(symbol)}`, origin)
      const response = await fetch(url, { cache: "no-store" })
      if (!response.ok) {
        return { error: `Failed to fetch price (${response.status})` }
      }
      return response.json()
    }
    case "submit_trade_signal": {
      if (!symbol) return { error: "symbol required" }
      const params = new URLSearchParams()
      params.set("symbol", symbol)
      if (typeof args.timeframe === "string") {
        params.set("timeframe", args.timeframe)
      }
      const url = new URL(`/api/submit_trade_signal?${params.toString()}`, origin)
      const response = await fetch(url, { cache: "no-store" })
      if (!response.ok) {
        return { error: `Failed to fetch signal (${response.status})` }
      }
      return response.json()
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

function summarizeToolResult(name: string, args: Record<string, unknown>, result: Record<string, unknown>) {
  if (name === "get_symbol_price") {
    const symbol = result.symbol || args.symbol || "—"
    const price = result.price ?? result.current ?? "n/a"
    const changePercent = result.changePercent ?? result.change_percent ?? null
    const formattedChange = typeof changePercent === "number" ? ` (${changePercent.toFixed(2)}%)` : ""
    return `Fetched ${symbol}: ${price}${formattedChange}`
  }

  if (name === "submit_trade_signal") {
    const symbol = result.symbol || args.symbol || "—"
    const signal = result.signal || "NEUTRAL"
    const timeframe = result.timeframe || args.timeframe || "1d"
    return `Signal for ${symbol} (${timeframe}): ${signal}`
  }

  return `${name} executed`
}

async function logNotifications(userId: string, tools: ToolInvocation[]) {
  await Promise.all(
    tools.map(async (tool) => {
      try {
        if (tool.name === "get_symbol_price" && tool.result?.symbol) {
          const pct =
            tool.result.changePercent && typeof tool.result.changePercent === "number"
              ? `${tool.result.changePercent.toFixed(2)}%`
              : null
          await insertNotification({
            userId,
            title: `${tool.result.symbol} price snapshot`,
            body: `Latest price ${tool.result.price ?? "n/a"}${pct ? ` (${pct})` : ""}`,
            metadata: tool.result,
          })
        } else if (tool.name === "submit_trade_signal" && tool.result?.symbol) {
          await insertNotification({
            userId,
            title: `Trade signal for ${tool.result.symbol}`,
            body: `${tool.result.signal ?? "Neutral"} on ${tool.result.timeframe ?? "1d"} timeframe`,
            metadata: tool.result,
          })
        }
      } catch (error) {
        console.error("[agent/chat] failed to log notification", error)
      }
    }),
  )
}

