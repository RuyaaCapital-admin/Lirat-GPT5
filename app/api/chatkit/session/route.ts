import { NextResponse } from "next/server"

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY")
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      )
    }

    if (!process.env.CHATKIT_WORKFLOW_ID) {
      console.error("Missing CHATKIT_WORKFLOW_ID")
      return NextResponse.json(
        { error: "Missing CHATKIT_WORKFLOW_ID" },
        { status: 500 }
      )
    }

    // Use OpenAI REST API directly since chatkit is not in the SDK
    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow: {
          id: process.env.CHATKIT_WORKFLOW_ID,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API error:", response.status, errorText)
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`)
    }

    const session = await response.json()

    if (!session?.client_secret) {
      console.error("No client_secret in response:", session)
      throw new Error("Invalid session response: missing client_secret")
    }

    return NextResponse.json(
      { client_secret: session.client_secret },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (err) {
    console.error("ChatKit session error", err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    
    console.error("Full error details:", {
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
