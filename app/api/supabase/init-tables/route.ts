import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createServerClient()

    // Create tables SQL
    const tables = [
      // Users table (if not using Supabase Auth)
      `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      
      // Alerts table
      `
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'volume_spike', 'news_alert')),
        target_value NUMERIC,
        is_active BOOLEAN DEFAULT true,
        triggered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      
      // Market data cache table
      `
      CREATE TABLE IF NOT EXISTS market_data_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol TEXT NOT NULL,
        data_type TEXT NOT NULL,
        data JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(symbol, data_type)
      );
      `,
      
      // Chat history (for AI chat)
      `
      CREATE TABLE IF NOT EXISTS chat_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        thread_id TEXT,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      
      // User preferences
      `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
        locale TEXT DEFAULT 'en',
        theme TEXT DEFAULT 'light',
        chart_settings JSONB,
        notification_settings JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
    ]

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);',
      'CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active) WHERE is_active = true;',
      'CREATE INDEX IF NOT EXISTS idx_market_data_symbol_type ON market_data_cache(symbol, data_type);',
      'CREATE INDEX IF NOT EXISTS idx_market_data_expires ON market_data_cache(expires_at);',
      'CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_chat_history_thread_id ON chat_history(thread_id);',
      'CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);',
    ]

    const results = []

    // Execute table creation
    for (const tableSQL of tables) {
      const { error } = await supabase.rpc('exec_sql', { sql: tableSQL }).catch(async () => {
        // If exec_sql doesn't exist, try direct query (this won't work but shows the SQL)
        return { error: { message: 'Need to run SQL manually or use Supabase SQL editor' } }
      })
      
      if (error) {
        results.push({ 
          type: 'table', 
          sql: tableSQL.substring(0, 100) + '...', 
          error: error.message 
        })
      } else {
        results.push({ 
          type: 'table', 
          sql: tableSQL.substring(0, 100) + '...', 
          success: true 
        })
      }
    }

    // Execute index creation
    for (const indexSQL of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL }).catch(() => ({
        error: { message: 'Need to run SQL manually' }
      }))
      
      if (error) {
        results.push({ 
          type: 'index', 
          sql: indexSQL, 
          error: error.message 
        })
      } else {
        results.push({ 
          type: 'index', 
          sql: indexSQL, 
          success: true 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Table creation attempted. Check results for any errors.',
      results,
      note: 'If exec_sql RPC is not available, run the SQL manually in Supabase SQL Editor'
    })
  } catch (error: any) {
    console.error('Table initialization failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

