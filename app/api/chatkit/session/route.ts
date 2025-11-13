import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    const workflowId = process.env.CHATKIT_WORKFLOW_ID

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
    return NextResponse.json(
      { error: "Failed to create ChatKit session" },
      { status: 500 }
    )
  }
}

