# ChatKit Agent Debugging Guide

## Issue: Agent Not Responding to Price Queries

If the agent is not responding when you ask about prices, follow this debugging checklist:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Look for errors or logs starting with `[ChatKit Client]` or `[ChatKit]`
4. Common issues:
   - `[ChatKit Client] No session found` → Authentication issue
   - `[ChatKit Client] Session API error` → Check server logs
   - `Failed to create ChatKit session` → Check environment variables

## Step 2: Check Network Requests

1. Open Developer Tools → **Network** tab
2. Filter by "chatkit" or "session"
3. Check the `/api/chatkit/session` request:
   - **Status:** Should be `200 OK`
   - **Response:** Should contain `{"client_secret": "..."}`
   - If `401`: Authentication issue
   - If `500`: Server error (check server logs)

## Step 3: Test API Endpoints Directly

### Test ChatKit Session Endpoint

```bash
# First, get your auth token from browser localStorage or cookies
# Then test:
curl -X POST http://localhost:3000/api/chatkit/session \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:

```json
{
  "client_secret": "ck_..."
}
```

### Test Price Endpoint

```bash
curl http://localhost:3000/api/get_symbol_price?symbol=AAPL
```

Expected response:

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "price": 175.50,
  ...
}
```

### Test Configuration Endpoint

```bash
curl http://localhost:3000/api/chatkit/test \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
```

This will show:

- Environment variables status
- Authentication status
- Configuration checks

## Step 4: Verify Agent Builder Configuration

### Check Function Tools Are Added

1. Go to OpenAI Platform: <https://platform.openai.com/chatkit/agent-builder>
2. Open your workflow: `wf_68fa5dfe9d2c8190a491802fdc61f86201d5df9b9d3ae103`
3. Verify you have **Function** nodes configured:
   - `get_symbol_price`
   - `submit_trade_signal`
   - `get_news`

### Check Function URLs

Each function should have the correct URL:

- **get_symbol_price:**
  - URL: `https://v0-modern-e-commerce-website-sigma-seven.vercel.app/api/get_symbol_price`
  - Method: `GET`
  - Query Params: `symbol={{symbol}}`

- **submit_trade_signal:**
  - URL: `https://v0-modern-e-commerce-website-sigma-seven.vercel.app/api/submit_trade_signal`
  - Method: `GET`
  - Query Params: `symbol={{symbol}}&timeframe={{timeframe}}`

- **get_news:**
  - URL: `https://v0-modern-e-commerce-website-sigma-seven.vercel.app/api/fmp/news`
  - Method: `GET`
  - Query Params: `symbol={{symbol}}&limit={{limit}}` (both optional)

### Check System Prompt

The system prompt should include instructions to use functions:

```text
**IMPORTANT - Function Usage:**
- Use get_symbol_price(symbol) ONLY when the user explicitly asks about price...
```

## Step 5: Test in Agent Builder Playground

1. In OpenAI Agent Builder, use the **Test** or **Preview** feature
2. Try these queries:
   - "What's the price of AAPL?"
   - "Show me TSLA price"
   - "How much is BTCUSD?"
3. Check if functions are being called:
   - Look for function call indicators in the test interface
   - Check if API endpoints are being hit (check server logs)

## Step 6: Check Server Logs

Look for these log messages:

### Successful Session Creation

```text
[ChatKit] Using API key prefix: sk-...
[ChatKit] Workflow ID: wf_...
[ChatKit] User ID: ...
[ChatKit] Session created successfully
```

### Function Calls

```text
[FMP Price] Error for AAPL: ... (if error occurs)
[FMP Signal] Unexpected error for AAPL: ... (if error occurs)
```

### Errors

```text
[ChatKit] OpenAI API error: 400 ...
[ChatKit] Missing OPENAI_API_KEY
[ChatKit] Missing CHATKIT_WORKFLOW_ID
[FMP Price] Error for AAPL: ...
[FMP Signal] Unexpected error for AAPL: ...
```

## Step 7: Common Issues and Solutions

### Issue 1: "No response from agent"

**Possible Causes:**

