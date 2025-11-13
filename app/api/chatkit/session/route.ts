import { NextResponse } from "next/server"
import { createServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Verify authentication from Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const supabase = createServerClient()
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return NextResponse.json(
          { error: "Unauthorized. Please sign in to use ChatKit." },
          { status: 401 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to use ChatKit." },
        { status: 401 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    const workflowId = process.env.CHATKIT_WORKFLOW_ID?.trim()

    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY")
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    if (!workflowId) {
      console.error("Missing CHATKIT_WORKFLOW_ID")
      return NextResponse.json(
        { error: "Missing CHATKIT_WORKFLOW_ID" },
        { status: 500 }
      )
    }

    // Log API key prefix for debugging (first 15 chars only)
    console.log("[ChatKit] Using API key prefix:", apiKey.substring(0, 15) + "...")
    console.log("[ChatKit] Workflow ID:", workflowId)

    // Use OpenAI REST API directly for ChatKit sessions
    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1", // REQUIRED for ChatKit API
      },
      body: JSON.stringify({
        workflow: {
          id: workflowId,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[ChatKit] OpenAI API error:", response.status, errorText)
      
      // Try to parse error JSON for better error messages
      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = JSON.stringify(errorJson, null, 2)
        console.error("[ChatKit] Parsed error:", errorJson)
      } catch {
        // Not JSON, use as-is
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create ChatKit session",
          details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
          status: response.status
        },
        { status: response.status }
      )
    }

    const session = await response.json()
    console.log("[ChatKit] Session response keys:", Object.keys(session))

    if (!session?.client_secret) {
      console.error("[ChatKit] No client_secret in response:", session)
      return NextResponse.json(
        { 
          error: "Invalid session response: missing client_secret",
          details: process.env.NODE_ENV === "development" ? JSON.stringify(session, null, 2) : undefined
        },
        { status: 500 }
      )
    }

    console.log("[ChatKit] Session created successfully")
    return NextResponse.json(
      { client_secret: session.client_secret },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (err) {
    console.error("[ChatKit] Unexpected error:", err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    
    console.error("[ChatKit] Full error details:", {
      message: errorMessage,
      stack: errorStack,
      type: err?.constructor?.name,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      hasWorkflowId: !!process.env.CHATKIT_WORKFLOW_ID,
    })
    
    return NextResponse.json(
      { 
        error: "Failed to create ChatKit session",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
