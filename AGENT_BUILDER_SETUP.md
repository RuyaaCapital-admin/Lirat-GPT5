# OpenAI ChatKit Agent Builder Function Tools Setup Guide

This guide explains how to connect your FMP Premium API endpoints to **OpenAI's ChatKit Agent Builder** (inside OpenAI Platform) as function tools, while keeping the agent conversational and fast.

## Important: Agent Builder Location

**Agent Builder is part of OpenAI Platform**, not a separate service:

- Access it at: <https://platform.openai.com/chatkit/agent-builder>
- It's built into ChatKit/OpenAI Platform
- Function tools are configured directly in OpenAI's interface

## Overview


Your ChatKit agent will have access to three main function tools:

1. **get_price** - Real-time price data
2. **get_signal** - Trading signals and technical analysis
3. **get_news** - Latest financial news

The agent will **only** call these functions when the user asks for specific data. Normal conversation stays LLM-only (fast, no latency).

## API Endpoints

All endpoints are ready and deployed:

### 1. Price Endpoint


- **URL:** `https://your-domain.vercel.app/api/fmp/price?symbol=AAPL`
- **Method:** GET
- **Parameters:**
  - `symbol` (required): Stock, crypto, or forex symbol (e.g., "AAPL", "BTCUSD", "EURUSD")
- **Response:**

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "price": 175.50,
  "change": 2.30,
  "changePercent": 1.33,
  "volume": 50000000,
  "marketCap": 2800000000000,
  "high": 176.00,
  "low": 173.20,
  "open": 174.00,
  "previousClose": 173.20,
  "timestamp": 1704067200000,
  "exchange": "NASDAQ"
}
```

### 2. Signal Endpoint

- **URL:** `https://your-domain.vercel.app/api/fmp/signal?symbol=AAPL&timeframe=1d`

- **Method:** GET
- **Parameters:**
  - `symbol` (required): Stock, crypto, or forex symbol
  - `timeframe` (optional): "1d", "1w", "1M" (default: "1d")
- **Response:**

```json
{
  "symbol": "AAPL",
  "signal": "BULLISH",
  "signalStrength": 2,
  "reasons": [
    "RSI oversold (28.50)",
    "MACD bullish crossover"
  ],
  "indicators": {
    "rsi": {
      "value": 28.50,
      "date": "2024-01-01"
    },
    "macd": {
      "macd": 0.5,
      "signal": 0.3,
      "histogram": 0.2,
      "date": "2024-01-01"
    }
  },
  "price": {
    "current": 175.50,
    "change": 2.30,
    "changePercent": 1.33
  },
  "timeframe": "1d",
  "timestamp": 1704067200000
}
```

### 3. News Endpoint

- **URL:** `https://your-domain.vercel.app/api/fmp/news?symbol=AAPL&limit=5`

- **Method:** GET
- **Parameters:**
  - `symbol` (optional): Filter news by symbol
  - `limit` (optional): Number of articles (default: 10, max: 50)
- **Response:**

```json
{
  "articles": [
    {
      "title": "Apple Reports Record Q4 Earnings",
      "text": "...",
      "date": "2024-01-01T10:00:00Z",
      "symbol": "AAPL",
      "url": "https://..."
    }
  ],
  "count": 5
}
```

## Setting Up in OpenAI Agent Builder

### Step 1: Access Agent Builder

1. Go to **OpenAI Platform**: <https://platform.openai.com>
2. Navigate to **ChatKit** → **Agent Builder**
3. Open your existing workflow (or create a new one)
4. The workflow ID you're using: `wf_68fa5dfe9d2c8190a491802fdc61f86201d5df9b9d3ae103`

### Step 2: Add Function Tools

In your ChatKit Agent Builder workflow (inside OpenAI Platform), add three Function nodes:

#### Function 1: `get_price`

1. **Function Name:** `get_price`

2. **Description:**

```text
Get the current price, change, volume, and market data for any stock, crypto, or forex symbol. 
Use this when the user asks about price, current value, or market data for a symbol.
Examples: "What's the price of AAPL?", "Show me BTCUSD price", "How is TSLA doing?"
```

3. **Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "symbol": {
      "type": "string",
      "description": "The stock, crypto, or forex symbol (e.g., AAPL, BTCUSD, EURUSD)"
    }
  },
  "required": ["symbol"]
}
```

4. **API Configuration (in OpenAI Agent Builder):**

   - **Method:** GET
   - **URL:** `https://v0-modern-e-commerce-website-sigma-seven.vercel.app/api/fmp/price`
   - **Query Parameters:** `symbol={{symbol}}`
   - **Headers:** None required
   - **Note:** In Agent Builder, you'll configure this as an "HTTP Function" or "API Function"

#### Function 2: `get_signal`

1. **Function Name:** `get_signal`

2. **Description:**

```text
Get trading signals and technical analysis for any symbol. Provides RSI, MACD indicators, 
and generates a BULLISH/BEARISH/NEUTRAL signal with reasons.
Use this when the user asks about trading signals, technical analysis, or whether to buy/sell.
Examples: "What's the signal for AAPL?", "Should I buy TSLA?", "Analyze BTCUSD"
```

3. **Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "symbol": {
      "type": "string",
      "description": "The stock, crypto, or forex symbol to analyze"
    },
    "timeframe": {
      "type": "string",
      "enum": ["1d", "1w", "1M"],
      "description": "Timeframe for analysis (default: 1d)",
      "default": "1d"
    }
  },
  "required": ["symbol"]
}
```

4. **API Configuration (in OpenAI Agent Builder):**

   - **Method:** GET
   - **URL:** `https://v0-modern-e-commerce-website-sigma-seven.vercel.app/api/fmp/signal`
   - **Query Parameters:** `symbol={{symbol}}&timeframe={{timeframe}}`
   - **Headers:** None required
   - **Note:** In Agent Builder, configure as an "HTTP Function" or "API Function"

