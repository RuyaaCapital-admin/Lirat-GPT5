import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test connection by querying a simple table or checking connection
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)
      .maybeSingle()

    // If table doesn't exist, that's okay - we just want to test the connection
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" which is fine for connection test
      throw error
    }

    // Alternative: test with a simple RPC call or check connection
    const { data: healthCheck, error: healthError } = await supabase.rpc('version').single().catch(() => ({ data: null, error: null }))

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
  } catch (error: any) {
    console.error('Supabase connection test failed:', error)
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

