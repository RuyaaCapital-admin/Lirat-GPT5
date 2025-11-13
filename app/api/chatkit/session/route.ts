import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY
  const workflowId = process.env.CHATKIT_WORKFLOW_ID

  try {
    if (!apiKey) {
      console.error("[ChatKit] OPENAI_API_KEY is missing")
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      )
    }

    if (!workflowId) {
      console.error("[ChatKit] CHATKIT_WORKFLOW_ID is missing")
      return NextResponse.json(
        { error: "CHATKIT_WORKFLOW_ID is not configured" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey,
    })

    // ChatKit API is available but may not be in TypeScript definitions yet
    const session = await (openai as any).chatkit.sessions.create({
      workflow: { id: workflowId },
    })

    if (!session?.client_secret) {
      console.error("[ChatKit] Session created but no client_secret in response")
      return NextResponse.json(
        { error: "Invalid session response" },
        { status: 500 }
      )
    }

    return NextResponse.json({ client_secret: session.client_secret })
  } catch (error) {
    console.error("ChatKit session failed", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = error instanceof Error ? error.stack : undefined
    
    console.error("[ChatKit] Error details:", {
      message: errorMessage,
      stack: errorDetails,
      apiKey: apiKey ? "***" : "missing",
      workflowId: workflowId || "missing",
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