- Functions not configured in Agent Builder
- System prompt doesn't instruct agent to use functions
- API endpoints returning errors

**Solution:**

1. Verify functions are added in Agent Builder
2. Update system prompt with function usage instructions
3. Test API endpoints directly

### Issue 2: "Agent responds but doesn't call functions"

**Possible Causes:**

- System prompt too restrictive
- Function descriptions unclear
- Agent doesn't recognize when to use functions

**Solution:**

1. Make system prompt more explicit about function usage
2. Improve function descriptions in Agent Builder
3. Add more examples in system prompt

### Issue 3: "Function called but returns error"

**Possible Causes:**

- API endpoint URL incorrect
- Missing environment variables (FMP_API_KEY)
- CORS issues

**Solution:**

1. Verify API endpoint URLs in Agent Builder
2. Check environment variables in Vercel
3. Test endpoints directly

### Issue 4: "Session creation fails"

**Possible Causes:**

- Missing OPENAI_API_KEY
- Missing CHATKIT_WORKFLOW_ID
- Invalid API key
- Domain not verified

**Solution:**

1. Check environment variables
2. Verify API key is valid
3. Check domain allowlist in OpenAI Platform

## Step 8: Enable Detailed Logging

The chat panel now includes detailed console logging. Check browser console for:

- `[ChatKit Client] Requesting new session...`
- `[ChatKit Client] Session found, calling /api/chatkit/session`
- `[ChatKit Client] Session API response status: 200`
- `[ChatKit Client] Session created successfully`

## Step 9: Test Function Calls Manually

Test if the agent can call functions by testing in Agent Builder:

1. Go to Agent Builder → Test
2. Type: "What's the price of AAPL?"
3. Check if `get_symbol_price` function is called
4. Check server logs for API call to `/api/get_symbol_price`
5. Also test in your app's chat interface and check:
   - Browser Network tab for requests to `/api/get_symbol_price`
   - Server terminal logs for function execution
   - Browser console for any errors

## Step 10: Verify Environment Variables

Check that these are set in Vercel (and locally in `.env.local`):

- `OPENAI_API_KEY` - Your OpenAI API key (required for ChatKit sessions)
- `CHATKIT_WORKFLOW_ID` - Your workflow ID: `wf_68fa5dfe9d2c8190a491802fdc61f86201d5df9b9d3ae103` (required for ChatKit sessions)
- `FMP_API_KEY` - Your FMP API key (required for price/signal/news endpoints)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (required for authentication)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (required for authentication)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (optional, for admin operations)

**To check in Vercel:**

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Verify all required variables are set for Production, Preview, and Development

## Quick Test Commands

```bash
# Test session endpoint
curl -X POST http://localhost:3000/api/chatkit/session \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Test price endpoint
curl http://localhost:3000/api/get_symbol_price?symbol=AAPL

# Test configuration
curl http://localhost:3000/api/chatkit/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Still Not Working?

If after following all steps the agent still doesn't respond:

1. **Check Agent Builder logs** - OpenAI Platform may have logs showing function call attempts
2. **Verify workflow is published/deployed** - Unpublished workflows won't work in production
3. **Check domain allowlist** - Your domain must be in OpenAI's allowlist at <https://platform.openai.com/settings/organization/security/domain-allowlist>
4. **Test with simple query** - Try "Hello" first to see if agent responds at all (this tests basic ChatKit connection)
5. **Check ChatKit widget** - Make sure the widget is loading (check for errors in console)
6. **Verify function names match exactly** - Function names in Agent Builder must match: `get_symbol_price`, `submit_trade_signal`, `get_news`
7. **Check function descriptions** - Ensure function descriptions in Agent Builder clearly explain when to use each function
8. **Test API endpoints directly** - Use curl or Postman to verify endpoints work before testing in Agent Builder
9. **Check CORS** - Ensure your API endpoints allow requests from OpenAI's servers
10. **Verify authentication** - Make sure you're signed in and the session token is valid

## Next Steps

Once you identify the issue:

1. Fix the configuration in Agent Builder
2. Update system prompt if needed
3. Test again with a simple price query
4. Check server logs for function calls