#### Function 3: `get_news`

1. **Function Name:** `get_news`

2. **Description:**

```text
Get the latest financial news. Can filter by symbol or get general market news.
Use this when the user asks about news, recent events, or market updates.
Examples: "What's the latest news?", "Any news about AAPL?", "Show me crypto news"
```

3. **Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "symbol": {
      "type": "string",
      "description": "Optional: Filter news by symbol (e.g., AAPL, BTCUSD). Leave empty for general news."
    },
    "limit": {
      "type": "number",
      "description": "Number of articles to return (default: 10, max: 50)",
      "default": 10,
      "minimum": 1,
      "maximum": 50
    }
  }
}
```

4. **API Configuration (in OpenAI Agent Builder):**

   - **Method:** GET
   - **URL:** `https://v0-modern-e-commerce-website-sigma-seven.vercel.app/api/fmp/news`
   - **Query Parameters:** `symbol={{symbol}}&limit={{limit}}`
   - **Headers:** None required
   - **Note:** In Agent Builder, configure as an "HTTP Function" or "API Function"

### Step 3: Update System Prompt in Agent Builder

In your OpenAI Agent Builder workflow, update the system prompt (usually in the "Assistant" or "System" node) to make the agent conversational and smart about when to use functions:

```text
You are a friendly, conversational AI trading assistant for LIIRAT. You help users with market data, trading signals, and financial news.

**IMPORTANT - Function Usage:**
- Use get_price(symbol) ONLY when the user explicitly asks about price, current value, or market data for a specific symbol
- Use get_signal(symbol) ONLY when the user asks about trading signals, technical analysis, or buy/sell recommendations
- Use get_news(symbol) ONLY when the user asks about news or recent events
- For general conversation, greetings, or questions that don't need data, respond naturally WITHOUT calling any functions

**Conversational Guidelines:**
- Be friendly, helpful, and natural - not robotic
- If a user asks "how are you?" or makes small talk, respond conversationally without calling functions
- When you DO use a function, explain the results in a natural, conversational way
- If data is unavailable, explain it naturally: "I couldn't find price data for that symbol. Could you check the symbol spelling?"

**Response Style:**
- Always respond in the same language the user uses (Arabic or English)
- Use emojis sparingly and appropriately
- Format numbers clearly (e.g., "175.50" or "1.33%")
- When presenting signals, explain what they mean in simple terms

**Examples:**
- User: "What's AAPL price?" → Call get_price("AAPL"), then respond: "Apple (AAPL) is currently trading at $175.50, up 1.33% today."
- User: "Should I buy TSLA?" → Call get_signal("TSLA"), then respond conversationally with the signal and reasoning
- User: "Hello!" → Respond naturally: "Hello! How can I help you with trading today?"
- User: "What do you think about the market?" → Respond conversationally without calling functions (unless they ask for specific data)
```

### Step 4: Test Your Functions


1. **Test in OpenAI Agent Builder:**
   - Use the "Test" or "Preview" feature in OpenAI's Agent Builder interface
   - Try: "What's the price of AAPL?"
   - Try: "What's the signal for TSLA?"
   - Try: "Show me the latest news"
   - Verify that functions are called only when needed (not for "hello" or general chat)

2. **Verify API Endpoints (Test Before Adding to Agent Builder):**
   - Test directly: `https://v0-modern-e-commerce-website-sigma-seven.vercel.app/api/fmp/price?symbol=AAPL`
   - Should return JSON with price data
   - If endpoints work, then add them to Agent Builder

## Latency Optimization

### Why Functions Don't Slow Down Normal Chat

- **Functions are only called when needed** - If the user says "hello", no function is called
- **API endpoints are fast** - Vercel serverless functions respond in ~100-300ms
- **Caching** - Responses are cached for 30-60 seconds to reduce repeated calls
- **Parallel requests** - Multiple indicators fetched in parallel for signals

### Best Practices

1. **Keep functions simple** - Each endpoint does one thing well
2. **Use caching** - API responses include cache headers
3. **Error handling** - Functions return clear errors that the agent can explain naturally
4. **No unnecessary calls** - System prompt ensures functions only called when relevant

## Troubleshooting

### Function Not Being Called

- Check the system prompt - agent might not understand when to use the function
- Verify function description is clear about use cases
- Test the API endpoint directly to ensure it works

### Slow Responses

- Check Vercel function logs for latency
- Ensure FMP_API_KEY is set in Vercel environment variables
- Verify FMP Premium plan has sufficient rate limits

### Wrong Data Returned

- Check symbol format (should be uppercase, e.g., "AAPL" not "aapl")
- Verify FMP API is returning data for that symbol
- Check API endpoint logs for errors

## Important Notes

### Where to Configure Functions

- **All function configuration happens inside OpenAI Platform** → ChatKit → Agent Builder
- Your backend API endpoints (on Vercel) are just HTTP endpoints that Agent Builder calls
- You don't need any external Agent Builder tool - everything is in OpenAI's interface

### Production Domain Update

When you switch to production domain, update the function URLs in OpenAI Agent Builder:

- **Current:** `https://v0-modern-e-commerce-website-sigma-seven.vercel.app`
- **Future:** `https://liiratnews.com`

To update: Go to Agent Builder → Edit each function → Update the URL → Save workflow

### Workflow ID

Your current ChatKit workflow ID: `wf_68fa5dfe9d2c8190a491802fdc61f86201d5df9b9d3ae103`

This is configured in your `.env.local` as `CHATKIT_WORKFLOW_ID`.
