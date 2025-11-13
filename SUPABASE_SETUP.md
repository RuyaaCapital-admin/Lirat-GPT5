# Supabase Setup Guide

## Environment Variables Required

Add these to your `.env.local` file (for local development) and Vercel environment variables (for production):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://lmqgafeczccqpxqvyjah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Getting Your Supabase Credentials

1. Go to your Supabase project: [https://supabase.com/dashboard/project/lmqgafeczccqpxqvyjah](https://supabase.com/dashboard/project/lmqgafeczccqpxqvyjah)
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Setting Up the Database

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/lmqgafeczccqpxqvyjah/sql)
2. Open the `supabase-schema.sql` file in this project
3. Copy and paste the entire SQL into the Supabase SQL Editor
4. Click **Run** to execute

### Option 2: Using API Endpoint

After setting environment variables, you can call:
```
POST http://localhost:3000/api/supabase/init-tables
```

**Note:** Replace `localhost:3000` with your production domain when deployed. The main domain is configured in your Supabase project settings and should be updated in the OAuth redirect URLs.

Note: This requires the `exec_sql` RPC function to be set up in Supabase.

## Testing the Connection

Once environment variables are set:

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/supabase/test` (or your production domain)
3. You should see a success response with connection details

## Tables Created

The schema creates the following tables:

1. **users** - Public user profiles (extends auth.users)
2. **alerts** - User price/volume alerts
3. **market_data_cache** - Cached market data
4. **chat_history** - AI chat conversation history
5. **user_preferences** - User settings and preferences

All tables include:
- Row Level Security (RLS) policies
- Proper indexes for performance
- Automatic `updated_at` timestamps
- Foreign key relationships to `auth.users`

## Using Supabase in Your Code

```typescript
import { supabase } from '@/lib/supabase'

// Client-side usage
const { data, error } = await supabase
  .from('alerts')
  .select('*')
  .eq('user_id', userId)

// Server-side usage (API routes)
import { createServerClient } from '@/lib/supabase'
const supabase = createServerClient()
```

